// https://zzfx.3d2k.com/

export default function(
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
