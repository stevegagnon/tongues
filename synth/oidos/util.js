
export function ror(rs, n) {
  n = n & 0x1F;
  return (rs >>> n) | ((rs & ((1 << n) - 1)) << (32 - n));
}

export function generate_random_data(l) {
  const random_data = [];
  const randomstate = [0x6F15AAF2, 0x4E89D208, 0x9548B49A, 0x9C4FD335];
  for (let i = 0; i < l; ++i) {
    let r = 0;
    for (let s = 0; s < 3; ++s) {
      let rs = randomstate[s];
      rs = ror(rs, rs) + randomstate[s + 1];
      randomstate[s] = rs;
      r = r ^ rs;
    }
    random_data[i] = r;
  }
  return random_data;
}

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

export function default_values(f) {
  return [
    44100,
    f,
    1/44100,
    .5,
    .4,
    .1,
    .34,
    .27,
    .9,
    1,
    1,
    1,
    0,
    0,
    .5,
    1,
    0,
    .5,
    3
  ];
}

export function random_values(f) {
  const vals = [
    44100,
    f,
    1/44100,
  ];
  for (let i = 0; i < 16; ++i) {
    vals.push(Math.random() * 3);
  }
  return vals;
}
