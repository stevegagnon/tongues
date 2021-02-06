const TOTAL_SEMITONES = 120;

export function ror(rs, n) {
  n = n & 0x1F;
  return (rs >>> n) | ((rs & ((1 << n) - 1)) << (32 - n));
}

export function generate_random_data(l) {
  const random_data = new Array(l);
  const randomstate = [0x6F15AAF2, 0x4E89D208, 0x9548B49A, 0x9C4FD335];
  for (let i = 0; i < l; ++i) {
    let r = 0;
    for (let s = 0; s < 3; ++s) {
      let rs = randomstate[s];
      rs = (ror(rs, rs) + randomstate[s + 1]) % 2 ** 32;
      randomstate[s] = rs;
      r = r ^ rs;
    }
    random_data[i] = r;
  }
  return random_data;
}

window.generate_random_data = generate_random_data;


export function softclip(v) {
  return v * Math.sqrt(gain / (1 + (gain - 1) * v * v));
}

export function quantize(value, level) {
  let bit = 1 << Math.floor(level * 31.0);
  let mask = ~bit + 1;
  let add = bit >>> 1;
  let bits = new Uint32Array(new Float32Array([value]).buffer)[0];
  bits = (bits + add) & mask;
  if (bits == 0x80000000) {
    bits = 0x00000000;
  }
  return new Float32Array(new Uint32Array([bits]).buffer)[0];
}

export function scale_values([
  sample_rate,
  tone,
  time,
  seed,
  modes,
  fat,
  width,
  overtones,
  sharpness,
  harmonicity,
  decaylow,
  decayhigh,
  filterlow,
  fslopelow,
  fsweeplow,
  filterhigh,
  fslopehigh,
  fsweephigh,
  gain,
]) {

  const v = [
    sample_rate,     // sample_rate
    tone,         // tone
    time,   // time
    Math.floor(seed * 100 + .5),         // seed
    Math.max(1, Math.floor(modes * 100 + .5)),         // modes
    Math.max(1, Math.floor(fat * 100 + .5)),         // fat
    Math.pow(width, 5) * 100,         // width
    Math.floor(overtones * 100 + .5),         // overtones
    sharpness * 5 - 4,         // sharpness
    harmonicity * 2 - 1,         // harmonicity
    decaylow,         // decaylow
    decayhigh,         // decayhigh
    (filterlow * 2 - 1) * TOTAL_SEMITONES,         // filterlow
    Math.pow(1 - fslopelow, 3),         // fslopelow
    Math.pow(fsweeplow - .5, 3) * TOTAL_SEMITONES * 100,         // fsweeplow
    (filterhigh * 2 - 1) * TOTAL_SEMITONES,         // filterhigh
    Math.pow(1 - fslopehigh, 3),         // fslopehigh
    Math.pow(fsweephigh - .5, 3) * TOTAL_SEMITONES * 100,         // fsweephigh
    Math.pow(4096, gain - .25),         // gain
  ];
  console.log(v);
  return v;

}

export function default_values(f) {
  return [
    44100,   // sample_rate
    f,       // tone
    1/44100, // time
    .5,      // seed
    .4,      // modes
    .1,      // fat
    .34,     // width
    .27,     // overtones
    .9,      // sharpness
    1,       // harmonicity
    1,       // decaylow
    1,       // decayhigh
    0,       // filterlow
    0,       // fslopelow
    .5,      // fsweeplow
    1,       // filterhigh
    0,       // fslopehigh
    .5,      // fsweephigh
    .25      // gain
  ];
}

export function random_values(f) {
  const decays = [Math.random(), Math.random()];

  return [
    44100,
    f,
    1/44100,
    Math.random(),
    Math.random(),
    Math.random(),
    Math.random(),
    Math.random(),
    Math.random(),
    Math.random(),
    Math.min(...decays),
    Math.max(...decays),
    Math.random(),
    Math.random(),
    Math.random(),
    Math.random(),
    Math.random(),
    Math.random(),
    .5
  ];
}
