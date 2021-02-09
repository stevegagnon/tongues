const BASE_SAMPLE_RATE = 44100;

function p100(value) {
  return Math.floor(value * 100.0 + 0.5);
}

// export function default_values() {
//   const nbufs = 32 * 2;
//   const mix = 0.1 * 10.0 / Math.sqrt(nbufs);
//   const bal = 0.5;
//   const decay = Math.pow(.5, 1.0 / (0.5 * BASE_SAMPLE_RATE));
//   const delaymax = 13 * 256;
//   const delaymin = 7 * 256;

//   return [
//     Math.pow(decay, delaymax), // max_decay
//     0, // delayadd
//     1, // filterlow
//     1, // filterhigh
//     1, // dampenlow
//     1, // dampenhigh
//     delaymin, // delaymin
//     delaymax, // delaymax
//     65536, // seed
//     nbufs, // nbufs
//     [mix * Math.sqrt(2.0 * (1.0 - bal)), mix * Math.sqrt(2.0 * bal)], // volumes
//     1.0 / decay, // decay_mul
//     44100, // sample_rate
//   ];
// }

export function default_values() {
  return [0.900669863586335, 0, 1, 1, 1, 1, 1792, 3328, 65536, 64, [0.125, 0.125], 1.0000314357403763, 44100]
}