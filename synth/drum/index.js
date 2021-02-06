


export function waveguide(length, damping) {
  const buffer = [];
  let position = 0;

  for (let i = 0; i < delay_length; ++i) {
    buffer[i] = 0;
  }

  return (samples, count) => {
    let next_delay_position = (delay_position + 1) % delay_length;

    let waveguide_out = delay_buffer[delay_position];
    delay_buffer[delay_position] = damping * (delay_buffer[delay_position] + to_waveguide[i] + delay_buffer[next_delay_position]);

    delay_position = next_delay_position;


    left[i] += waveguide_out;
    right[i] += waveguide_out;
  }
}


export default function drum(
  sample_rate = 44100,
  model_type = 0,
  decay = 0,
  body = 0,
  tune = 0
) {
  let voices = [];
  let to_waveguide = [];
  let exciters = [
    v => Math.sin(v * 6.283184),
    v => (v % 1) - .5,
    v => (Math.random() * 2) - 1
  ];
  let delay_buffer = [];
  let delay_length = 1111;
  let delay_position = 0;
  let damping = 0.399;

  for (let i = 0; i < delay_length; ++i) {
    delay_buffer[i] = 0;
  }

  return [
    (left, right, count) => {
      let i, j;

      for (i = 0; i < count; ++i) {
        to_waveguide[i] = 0;
      }

      next: for (i = voices.length; i > 0; --i) {
        let [o, buffer, waveguide_send] = voices[i - 1];
        let one_minus_waveguide_send = 1 - waveguide_send;
        for (j = 0; j < count; ++j) {
          if (o >= buffer.length) {
            voices.splice(i - 1, 1);
            break next;
          }
          let s = buffer[o++];
          to_waveguide[j] += s * waveguide_send;
          left[j] += s * one_minus_waveguide_send;
          right[j] += s * one_minus_waveguide_send;
        }

        voices[i - 1][0] = o;
      }

      for (i = 0; i < count; ++i) {
        let next_delay_position = (delay_position + 1) % delay_length;

        let waveguide_out = delay_buffer[delay_position];
        delay_buffer[delay_position] = damping * (delay_buffer[delay_position] + to_waveguide[i] + delay_buffer[next_delay_position]);

        delay_position = next_delay_position;


        left[i] += waveguide_out;
        right[i] += waveguide_out;

      }
    },
    ([
      layers,
      waveguide_send,
      bit_reduction,
      fold,
      drive,
      pan,
      gain
    ]) => {
      waveguide_send = waveguide_send || 0;

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
              if (fold) s = Math.sin(s * fold);
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
          waveguide_send
        ]);
      };
    }
  ];
}
