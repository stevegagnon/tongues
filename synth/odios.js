
export default function odios(params) {
  let { floor, max, sqrt, pow, log, sin, cos, imul, PI } = Math;
  let complex = (r, i) => ([r, i]);

  let OCTAVES = 10;
  let LOWEST_OCTAVE = -4;
  let TOTAL_SEMITONES = OCTAVES * 12;
  let SEMITONE_RATIO = pow(2, 1 / 12);
  let BASE_FREQ = 440 / (pow(pow(2, 1.0 / 12), 9 - 12 * LOWEST_OCTAVE)) / 44100 * (2 * 3.14159265358979);

  let init_arrays = (tone, t) => {
    let modes = max(1, floor(.0 + params.modes * 100));
    let fat = max(1, floor(.5 + params.fat * 100));
    let seed = floor(.5 + params.seed * 100);
    let overtones = floor(.5 + params.overtones * 100);
    let decaydiff = (params.decayhigh - params.decaylow);
    let decaylow = params.decaylow;
    let harmonicity = params.harmonicity * 2 - 1;
    let sharpness = params.sharpness * 5 - 4;
    let width = 100 * pow(params.width, 5);
    let low = (params.filterlow * 2 - 1) * TOTAL_SEMITONES;
    let slopelow = pow((1 - params.fslopelow), 3);
    let high = (params.filterhigh * 2 - 1) * TOTAL_SEMITONES;
    let slopehigh = pow((1 - params.fslopehigh), 3);
    let fsweep = pow(params.fsweep - 0.5, 3) * 100 * TOTAL_SEMITONES / samplerate;

    let maxdecay = max(decaylow, decaylow + decaydiff);

    let n_partials = modes * fat;
    let n_partials_in_array = (n_partials + 1) & -2;

    let fadd1 = -fsweep * slopelow;
    let fadd2 = fsweep * slopehigh;

    let state = [];
    let step = [];
    let filter = [];

    low = low + tone;
    high = high + tone;

    let i = 0;
    
    let getrandom = () => ((seed = imul(741103597, seed)) >>> 0) / 2 ** 32;

    for (let m = 0; m < modes; ++m) {
      let subtone = getrandom();
      let reltone = subtone * overtones;
      let decay = decaylow + subtone * decaydiff;
      let ampmul = pow(decay, 1 / 4096)

      let relfreq = pow(SEMITONE_RATIO, reltone)
      let relfreq_ot = floor(0.5 + relfreq)
      relfreq = relfreq + (relfreq_ot - relfreq) * harmonicity
      reltone = log(relfreq) / log(SEMITONE_RATIO)
      let mtone = tone + reltone
      let mamp = getrandom() * pow(SEMITONE_RATIO, reltone * sharpness)

      for (let p = 0; p < fat; ++p) {
        let ptone = mtone + getrandom() * width;

        let phase = BASE_FREQ * pow(SEMITONE_RATIO, ptone);

        step[i] = complex(ampmul * cos(phase), ampmul * sin(phase));

        let amp = mamp;

        let angle = getrandom() * PI;
        amp = amp * pow(ampmul, t);
        angle = angle + phase * t;

        state[i] = complex(amp * cos(angle), amp * sin(angle));

        let f1 = 1 - (low - ptone) * slopelow + fadd1 * t;
        let f2 = 1 - (ptone - high) * slopehigh + fadd2 * t;

        filter[i] = complex(f1, f2)

        i = i + 1
      }

      while (i < n_partials_in_array) {
        step[i] = complex(0, 0)
        state[i] = complex(0, 0)
        filter[i] = complex(0, 0)
        i = i + 1
      }
    }
    return [n_partials, state, step, filter, fadd1, fadd2, maxdecay];
  };

  let createNote = (channel, tone, velocity) => {
    let attack = 2;

    if(params.attack != 0) {
      attack = 1 / (params.attack * params.attack) / samplerate;
    }

    let release = 2;

    if(params.release != 0) {
      release = 1 / params.release / samplerate;
    }

    note = {
      tone,
      velocity,
      attack,
      release,
      releasetime: 999,
      is_alive: true,
      t: 0
    };

    note.off = (note, time, velocity) => note.releasetime = time
    note.alive = (note, time) => note.is_alive;

    note.render = (note, time) => {
      let gain = pow(4096, params.gain - 0.25);
      let softclip = v => v * math.sqrt(gain / (1 + (gain - 1) * v * v));


      let buffer = {}

      buffer.length = 0


      let left, right;
      let ai = note.t >> 10;
      let a = note.t & 1023;
      let array = buffer[ai]; ??

          let maxdecay;
          // let [note.n_partials, note.state, note.step, note.filter, note.fadd1, note.fadd2, maxdecay] = init_arrays(note.tone, note.t)
          buffer.rdecaylength = (log(maxdecay) / log(0.01)) / 4096 * samplerate
          let stereo = params.stereo * (2*PI);
          note.leftfac = complex(1 / sqrt(note.n_partials), 0);
          note.rightfac = complex(cos(stereo) / sqrt(note.n_partials), sin(stereo) / sqrt(note.n_partials))

          let n_partials_in_array = (note.n_partials + 1) & -2;
          let sum = ffi.C.complex_array_mul(n_partials_in_array, note.state, note.state, note.step, note.filter, note.fadd1, note.fadd2)
        left = softclip((sum * note.leftfac).re)
        right = softclip((sum * note.rightfac).re)

        if note.t == buffer.length then
          if not array then
            array = ffi.new(complex_array_t, 1024)
            buffer[ai] = array
          end
          array[a] = complex(left, right)
          buffer.length = buffer.length + 1
        end

      local amp = math.max(0, math.min(1, math.min(time * samplerate * note.attack, 1 - (time - note.releasetime) * samplerate * note.release)))
      left = left * amp * note.velocity / 127
      right = right * amp * note.velocity / 127

      note.t = note.t + 1

      if (time - note.releasetime) * samplerate * note.release > 1 or 1 / time < buffer.rdecaylength then
        note.is_alive = false
      end

      return left, right
    end

    return note
  };
}