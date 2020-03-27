import { generate_random_data } from './util';

let SEMITONE_RATIO = pow(2, 1 / 12);

const random_data = generate_random_data(65535);

export default function odios(param, tone, time) {
  let n_partials = param.modes * param.fat;
  let n_partials_in_array = (n_partials + 3) & ~3;
  let state_re = [];
  let state_im = [];
  let step_re = [];
  let step_im = [];
  let filter_low = [];
  let filter_high = [];

  let f_add_low = -param.f_sweeplow * param.f_slopelow / param.sample_rate;
  let f_add_high = param.f_sweephigh * param.f_slopehigh / param.sample_rate;

  let gain = param.gain;

  let f_lowlimit = param.f_low + tone;
  let f_highlimit = param.f_high + tone;

  for (let m = 0; m < param.modes; ++m) {
    let random_index = m * 256 + param.seed;

    let getrandom = () => {
      let r = random_data[random_index];
      random_index += 1;
      return r / 0x80000000;
    };

    let subtone = Math.abs(getrandom());
    let reltone = subtone * param.overtones;
    let decay = param.decaylow + subtone * param.decaydiff;
    let ampmul = Math.pow(decay, 1.0 / DECAY_TIME / param.sample_rate);

    let relfreq = Math.pow(SEMITONE_RATIO, reltone / 12.0);
    let relfreq_ot = Math.floor(relfreq + 0.5);
    let relfreq_h = relfreq + (relfreq_ot - relfreq) * param.harmonicity;
    let reltone = Math.log2(relfreq_h) * 12.0;
    let mtone = tone + reltone;
    let mamp = getrandom() * Math.pow(SEMITONE_RATIO, reltone * param.sharpness / 12.0);

    for (let i = 0; i < param.fat; ++i) {
      let ptone = mtone + getrandom() * param.width;
      let phase = param.base_freq * Math.pow(SEMITONE_RATIO, ptone / 12.0);
      step_re.push(ampmul * Math.cos(phase));
      step_im.push(ampmul * Math.sin(phase));

      let angle = getrandom() * Math.PI + phase * time;
      let amp = mamp * Math.pow(ampmul, time);
      state_re.push(amp * Math.cos(angle));
      state_im.push(amp * Math.sin(angle));

      let f_startlow = 1.0 - (f_lowlimit - ptone) * param.f_slopelow;
      let f_starthigh = 1.0 - (ptone - f_highlimit) * param.f_slopehigh;
      filter_low.push(f_startlow + gen.f_add_low * time);
      filter_high.push(f_starthigh + gen.f_add_high * time);
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

  return () => {
    let s = 0;

    for (let i = 0; i < n_partials; ++i) {
      let re = state_re[i] * step_re[i] - state_im[i] * step_im[i];
      let im = state_re[i] * step_im[i] + state_im[i] * step_re[i];
      state_re[i] = re;
      state_im[i] = im;

      let f = Math.max(0, Math.min(filter_low[i], self.filter_high[i], 1));

      filter_low[i] += f_add_low;
      filter_high[i] += f_add_high;

      s += re * f;
    }

    return (s * Math.sqrt(gain / (n_partials + (gain - 1.0) * s * s)));
  };
}
