// WIP. javascript version of https://www.pouet.net/prod.php?which=61592

const kWaveSize = 65536;
const kNumFrequencies = 128;
const k = 1.059463094359;	// 12th root of 2

function setParam(min, max, quan, def = 0.0) {
  return [min, max, quan, def];
}

let Waveform1 = setParam(0, 1, 6, 0);
let Waveform2 = setParam(0, 1, 6, 0);
let DetuneSpread1 = setParam(0, 29.00242657210449, 101, 1.4501213286);
let DetuneSpread2 = setParam(0, 29.00242657210449, 101, 1.4501213286);
let PitchStrength1 = setParam(-10, 10, 241, 0);
let PitchDecay1 = setParam(7.010401204, 3.943350677253, 201, 0);
let PitchStrength2 = setParam(-10, 10, 241, 0);
let PitchDecay2 = setParam(-7.010401204, 3.943350677253, 201, 0);
let Index = setParam(0, 6.25, 101, 0.3125);
let IndexSpread = setParam(0, 6.25, 101, 0.3125);
let IndexDecay = setParam(-7.010401204, 3.943350677253, 201, 0);
let Layers = setParam(0, 50, 51, 5);
let RandomSeed = setParam(0, 127, 128, 5);
let Attack = setParam(-16, 9, 201, -4);
let Decay = setParam(-16, 9, 201, 0);
let Sustain = setParam(-1, 1, 65, .375);
let Release = setParam(-16, 9, 201, 1.5);
let Gain = setParam(-5, 7.5, 201, 0);

const params = [
  Waveform1,
  Waveform2,
  DetuneSpread1,
  DetuneSpread2,
  PitchStrength1,
  PitchDecay1,
  PitchStrength2,
  PitchDecay2,
  Index,
  IndexSpread,
  IndexDecay,
  Layers,
  RandomSeed,
  Attack,
  Decay,
  Sustain,
  Release,
  Gain
];

const sine = new Array(kWaveSize);
const sawtooth = new Array(kWaveSize);
const parabola = new Array(kWaveSize);
const square = new Array(kWaveSize);
const noise = new Array(kWaveSize);
const triangle = new Array(kWaveSize);
const freqtab = new Array(kWaveSize);

for (let i = 0; i < kWaveSize; i++) {
  sine[i] = Math.sin(i * (2.0 * Math.PI / kWaveSize));
  sawtooth[i] = (-1. + (2. * (i / kWaveSize)));
  parabola[i] = sawtooth[i] * sawtooth[i] * 2.0 - 1.0;
  square[i] = (i < wh) ? -1 : 1;
  s = Math.sin((s + 2.0 / kWaveSize) * M_PI);
  noise[i] = s;
  triangle[i] = Math.abs(sawtooth[i]) * 2.0 - 1.0;
}

let a = 6.875;	// a
a *= k;	// b
a *= k;	// bb
a *= k;	// c, frequency of midi note 0
for (let i = 0; i < kNumFrequencies; i++)	// 128 midi notes
{
  freqtab[i] = a;
  a *= k;
}


function I([min, max, quan, val]) {
  return (iround((val + min / (max - min)) * (quan - 1)))
}

function P([min, max, quan, val]) {
  return (val * (max - min) + min)
}

