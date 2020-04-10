
export default function convert_json(
  {
    songLen,
    songData,
    rowLen,
    endPattern
  },
  {
    removeMutedOsc
  } = {
    removeMutedOsc: true
  }
) {
  return [
    songLen,
    rowLen,
    songData.map(({
      osc1_oct,
      osc1_det,
      osc1_detune,
      osc1_xenv,
      osc1_vol,
      osc1_waveform,
      osc2_oct,
      osc2_det,
      osc2_detune,
      osc2_xenv,
      osc2_vol,
      osc2_waveform,
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
      lfo_osc1_freq,
      lfo_fx_freq,
      lfo_freq,
      lfo_amt,
      lfo_waveform,
      p,
      c
    }) => {
      const oscillators = [];

      if (!removeMutedOsc || osc1_vol) {
        oscillators.push([
            osc1_waveform,
            osc1_vol,
            osc1_oct,
            osc1_det,
            osc1_detune,
            osc1_xenv,
            lfo_osc1_freq,
          ]);
      }

      if (!removeMutedOsc || osc2_vol) {
        oscillators.push([
          osc2_waveform,
          osc2_vol,
          osc2_oct,
          osc2_det,
          osc2_detune,
          osc2_xenv,
          0
        ]);
      }

      return [
        [
          lfo_fx_freq,
          lfo_freq,
          lfo_amt,
          lfo_waveform,
          oscillators,
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
      ];
    }),
    endPattern,
  ];
}
