



export default function drum(
  model_type,
  decay,
  body,
  tune
) {
  return [
    (out, count) => {

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
      ]
    ) => {
      for (let [
        exciter_type,
        mod_type,
        env_type,
        level,
        pitch,
        env_attack,
        env_release,
        mod_amount,
        mod_rate
      ] of layers) {
      }

      return () => {
      };
    }
  ];
}
