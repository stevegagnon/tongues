

export default function renderKs() {
  let out = [];
  let buf = [];

  let N = 300;

  let damping = 0.494;

  for (let i = 0; i < N; ++i) {
    buf[i] = Math.random() * 2 - 1;
  }

  for (let i = 0; i < 1000000; ++i) {
    out[i] = buf[i % N];
    buf[i % N] = damping * (buf[i % N] + buf[(1 + i) % N]);
  }

  return [out];
}


  /*
  let px = 0, py = 0;
  let f = (1 - .1 + .9 * (N % 1)) / (1 + .1 + .9 * (N % 1));
  py = f * (out[i] - py) + px;
  px = out[i];
  out[i] = py;
  */
