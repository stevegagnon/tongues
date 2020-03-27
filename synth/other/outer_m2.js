// music from http://www.p01.org/OUTER_M2/

export default function outerM2() {
  let u = [0];

  for (let i = 1; i < 1000000; ++i) {
    let t = i / 44100;
    u[i] = (((.15 * t * [400, 500][t * 64 & 1]) % 1 + (.15 * t * [440, 523, 666, 784][t * 7 & 3]) % 1 - 1) * (1 - t / 8 % 1)) * .1 + u[i - 1] * .9
  }
  console.log(u);

  return [u];
}
