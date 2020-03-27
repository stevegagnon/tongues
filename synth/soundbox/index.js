// from http://sb.bitsnbites.eu/player-small.js

export default function ({
  rowLen,
  patternLen,
  endPattern,
  songData
}) {
  let createBuffer = s => new Float32Array(s);
  let numSamples = rowLen * patternLen * (endPattern + 1);
  let lOut = createBuffer(numSamples);
  let rOut = createBuffer(numSamples);
  let { sin, pow, random } = Math;

  for (let channel of songData) {
    let filterActive = false;
    let noteCache = new Map();
    let low = 0;
    let band = 0;
    let high = 0;
    let chnBuf = createBuffer(numSamples * 2);
    let osc = [
      v => sin(v * 6.283184), // sine
      v => (v % 1) < 0.5 ? 1 : -1, // square
      v => 2 * (v % 1) - 1, // sawtooth
      v => { let v2 = (v % 1) * 4; return v2 < 2 ? v2 - 1 : 3 - v2 }, // triangle
    ];
    let OSC1_WAVEFORM;
    let OSC1_VOL;
    let OSC1_SEMI;
    let OSC1_XENV;
    let OSC2_WAVEFORM;
    let OSC2_VOL;
    let OSC2_SEMI;
    let OSC2_DETUNE;
    let OSC2_XENV;
    let NOISE_VOL;
    let ENV_ATTACK;
    let ENV_SUSTAIN;
    let ENV_RELEASE;
    let ARP_CHORD;
    let ARP_SPEED;
    let LFO_WAVEFORM;
    let LFO_AMT;
    let LFO_FREQ;
    let LFO_FX_FREQ;
    let FX_FILTER;
    let FX_FREQ;
    let FX_RESONANCE;
    let FX_DIST;
    let FX_DRIVE;
    let FX_PAN_AMT;
    let FX_PAN_FREQ;
    let FX_DELAY_AMT;
    let FX_DELAY_TIME;
    
    let tva = [
      v => OSC1_WAVEFORM = osc[v],
      v => OSC1_VOL = v,
      v => OSC1_SEMI = v,
      v => OSC1_XENV = v,
      v => OSC2_WAVEFORM = osc[v],
      v => OSC2_VOL = v,
      v => OSC2_SEMI = v,
      v => OSC2_DETUNE = v,
      v => OSC2_XENV = v,
      v => NOISE_VOL = v,
      v => ENV_ATTACK = v * v * 4,
      v => ENV_SUSTAIN = v * v * 4,
      v => ENV_RELEASE = v * v * 4,
      v => ARP_CHORD = v,
      v => ARP_SPEED = pow(2, 2 - v) * rowLen,
      v => LFO_WAVEFORM = osc[v],
      v => LFO_AMT = v / 512,
      v => LFO_FREQ = pow(2, v - 9) / rowLen,
      v => LFO_FX_FREQ = v,
      v => FX_FILTER = v,
      v => FX_FREQ = v * 43.23529 * 3.141592 / 44100,
      v => FX_RESONANCE = 1 - v / 255,
      v => FX_DIST = v * 0.32767,
      v => FX_DRIVE = v / 32,
      v => FX_PAN_AMT = v / 512,
      v => FX_PAN_FREQ = 6.283184 * pow(2, v - 9) / rowLen,
      v => FX_DELAY_AMT = v / 255,
      v => FX_DELAY_TIME = v * rowLen & ~1,
    ];

    tva.map((fn, i) => fn(channel.i[i] | 0));

    for (let patternOffset = 0; patternOffset <= endPattern; ++patternOffset) {
      let pattern = channel.p[patternOffset];
      for (let row = 0, sampleOffset = (patternOffset * patternLen) * rowLen; row < patternLen; ++row, sampleOffset += rowLen) {
        if (pattern) {
          let ch = channel.c[pattern - 1];
          let cmd = ch.f[row];
          if (cmd) {
            if (cmd < 16) noteCache.clear();
            tva[cmd - 1](ch.f[row + patternLen] | 0);
          }

          // Generate notes for this pattern row
          for (let patternColumn = 0; patternColumn < 4; ++patternColumn) {
            let note = ch.n[row + patternColumn * patternLen];
            if (note) {
              let noteBuf = noteCache.get(note);

              if (!noteBuf) {
                let len = ENV_ATTACK + ENV_SUSTAIN + ENV_RELEASE;
                let releaseInv = ENV_RELEASE === 0 ? 0 : 1 / ENV_RELEASE;
                let c1 = 0;
                let c2 = 0;
                let o1t = 0;
                let o2t = 0;
                let arp = ARP_CHORD;
                let arpT = 0;

                noteBuf = createBuffer(len);

                for (let T = 0; T < len; ++T, ++arpT) {
                  if (arpT >= 0) {
                    arp = (arp >> 8) | ((arp & 255) << 4);
                    arpT -= ARP_SPEED;
                    let _arp = note + (arp & 15) - 128;
                    o1t = 0.00396 * pow(2, (_arp + OSC1_SEMI - 128) / 12);
                    o2t = 0.00396 * pow(2, (_arp + OSC2_SEMI - 128) / 12) * (1 + 0.0008 * OSC2_DETUNE);
                  }
                  let e = T < ENV_ATTACK ? T / ENV_ATTACK
                    : T >= ENV_ATTACK + ENV_SUSTAIN ? 1 - (T - ENV_ATTACK - ENV_SUSTAIN) * releaseInv
                      : 1;

                  c1 += OSC1_XENV ? o1t * e * e : o1t;
                  c2 += OSC2_XENV ? o2t * e * e : o2t;

                  let sample = OSC1_WAVEFORM(c1) * OSC1_VOL + OSC2_WAVEFORM(c2) * OSC2_VOL;

                  if (NOISE_VOL) {
                    sample += (2 * random() - 1) * NOISE_VOL;
                  }

                  noteBuf[T] = 0.00196 * sample * e;
                }

                noteCache.set(note, noteBuf);
              }

              for (let j = 0, i = sampleOffset * 2; j < noteBuf.length; j++ , i += 2) {
                chnBuf[i] += noteBuf[j];
              }
            }
          }
        }

        // Perform effects for this pattern row

        for (let j = 0; j < rowLen; j++) {
          // Dry mono-sample
          let k = (sampleOffset + j) * 2;
          let rsample = chnBuf[k];
          let lsample = 0;
          // We only do effects if we have some sound input
          if (rsample || filterActive) {
            // State variable filter
            let f = FX_FREQ;
            if (LFO_FX_FREQ) {
              f *= LFO_WAVEFORM(LFO_FREQ * k) * LFO_AMT + 0.5;
            }
            f = 1.5 * sin(f);
            low += f * band;
            high = FX_RESONANCE * (rsample - band) - low;
            band += f * high;
            rsample = FX_FILTER == 3 ? band : FX_FILTER == 1 ? high : low;
            // Distortion
            if (FX_DIST) {
              rsample *= FX_DIST;
              rsample = rsample < 1 ? rsample > -1 ? osc[0](rsample * .25) : -1 : 1;
              rsample /= FX_DIST;
            }
            // Drive
            rsample *= FX_DRIVE;
            // Is the filter active (i.e. still audiable)?
            filterActive = rsample * rsample > 1e-5;
            // Panning
            let t = sin(FX_PAN_FREQ * k) * FX_PAN_AMT + 0.5;
            lsample = rsample * (1 - t);
            rsample *= t;
          }

          // Delay is always done, since it does not need sound input
          if (k >= FX_DELAY_TIME) {
            lsample += chnBuf[k - FX_DELAY_TIME + 1] * FX_DELAY_AMT;
            rsample += chnBuf[k - FX_DELAY_TIME] * FX_DELAY_AMT;
          }

          // Store in stereo channel buffer (needed for the delay effect)
          chnBuf[k] = lsample;
          chnBuf[k + 1] = rsample;

          // ...and add to stereo mix buffer
          lOut[k / 2] += lsample;
          rOut[k / 2] += rsample;
        }

      }
    }
  }
  return [lOut, rOut];
}
