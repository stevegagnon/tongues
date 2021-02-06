import { generate_random_data } from './util.js';

const TARGET_SAMPLE_RATE = 44100.0;
const SEMITONE_RATIO = 2;
const DECAY_TIME = 4096.0 / TARGET_SAMPLE_RATE;

const random_data = generate_random_data(262144);

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
  let state_re = (new Array(n_partials_in_array)).fill(0);
  let state_im = (new Array(n_partials_in_array)).fill(0);
  let step_re = (new Array(n_partials_in_array)).fill(0);
  let step_im = (new Array(n_partials_in_array)).fill(0);
  let filter_low = (new Array(n_partials_in_array)).fill(0);
  let filter_high = (new Array(n_partials_in_array)).fill(0);

  let f_add_low = - fsweeplow * fslopelow / sample_rate;
  let f_add_high = fsweephigh * fslopehigh / sample_rate;

  let f_lowlimit = filterlow + tone;
  let f_highlimit = filterhigh + tone;

  for (let m = 0; m < modes; ++m) {
    let random_index = m * 256 + seed;

    let getrandom = () => {
      let r = random_data[random_index | 0];
      random_index += 1;
      return r / 0x80000000;
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
      step_re[i] = ampmul * Math.cos(phase);
      step_im[i] = ampmul * Math.sin(phase);

      let angle = getrandom() * Math.PI + phase * time;
      let amp = mamp * Math.pow(ampmul, time);

      state_re[i] = amp * Math.cos(angle);
      state_im[i] = amp * Math.sin(angle);

      let f_startlow = 1.0 - (f_lowlimit - ptone) * fslopelow;
      let f_starthigh = 1.0 - (ptone - f_highlimit) * fslopehigh;
      filter_low[i] = f_startlow + f_add_low * time;
      filter_high[i] = f_starthigh + f_add_high * time;
    }
  }

  // console.log(
  //   state_re,
  //   state_im,
  //   step_re,
  //   step_im,
  //   filter_low,
  //   filter_high,
  // );
  
  return (sample_count) => {
    const buffer = new Array(sample_count);

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

      buffer[i] = (s * Math.sqrt(gain / (n_partials + (gain - 1.0) * s * s))) || 0;
    }

    return buffer;
  };
}
