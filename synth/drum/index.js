



export default function drum(
  sample_rate = 44100,
  model_type = 0,
  decay = 0,
  body = 0,
  tune = 0
) {
  let voices = [];

  let exciters = [
    v => Math.sin(v * 6.283184),
    v => (v % 1) - .5,
  ];

  return [
    (left, right, count) => {

      next: for (let i = voices.length; i > 0; --i) {
        let [o, buffer] = voices[i - 1];

        for (let j = 0; j < count; ++j) {
          if (o >= buffer.length) {
            voices.splice(i - 1, 1);
            break next;
          }

          let s = buffer[o++];

          left[j] += s;
          right[j] += s;
        }

        voices[i - 1][0] = o;
      }
    },
    (
      [
        layers,
        waveguide_send,
        bit_reduction,
        fold,
        drive,
        pan,
        gain
      ] = [
          [
            [0, 0, 0, 1, 1000, 100000, 3 , .1],
            [0, 1, 0, 1, 100, 100000, 3 , 231],
          ],
          0,
          40,
          0,
          1,
          0,
          1
        ]
    ) => {
      return (note) => {
        let buffer = [];

        for (let [
          exciter_type,
          mod_type,
          env_type,
          level,
          env_attack,
          env_release,
          mod_amount,
          mod_rate
        ] of layers) {
          let len = env_attack + env_release;
          let exciter = exciters[exciter_type];
          let ot = 0.00396 * Math.pow(2, (note - 128) / 12);
          let c = 0;
          let mod;
          let s = 0;

          if (mod_type === 0) {
            let mod_attack = len * mod_rate;
            mod = i => i < mod_attack ? i / mod_attack : 1 - (i - mod_attack) / (len - mod_attack);
          } else if (mod_type === 1) {
            mod = i => Math.sin(i * 6.283184 * mod_rate);
          }

          for (let i = 0; i < len; ++i) {
            if (i % (bit_reduction + 1) === 0) {
              s = i < env_attack ? i / env_attack : 1 - (i - env_attack) / env_release;
              s *= drive;
              s *= exciter(c);
              s *= level;
            }


            c += ot;
            if (mod) c += mod(i) * mod_amount * 0.001;

            buffer[i] = (buffer[i] || 0) + s;
          }
        }

        voices.push([
          0,
          buffer,

        ]);
      };
    }
  ];
}
