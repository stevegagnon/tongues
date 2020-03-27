
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
