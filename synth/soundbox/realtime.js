export function sequence({ songData, rowLen, patternLen, endPattern }) {
  let channels = songData.map(
    ({ i, p, c }) => {
      let time = 0;
      let [render, note, control] = channel(rowLen);
      i.map((v, cmd) => control([cmd, v]));
      for (let pattern of p) {
        if (pattern) {
          for (let pi = 0; pi < endPattern; ++pi) {
            for (let ri = 0; ri < rowLen; ++ri) {
              let [rn, rc] = [c[pattern - 1].n, c[pattern - 1].f].map(a => {
                if (a[ri]) {
                  let result = [];
                  for (let offset = ri; a[offset] !== undefined; offset += rowLen) {
                    result.push(a[offset]);
                  }
                  return result;
                }
              });
              if (rn) note(rn, time);
              if (rc) control(rc, time);
              time += rowLen;
            }
          }
        } else {
          time += rowLen * patternLen;
        }
      }
      return render;
    }
  );
  return (out, samples) => channels.forEach(ch => ch(out, samples));
}

function intToBytes(n) {
  const result = [];
  while (n) {
    result.push(n & 0xff);
    n >>= 8;
  }
  return result;
}

export function decodeSong({ songData, rowLen, patternLen, endPattern }, [note, control]) {
  songData.map(
    ({ i, p, c }, ch) => {
      let time = 0;
      //control(time, ch, [64, ...intToBytes(rowLen)]);
      i.map((v, cmd) => control(time, ch, [cmd, v]));
      for (let pattern of p) {
        if (pattern) {

          for (let ri = 0; ri < patternLen; ++ri) {
            let [rn, rc] = [c[pattern - 1].n, c[pattern - 1].f].map(a => {
              if (a[ri]) {
                let result = [];
                for (let offset = ri; a[offset] !== undefined; offset += patternLen) {
                  result.push(a[offset]);
                }
                return result;
              }
            });

            if (rn) note(time, ch, rn);
            if (rc) {
              rc[0] -= 1;
              control(time, ch, rc);
            }
            time += 1;
          }

        } else {
          time += patternLen;
        }
      }
    }
  );
}

