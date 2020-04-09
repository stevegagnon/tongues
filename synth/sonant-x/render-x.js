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

  console.log(songData);


  for (let [
    [
      lfo_fx_freq,
      lfo_freq,
      lfo_amt,
      lfo_waveform,
      oscp,
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
    let delay_time = (fx_delay_time * rowLen) >> 1;
    let delay_amt = fx_delay_amt / 255;
    let pan_freq = pow(2, fx_pan_freq - 8) / rowLen;
    let oscillators = oscp.map(([waveform, ...p]) => ([osc[waveform], ...p]));
    let lfo_freq_row = pow(2, lfo_freq - 8) / rowLen;
    let lfo = k => osc[lfo_waveform](k * lfo_freq_row) * lfo_amt / 512 + 0.5;

    let render_note = (n, pos, channel_buffer) => {

      let oscs = oscillators.map(([osc, osc_vol, oct, det, detune, osc_xenv, lfo_osc_freq]) => {
        let c = 0;
        let ot = (0.00390625 * pow(1.059463094, (n + (oct - 8) * 12 + det) - 128)) * (1 + 0.0008 * detune);
        return (e, lfp) => {
          let t = ot;
          if (lfo_osc_freq) t += lfo(lfp);
          if (osc_xenv) t *= e * e;
          c += t;
          return osc(c) * osc_vol;
        }
      });

      for (let j = len - 1; j >= 0; --j) {
        // Envelope
        let e = j < env_attack ? j / env_attack
          : j >= env_attack + env_sustain ? 1 - (j - env_attack - env_sustain) / env_release
            : 1;

        let s = oscs.reduce((a, c) => a + c(e, j + pos), 0);

        // Noise oscillator
        if (noise_fader) s += (2 * random() - 1) * noise_fader * e;

        channel_buffer[j + pos] = s * e / 255;
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
      let s = right_buffer[k];

      // State variable filter
      let f = fx_freq;;
      if (lfo_fx_freq) f *= lfo(k);
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
