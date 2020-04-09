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
  let { pow, sin, random } = Math;
  let create_buffer = s => new Float32Array(s);
  let sample_count = SAMPLE_RATE * songLen;
  let out_left = create_buffer(sample_count);
  let out_right = create_buffer(sample_count);
  let osc = [
    v => sin(v * 6.283184), // sine
    v => (v % 1) < 0.5 ? 1 : -1, // square
    v => (v % 1) - .5, // sawtooth
    v => { let v2 = (v % 1) * 4; return v2 < 2 ? v2 - 1 : 3 - v2 }, // triangle
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
    let delay_time = (fx_delay_time * rowLen) >> 1
    let delay_amt = fx_delay_amt / 255;
    let pan_freq = pow(2, fx_pan_freq - 8) / rowLen;
    let osc1 = osc[osc1_waveform];
    let osc2 = osc[osc2_waveform];
    let lfo_freq_row = pow(2, lfo_freq - 8) / rowLen;
    let lfo = k => osc[lfo_waveform](k * lfo_freq_row) * lfo_amt / 512 + 0.5;

    let render_note = (n, pos, channel_buffer) => {
      let c1 = 0, c2 = 0;
      let nf = (oct, det, detune) => (0.00390625 * pow(1.059463094, (n + (oct - 8) * 12 + det) - 128)) * (1 + 0.0008 * detune);
      let o1t = nf(osc1_oct, osc1_det, osc1_detune);
      let o2t = nf(osc2_oct, osc2_det, osc2_detune);
      let len = env_attack + env_sustain + env_release;

      for (let j = len - 1; j >= 0; --j) {
        let k = j + pos;

        // LFO
        let lfor = lfo(k);

        // Envelope
        let e = 1
        if (j < env_attack) {
          e = j / env_attack;
        } else if (j >= env_attack + env_sustain) {
          e -= (j - env_attack - env_sustain) / env_release;
        }

        // Oscillator 1
        let t = o1t;
        if (lfo_osc1_freq) t += lfor;
        if (osc1_xenv) t *= e * e;
        c1 += t;
        let rsample = osc1(c1) * osc1_vol;

        // Oscillator 2
        t = o2t;
        if (osc2_xenv) t *= e * e;
        c2 += t;
        rsample += osc2(c2) * osc2_vol;

        // Noise oscillator
        if (noise_fader) rsample += (2 * random() - 1) * noise_fader * e;

        channel_buffer[k] = rsample * e / 255;
      }
    }; // render_note

    let right_buffer = create_buffer(sample_count);
    let left_buffer = create_buffer(sample_count);

    let pos = 0;

    for (let pattern of p) {
      let rows = 32;
      if (pattern) {
        for (let n of c[pattern - 1].n) {
          n && render_note(n, pos, right_buffer);
          pos += rowLen;
          --rows;
        }
      }

      pos += rowLen * rows;
    }

    let low = 0;
    let band = 0;
    let q = fx_resonance / 255;

    for (let k = 0; k < sample_count; ++k) {
      let lfor = lfo(k);
      let s = right_buffer[k];

      // State variable filter
      let f = fx_freq;;
      if (lfo_fx_freq) f *= lfor;
      f = 1.5 * sin(f * 3.141592 / SAMPLE_RATE);
      low += f * band;
      let high = q * (s - band) - low;
      band += f * high;

      s = fx_filter === 1 ? high
        : fx_filter === 2 ? low
          : fx_filter === 3 ? band
            : fx_filter === 4 ? low + high
              : s;

      // Panning & master volume
      let t = osc[0](k * pan_freq) * fx_pan_amt / 512 + 0.5;
      s *= env_master / 255;

      let rsample = (s * t);
      let lsample = (s * (1 - t));

      if (k >= delay_time) {
        rsample += right_buffer[k - delay_time] * delay_amt;
        lsample += left_buffer[k - delay_time] * delay_amt;
      }

      out_right[k] += right_buffer[k] = rsample;
      out_left[k] += left_buffer[k] = lsample;
    }
  }

  return [out_left, out_right];
}