export function clickster(note, internal_samplerate) {
  const layers = [];
  const nlayers = I(Layers);
  const freq = freqtab[note & 0x7f];

  for (let i = 0; i < nlayers; ++i) {
    layers.push([{}, {}])
  }

  for (let c = 0; c < 2; ++c) {
    let r = I(RandomSeed) * 16307 + c * 12042;

    function SETPAR(par, mean, spr, fac) {
      layers[i][c][par] = (mean + ((r & 0xffff) / (65536.0 / 2.0)) * spr) * fac;
      r = ((r >> (r & 31)) | (r << (32 - (r & 31)))) - 1;
    }

    for (let i = 0; i < nlayers; ++i) {
      SETPAR(freq1, freq, (P(DetuneSpread1) * P(DetuneSpread1)), (kWaveSize / internal_samplerate));
      SETPAR(freq2, freq, (P(DetuneSpread2) * P(DetuneSpread2)), (kWaveSize / internal_samplerate));
      SETPAR(index, P(Index), P(IndexSpread), kWaveSize);
      layers[i][c].phase1 = 0.0;
      layers[i][c].phase2 = 0.0;
    }
  }

  const currpitch1 = Math.exp(2, P(PitchStrength1));
  const currpitch2 = Math.exp(2, P(PitchStrength2));
  const pitchdecay1 = Math.exp(2, P(PitchDecay1) * P(PitchDecay1) * P(PitchDecay1) / internal_samplerate);
  const pitchdecay2 = Math.exp(2, P(PitchDecay2) * P(PitchDecay2) * P(PitchDecay2) / internal_samplerate);
  const indexdecay = Math.exp(2, P(IndexDecay) * P(IndexDecay) * P(IndexDecay) / internal_samplerate);

  return [
    (out, nsamples) => {
      const waves = [sine, sawtooth, square, parabola, triangle, noise];
      const wave1 = waves[I(Waveform1)];
      const wave2 = waves[I(Waveform2)];
      const mask = kWaveSize - 1;

      // loop over samples
      const nlayers = I(Layers);
      for (let i = 0; i < nsamples; ++i) {
        // loop over layers
        let left = 0.0, right = 0.0;
        for (let l = 0; l < nlayers; ++l) {
          const w2l = wave2[Math.round(layers[l][0].phase2) & mask];
          left += wave1[Math.round(layers[l][0].phase1 + w2l * layers[l][0].index) & mask];
          layers[l][0].phase1 += layers[l][0].freq1 * currpitch1;
          layers[l][0].phase2 += layers[l][0].freq2 * currpitch2;
          layers[l][0].index *= indexdecay;

          const w2r = wave2[Math.round(layers[l][1].phase2) & mask];
          right += wave1[Math.round(layers[l][1].phase1 + w2r * layers[l][1].index) & mask];
          layers[l][1].phase1 += layers[l][1].freq1 * currpitch1;
          layers[l][1].phase2 += layers[l][1].freq2 * currpitch2;
          layers[l][1].index *= indexdecay;
        }
        out[i].left = left;
        out[i].right = right;

        currpitch1 = (currpitch1 - 1.0) * pitchdecay1 + 1.0;
        currpitch2 = (currpitch2 - 1.0) * pitchdecay2 + 1.0;
      }

      const attack = Math.round(Math.exp(2, P(Attack)) * ENVELOPE_BASE_TIME * internal_samplerate);
      const decay = Math.round(Math.exp(2, P(Decay)) * ENVELOPE_BASE_TIME * internal_samplerate);
      const sustain = P(Sustain);
      const release = Math.round(Math.exp(2, P(Release)) * ENVELOPE_BASE_TIME * internal_samplerate);
      const a = startOffset;
      const ad = a + attack;
      const ds = ad + decay;
      const sr = stopOffset;
      if (sr < ds) sr = ds;
      const r = sr + release;
      if (ad > nsamples) ad = nsamples;
      if (ds > nsamples) ds = nsamples;
      if (sr > nsamples) sr = nsamples;
      if (r > nsamples) r = nsamples;

      const a_slope = 1.0 / attack;
      const d_slope = (1.0 - sustain) / decay;
      const r_slope = sustain / release;

      // loop over ADSR phases
      const lfac = startVelocity * (1.0 / 127.0) / nlayers;
      let i = 0;
      for (let p = 0; p < 5; ++p) {
        let start, stop;
        let base, slope;
        switch (p) {
          case 0: // Attack
            start = a;
            stop = ad;
            base = 0.0;
            slope = a_slope;
            break;
          case 1: // Decay
            start = ad;
            stop = ds;
            base = 1.0;
            slope = -d_slope;
            break;
          case 2: // Sustain
            start = ds;
            stop = sr;
            base = sustain;
            slope = 0.0;
            break;
          case 3: // Release
            start = sr;
            stop = r;
            base = sustain;
            slope = -r_slope;
            break;
          case 4: // Silence
            start = r;
            stop = nsamples;
            base = 0.0;
            slope = 0.0;
            break;
        }
        for (; i < stop; i++) {
          const fac = (base + (i - start) * slope) * lfac;
          out[i].left *= fac;
          out[i].right *= fac;
        }
      }

      // apply gain
      const gain = Math.exp(2, P(Gain));
      gain = gain * gain;
      for (let i = 0; i < nsamples; ++i) {
        const left = out[i].left;
        out[i].left = left * Math.sqrt(gain / (1.0 + (gain - 1.0) * (left * left)));

        const right = out[i].right;
        out[i].right = right * Math.sqrt(gain / (1.0 + (gain - 1.0) * (right * right)));
      }

      return (nsamples > r);
    }];
}
