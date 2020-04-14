// from https://gist.github.com/laserbat/3c16c645e8c6b5b375da904d6d85ac8d

const SYNTH_COUNT = 128

const GLOBAL_PITCH = 0.005
const DETUNE_START = 0.001
const DETUNE_STEP = 100
const FREQ_START = 0.8

const LEFT_NONLIN = 2
const RIGHT_NONLIN = -3

const OCTAVE_DOWN = 0.5
const MIN_THIRD = 1.2
const MAJ_THIRD = 1.125
const P_FIFTH = 1.5

const table = [];

function saw(t) {
  return t & 255;
}

function init_table() {
  for (let i = 0; i < SYNTH_COUNT; ++i) {
    let freq = FREQ_START;
    let scale = DETUNE_START;

    let j = i;
    while (j > 0) {
      freq += (j & 1) * scale;
      j >>= 1;
      scale /= DETUNE_STEP;
    }

    table[i] = freq;
  }
}

function mix(t, mul) {
  let shift = 0, out = 0, max = 0;
  const chan = t & 1;

  t >>= 1;

  for (let i = 0; i < SYNTH_COUNT; ++i) {
    const freq = table[i];
    const amp = (i + 1) / SYNTH_COUNT;
    const val = saw(0.5 + mul * freq * t + shift);

    shift += val;
    max += amp;

    out += val * (chan ? amp : 1 - amp);
    shift += chan ? LEFT_NONLIN : RIGHT_NONLIN;
  }

  return (uint8_t)(out / max + 0.5);
}

function chord(t, mul) {
  return (
    mix(t, mul) +
    mix(t, mul * P_FIFTH) +
    mix(t, mul * (((t >> 20) & 1) ? MAJ_THIRD : MIN_THIRD)) +
    mix(t, mul * OCTAVE_DOWN)
  ) >> 2;
}

function octaves(t, mul) {
  return (
    chord(t, mul * OCTAVE_DOWN) +
    chord(t, mul)
  ) >> 1;
}

function main() {
  let t = 0;

  init_table();

  while (1) {
    t += 1;
    putchar(octaves(t, GLOBAL_PITCH));
  }
}
