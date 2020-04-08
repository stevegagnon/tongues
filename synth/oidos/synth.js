import { generate_random_data } from './util.js';

const TARGET_SAMPLE_RATE = 44100.0;
const SEMITONE_RATIO = Math.pow(2, 1 / 12);
const DECAY_TIME = 4096.0 / TARGET_SAMPLE_RATE;

const random_data = generate_random_data(65535);

export default function oidos(
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
) {
  let base_freq = 440.0 * Math.pow(2, -57.0 / 12.0) / sample_rate * 2.0 * Math.PI;
  let n_partials = modes * fat;
  let n_partials_in_array = (n_partials + 3) & ~3;
  let state_re = [];
  let state_im = [];
  let step_re = [];
  let step_im = [];
  let filter_low = [];
  let filter_high = [];

  let f_add_low = - fsweeplow * fslopelow / sample_rate;
  let f_add_high = fsweephigh * fslopehigh / sample_rate;

  let f_lowlimit = filterlow + tone;
  let f_highlimit = filterhigh + tone;

  for (let m = 0; m < modes; ++m) {
    let random_index = m * 256 + seed;

    let getrandom = () => {
      let r = random_data[random_index | 0];
      random_index += 1;
      const res = r / 0x80000000;
      console.log(res);
      return res;
    };

    let subtone = Math.abs(getrandom());
    let reltone = subtone * overtones;
    let decay = decaylow + subtone * (decayhigh - decaylow);
    let ampmul = Math.pow(decay, 1.0 / DECAY_TIME / sample_rate);

    let relfreq = Math.pow(SEMITONE_RATIO, reltone / 12.0);
    let relfreq_ot = Math.floor(relfreq + 0.5);
    let relfreq_h = relfreq + (relfreq_ot - relfreq) * harmonicity;
    reltone = Math.log2(relfreq_h) * 12.0;
    let mtone = tone + reltone;
    let mamp = getrandom() * Math.pow(SEMITONE_RATIO, reltone * sharpness / 12.0);

    for (let i = 0; i < fat; ++i) {
      let ptone = mtone + getrandom() * width;
      let phase = base_freq * Math.pow(SEMITONE_RATIO, ptone / 12.0);
      step_re.push(ampmul * Math.cos(phase));
      step_im.push(ampmul * Math.sin(phase));

      let angle = getrandom() * Math.PI + phase * time;
      let amp = mamp * Math.pow(ampmul, time);

      state_re.push(amp * Math.cos(angle));
      state_im.push(amp * Math.sin(angle));

      let f_startlow = 1.0 - (f_lowlimit - ptone) * fslopelow;
      let f_starthigh = 1.0 - (ptone - f_highlimit) * fslopehigh;
      filter_low.push(f_startlow + f_add_low * time);
      filter_high.push(f_starthigh + f_add_high * time);
    }
  }

  for (let i = n_partials; i < n_partials_in_array; ++i) {
    state_re.push(0.0);
    state_im.push(0.0);
    step_re.push(0.0);
    step_im.push(0.0);
    filter_low.push(0.0);
    filter_high.push(0.0);
  }

  return (sample_count) => {
    const buffer = [];

    for (let i = 0; i < sample_count; ++i) {
      let s = 0;

      for (let i = 0; i < n_partials; ++i) {
        let re = state_re[i] * step_re[i] - state_im[i] * step_im[i];
        let im = state_re[i] * step_im[i] + state_im[i] * step_re[i];
        state_re[i] = re;
        state_im[i] = im;

        let f = Math.max(0, Math.min(filter_low[i], filter_high[i], 1));

        filter_low[i] += f_add_low;
        filter_high[i] += f_add_high;

        s += re * f;
      }

      buffer.push((s * Math.sqrt(gain / (n_partials + (gain - 1.0) * s * s))) || 0);
    }

    return buffer;
  };
}
