// from https://github.com/nicolas-van/sonant-x/blob/master/sonantx.js

export default function render(
  [
    songLen,
    rowLen,
    songData,
    endPattern
  ],
  SAMPLE_RATE = 44100
) {
  let i;
  let sample_count = SAMPLE_RATE * songLen;
  let wt_size = 512;
  let wt_mask = wt_size - 1;
  let { pow, sin, random } = Math;

  let create_buffer = s => new Float32Array(s);
  let nf = (n, oct, det, detune) => (0.00390625 * pow(1.059463094, (n + (oct - 8) * 12 + det) - 128)) * (1 + 0.0008 * detune) * wt_size;

  let out_left = create_buffer(sample_count);
  let out_right = create_buffer(sample_count);
  let right_buffer = create_buffer(sample_count);
  let left_buffer = create_buffer(sample_count);
  let sin_wt = create_buffer(wt_size);
  let sqr_wt = create_buffer(wt_size);
  let saw_wt = create_buffer(wt_size);
  let tri_wt = create_buffer(wt_size);

  for (i = 0; i < wt_size; ++i) {
    let v = i / wt_size;
    let f = v % 1;
    sin_wt[i] = sin(v * 6.283184);
    saw_wt[i] = f - .5;
    sqr_wt[i] = f < 0.5 ? 1 : -1;
    tri_wt[i] = f < 0.5 ? f * 4 - 1 : 3 - f * 4;
  }

  let osc = [
    sin_wt,
    sqr_wt,
    saw_wt,
    tri_wt
  ];

  for (let [
    [
      lfo_fx_freq,
      lfo_freq,
      lfo_amt,
      lfo_waveform,
      [
        [
          osc1_waveform,
          osc1_vol,
          osc1_oct,
          osc1_det,
          osc1_detune,
          osc1_xenv,
          lfo_osc1_freq,
        ],
        [
          osc2_waveform,
          osc2_vol,
          osc2_oct,
          osc2_det,
          osc2_detune,
          osc2_xenv,
        ]
      ],
      noise_fader,
      env_attack,
      env_sustain,
      env_release,
      env_master,
      fx_filter,
      fx_freq,
      fx_resonance,
      fx_delay_time,
      fx_delay_amt,
      fx_pan_freq,
      fx_pan_amt,
    ],
    p,
    c
  ] of songData) {
    let len = env_attack + env_sustain + env_release;
    let wt1 = osc[osc1_waveform];
    let wt2 = osc[osc2_waveform];
    let pos = 0;

    fx_delay_time = (fx_delay_time * rowLen) >> 1;
    fx_delay_amt /= 255;
    fx_pan_freq = pow(2, fx_pan_freq - 8) / rowLen * wt_size;
    lfo_freq = pow(2, lfo_freq - 8) / rowLen * wt_size;
    env_master /= 1e5;
    fx_pan_amt /= 512;

    right_buffer.fill(0);

    if (lfo_amt) {
      lfo_amt /= 512;
      for (i = 0; i < sample_count; ++i) {
        left_buffer[i] = osc[lfo_waveform][(i * lfo_freq) & wt_mask] * lfo_amt + 0.5;
      }
    }

    for (let pattern of p) {
      let rows = 32;
      if (pattern) {
        for (let n of c[pattern - 1].n) {
          if (n) {
            let c1 = 0, c2 = 0;
            let o1t = nf(n, osc1_oct, osc1_det, osc1_detune);
            let o2t = nf(n, osc2_oct, osc2_det, osc2_detune);

            for (i = len - 1; i >= 0; --i) {
              let k = i + pos;

              // Envelope
              let e = i < env_attack ? i / env_attack
                : i >= env_attack + env_sustain ? 1 - (i - env_attack - env_sustain) / env_release
                  : 1;

              // Oscillator 1
              let t = o1t;
              if (lfo_osc1_freq) t += left_buffer[k];
              if (osc1_xenv) t *= e * e;
              c1 += t;
              let rsample = wt1[c1 & wt_mask] * osc1_vol;

              // Oscillator 2
              t = o2t;
              if (osc2_xenv) t *= e * e;
              c2 += t;
              rsample += wt2[c2 & wt_mask] * osc2_vol;

              // Noise oscillator
              if (noise_fader) rsample += (2 * random() - 1) * noise_fader * e;

              right_buffer[k] += rsample * e;
            }
          }
          pos += rowLen;
          --rows;
        }
      }

      pos += rowLen * rows;
    }

    let low = 0;
    let band = 0;
    let q = fx_resonance / 255;

    for (i = 0; i < sample_count; ++i) {
      let s = right_buffer[i];

      // State variable filter
      let f = fx_freq;;
      if (lfo_fx_freq) f *= left_buffer[i];
      f = 1.5 * sin_wt[(f * wt_size / 2 / SAMPLE_RATE) & wt_mask];
      low += f * band;
      let high = q * (s - band) - low;
      band += f * high;

      s = fx_filter === 1 ? high
        : fx_filter === 2 ? low
          : fx_filter === 3 ? band
            : fx_filter === 4 ? low + high
              : s;

      // Panning & master volume
      let t = sin_wt[(i * fx_pan_freq) & wt_mask] * fx_pan_amt + 0.5;
      s *= env_master;

      let rsample = (s * t);
      let lsample = (s * (1 - t));

      if (fx_delay_amt && i >= fx_delay_time) {
        rsample += right_buffer[i - fx_delay_time] * fx_delay_amt;
        lsample += left_buffer[i - fx_delay_time] * fx_delay_amt;
      }

      out_right[i] += right_buffer[i] = rsample;
      out_left[i] += left_buffer[i] = lsample;
    }
  }

  return [out_left, out_right];
}