export function channel(rowLen, bufferLen, sampleRate) {
  let time = 0;
  let events = [];
  let { min, sin, pow, random } = Math;

  let osc = [
    v => sin(v * 6.283184), // sine
    v => (v % 1) < 0.5 ? 1 : -1, // square
    v => 2 * (v % 1) - 1, // sawtooth
    v => { const v2 = (v % 1) * 4; return v2 < 2 ? v2 - 1 : 3 - v2 }, // triangle
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
  let FX_DELAY_AMT;
  let FX_DELAY_TIME;

  let delayMask = (1 << 19) - 1;

  let oscillators = [];
  let filterActive = false;
  let low = 0;
  let band = 0;
  let high = 0;
  let delay = new Float32Array(delayMask + 1);
  let buffer = new Float32Array(bufferLen);
  let delayCursor = 0;
  let lfoPhase = 0;
  let rateAdj = sampleRate / 44100;
  
  delay.fill(0);

  let scheduleEvent = (e, t) => {
    events.push([t, e]);
    events.sort(([t0], [t1]) => t0 - t1);
  }

  return [
    (out, samples) => {
      let processed = 0;
      buffer.fill(0);

      while (samples > 0) {
        let processing = events.length ? min(samples, events[0][0] - time) : samples;

        oscillators = oscillators.filter(oscillator => !oscillator(buffer, processing, processed))

        for (let k = processed; k < processed + processing; ++k) {
          let sample = buffer[k];
          lfoPhase += LFO_FREQ;
          // We only do effects if we have some sound input
          if (sample || filterActive) {
            // State variable filter
            let f = FX_FREQ;
            if (LFO_FX_FREQ) {
              f *= LFO_WAVEFORM(lfoPhase) * LFO_AMT + 0.5;
            }
            f = 1.5 * sin(f);
            low += f * band;
            high = FX_RESONANCE * (sample - band) - low;
            band += f * high;
            sample = FX_FILTER == 3 ? band : FX_FILTER == 1 ? high : low;
            // Distortion
            if (FX_DIST) {
              sample *= FX_DIST;
              sample = sample < 1 ? sample > -1 ? osc[0](sample * .25) : -1 : 1;
              sample /= FX_DIST;
            }
            // Drive
            sample *= FX_DRIVE;
            // Is the filter active (i.e. still audiable)?
            filterActive = sample * sample > 1e-5;
          }

          sample += delay[(delayCursor - FX_DELAY_TIME) & delayMask] * FX_DELAY_AMT;
          delay[delayCursor] = sample || 0;
          delayCursor = (delayCursor + 1) & delayMask;

          buffer[k] = sample;
        }

        time += processing;
        samples -= processing;
        processed += processing;

        while (events.length && events[0][0] <= time) {
          events[0][1]();
          events.shift();
        }
      }

      for(let i = 0; i < processed; ++i) {
        out[i] += buffer[i];
      }

      return time;
    },
    (n, t = 0) => scheduleEvent(
      () => {

        let position = 0;
        let arp = ARP_CHORD;
        let arpT = 0;
        let envelope = 0;

        let o = n.map(note => {
          let c1 = 0;
          let c2 = 0;
          let o1t = 0;
          let o2t = 0;

          return [
            () => {
              c1 += OSC1_XENV ? o1t * envelope * envelope : o1t;
              c2 += OSC2_XENV ? o2t * envelope * envelope : o2t;
              return OSC1_WAVEFORM(c1) * OSC1_VOL + OSC2_WAVEFORM(c2) * OSC2_VOL;
            },
            () => {
              const _arp = note + (arp & 15) - 128;
              o1t = (174.614115728 / sampleRate) * pow(2, (_arp + OSC1_SEMI - 128) / 12);
              o2t = (174.614115728 / sampleRate) * pow(2, (_arp + OSC2_SEMI - 128) / 12) * (1 + 0.0008 * OSC2_DETUNE);
            }
          ];
        });

        if (NOISE_VOL) o.push([() => (2 * random() - 1) * NOISE_VOL, () => 0]);

        oscillators.push((out, samples, offset) => {
          let releaseInv = ENV_RELEASE === 0 ? 0 : 1 / ENV_RELEASE;

          for (let i = offset; i < offset + samples; ++i) {
            let sample = 0;

            envelope = position < ENV_ATTACK ? position / ENV_ATTACK
              : position >= ENV_ATTACK + ENV_SUSTAIN ? 1 - (position - ENV_ATTACK - ENV_SUSTAIN) * releaseInv
                : 1;

            if (position++ < ENV_ATTACK + ENV_SUSTAIN + ENV_RELEASE) {
              if (++arpT >= 0) {
                arp = (arp >> 8) | ((arp & 255) << 4);
                arpT -= ARP_SPEED;
                o.map(o => o[1]());
              };

              for (let [oscillator] of o) {
                sample += oscillator();
              }

              out[i] +=  0.00196 * sample * envelope;
            } else {
              return true;
            }
          }
        });
      },
      t
    ),
    ([cmd, v], t = 0) => scheduleEvent(
      () => [
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
        v => ENV_ATTACK = v * v * 4 * rateAdj,
        v => ENV_SUSTAIN = v * v * 4 * rateAdj,
        v => ENV_RELEASE = v * v * 4 * rateAdj,
        v => ARP_CHORD = v,
        v => ARP_SPEED = pow(2, 2 - v) * rowLen,
        v => LFO_WAVEFORM = osc[v],
        v => LFO_AMT = v / 512,
        v => LFO_FREQ = pow(2, v - 8) / rowLen / rateAdj,
        v => LFO_FX_FREQ = v,
        v => FX_FILTER = v,
        v => FX_FREQ = v * 43.23529 * 3.141592 / sampleRate,
        v => FX_RESONANCE = 1 - v / 255,
        v => FX_DIST = v * 0.32767,
        v => FX_DRIVE = v / 32,
        v => 0,
        v => 0,
        v => FX_DELAY_AMT = v / 255,
        v => FX_DELAY_TIME = (v * rowLen) >> 1,
      ][cmd](v || 0),
      t
    )
  ];
}
