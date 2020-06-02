// https://zzfx.3d2k.com/

export function Z1(
  volume,
  randomness,
  frequency,
  length = 1,
  attack = .1,
  slide = 0,
  noise = 0,
  modulation = 0,
  modulationPhase = 0,
  sampleRate = 44100
) {
  frequency *= 2 * Math.PI / sampleRate;
  frequency *= (1 + randomness * (Math.random() * 2 - 1));
  slide *= Math.PI * 1e3 / sampleRate ** 2;
  length = length > 0 ? (length > 10 ? 10 : length) * sampleRate | 0 : 1;
  attack *= length | 0;
  modulation *= 2 * Math.PI / sampleRate;
  modulationPhase *= Math.PI;

  // generate waveform
  let b = [], f = 0, fm = 0;
  for (let F = 0; F < length; ++F) {
    b[F] = volume *                                    // volume
      Math.cos(f * frequency *                       // frequency
        Math.cos(fm * modulation + modulationPhase)) * // modulation
      (F < attack ? F / attack :                      // attack
        1 - (F - attack) / (length - attack));           // decay
    f += 1 + noise * (Math.random() * 2 - 1);                       // noise
    fm += 1 + noise * (Math.random() * 2 - 1);                      // modulation noise
    frequency += slide;                                // frequency slide
  }

  return b;
}

export function Z2(
  volume = 1,
  randomness = .05,
  frequency = 220,
  attack = 0,
  sustain = 0,
  release = .1,
  shape = 0,
  shapeCurve = 1,
  slide = 0,
  deltaSlide = 0,
  pitchJump = 0,
  pitchJumpTime = 0,
  repeatTime = 0,
  noise = 0,
  modulation = 0,
  bitCrush = 0,
  delay = 0,
  sampleRate = 44100
) {
  // init parameters
  const PI2 = Math.PI * 2;
  const random = r => r * (Math.random() * 2 - 1);
  const sign = v => v > 0 ? 1 : -1;
  const startSlide = slide *= 500 * PI2 / sampleRate ** 2;
  const modPhase = sign(modulation) * PI2 / 4
  let startFrequency = frequency *=
    (1 + random(randomness)) * PI2 / sampleRate;
  attack = 99 + attack * sampleRate | 0;
  sustain = sustain * sampleRate | 0;
  release = release * sampleRate | 0;
  delay = delay * sampleRate | 0;
  deltaSlide *= 500 * PI2 / sampleRate ** 3;
  modulation *= PI2 / sampleRate;
  pitchJump *= PI2 / sampleRate;
  pitchJumpTime = pitchJumpTime * sampleRate;
  repeatTime = repeatTime * sampleRate;
  const length = Math.max(1, Math.min(attack + sustain + release + delay, sampleRate * 10));

  // generate waveform
  let b = [], t = 0, tm = 0, i = 0, j = 1, r = 0, c = 0, s = 0, d = .5;
  for (; i < length; b[i++] = s) {
    if (++c > bitCrush * 100)                          // bit crush
    {
      c = 0;
      s = t * frequency *                        // frequency
        Math.sin(tm * modulation - modPhase);  // modulation

      s = shape ? shape > 1 ? shape > 2 ? shape > 3 ?   // wave shape
        Math.sin((s % PI2) ** 3) :                // 4 noise
        Math.max(Math.min(Math.tan(s), 1), -1) : // 3 tan
        1 - (2 * s / PI2 % 2 + 2) % 2 :                    // 2 saw
        1 - 4 * Math.abs(Math.round(s / PI2) - s / PI2) :// 1 triangle
        Math.sin(s);                          // 0 sin
      s = sign(s) * (Math.abs(s) ** shapeCurve);  // curve 0=square, 2=pointy

      s *= volume * (                // envelope
        i < attack ? i / attack :                    // attack
          i < attack + sustain ? 1 :                   // sustain
            i < length - delay ?                         // post release
              1 - (i - attack - sustain) / release : 0);     // release

      s = delay ?                                  // delay
        s / 2 + (delay > i ? 0 :
          (i < length - delay ? 1 : (i - length) / delay) * // release delay 
          b[i - delay] / 2) : s;
    }

    t += 1 + random(noise);                      // noise
    tm += 1 + random(noise);                     // modulation noise
    frequency += slide += deltaSlide;            // frequency slide

    if (j && ++j > pitchJumpTime)                // pitch jump
    {
      frequency += pitchJump;                  // apply pitch jump
      startFrequency += pitchJump;             // also apply to start
      j = 0;                                   // reset pitch jump time
    };

    if (repeatTime && ++r > repeatTime)           // repeat
    {
      frequency = startFrequency;               // reset frequency
      slide = startSlide;                       // reset slide
      r = 1;                                    // reset repeat time
      j = j || 1;                                 // reset pitch jump time
    }
  }

  return b;
}


export function R2() {
  let
    R = Math.random,
    attack = .01 + R() ** 3,
    sustain = R() ** 3,
    release = .01 + R() ** 3,
    length = attack + sustain + release,
    pitchJump = 0,
    pitchJumpTime = 0,
    shapeCurve = R() < .2 ? 1 : R() * 2;

  if (R() < .1) {
    shapeCurve = R() ** 2 * 10;
  }

  if (shapeCurve >= 2) {
    shapeCurve = shapeCurve | 0;
  }

  if (R() < .5) {
    pitchJump = R() ** 2 * 1e3 * (R() < .5 ? -1 : 1) | 0;
    pitchJumpTime = R() * length;
  }

  return [
    // volume
    1,
    // randomness
    .05,
    // frequency
    R() ** 2 * 2e3 | 0,
    // attack
    .01 + R() ** 3,
    // sustain
    R() ** 3,
    // release
    .01 + R() ** 3,
    // shape
    R() * 5 | 0,
    // shapeCurve
    shapeCurve,
    // slide
    R() < .5 ? 0 : R() ** 3 * 100 * (R() < .5 ? -1 : 1),
    // deltaSlide
    R() < .5 ? 0 : R() ** 3 * 100 * (R() < .5 ? -1 : 1),
    // pitchJump
    pitchJump,
    // pitchJumpTime
    pitchJumpTime,
    // repeatTime
    R() < .5 ? R() * length : 0,
    // noise
    R() < .5 ? 0 : R() ** 3 * 3,
    // modulation
    (R() < .5 ? 0 : R() ** 3 * 100 * (R() < .5 ? -1 : 1)) * (R() < .5 ? -1 : 1),
    // bitCrush
    R() < .5 ? 0 : R() ** 2,
    // delay
    R() < .5 ? 0 : R() ** 3 * .5,
  ];
}
