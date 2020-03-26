
const kWaveSize = 65536;
const kNumFrequencies = 128;

function clickster() {
  const layers = [];
  const sine = new Array(kWaveSize);
  const sawtooth = new Array(kWaveSize);
  const parabola = new Array(kWaveSize);
  const square = new Array(kWaveSize);
  const noise = new Array(kWaveSize);
  const triangle = new Array(kWaveSize);
  const freqtab = new Array(kWaveSize);
  const wh = kWaveSize / 2;
  const s = -1.0;

  const setters = [];

  function setParam(min, max, def, quan) {
    setters.push(v => )
    return def;
  }
[0, 0, 1.4501213286, 1.4501213286, 0, 0, 0, 0, 0.3125, 0.3125, 0, 5, 5, -4, 0, 0.375, 1.5, 0];

let Waveform1;
let Waveform2;
let DetuneSpread1;
let DetuneSpread2;
let PitchStrength1;
let PitchDecay1;
let PitchStrength2;
let PitchDecay2;
let Index;
let IndexSpread;
let IndexDecay;
let Layers;
let RandomSeed;
let Attack;
let Decay;
let Sustain;
let Release;
let Gain;

const settrs = [
  let Waveform1 = setParam(0, 1, 6);
  let Waveform2 = setParam(0, 1, 6);
  let DetuneSpread1 = setParam(0, 29.00242657210449, 101);
  let DetuneSpread2 = setParam(0, 29.00242657210449, 101);
  let PitchStrength1 = setParam(-10, 10, 241);
  let PitchDecay1 = setParam(7.010401204, 3.943350677253, 201);
  let PitchStrength2 = setParam(-10, 10, 241);
  let PitchDecay2 = setParam(-7.010401204, 3.943350677253, 201);
  let Index = setParam(0, 6.25, 101);
  let IndexSpread = setParam(0, 6.25, 101);
  let IndexDecay = setParam(-7.010401204, 3.943350677253, 201);
  let Layers = setParam(0, 50, 51);
  let RandomSeed = setParam(0, 127, 128);
  let Attack = setParam(-16, 9, 201);
  let Decay = setParam(-16, 9, 201);
  let Sustain = setParam(-1, 1, 65);
  let Release = setParam(-16, 9, 201);
  let Gain = setParam(-5, 7.5, 201);
];


  for (let i = 0; i < kWaveSize; i++) {
    sine[i] = Math.sin(i * (2.0 * Math.PI / kWaveSize));
    sawtooth[i] = (-1. + (2. * (i / kWaveSize)));
    parabola[i] = sawtooth[i] * sawtooth[i] * 2.0 - 1.0;
    square[i] = (i < wh) ? -1 : 1;
    s = Math.sin((s + 2.0 / kWaveSize) * M_PI);
    noise[i] = s;
    triangle[i] = Math.abs(sawtooth[i]) * 2.0 - 1.0;
  }

  const k = 1.059463094359;	// 12th root of 2
  let a = 6.875;	// a
  a *= k;	// b
  a *= k;	// bb
  a *= k;	// c, frequency of midi note 0
  for (let i = 0; i < kNumFrequencies; i++)	// 128 midi notes
  {
    freqtab[i] = a;
    a *= k;
  }

  let r = 
  function SETPAR(par, mean, spr, fac) {
    layers[i][c][par] = (mean + (((signed short)r) / (65536.0/2.0)) * spr) * fac; \
    r = ((r >> (r & 31)) | (r << (32-(r & 31))))-1; \
  }

}
