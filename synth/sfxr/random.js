  // waveType,
  // masterVolume,
  // attackTime,
  // sustainTime,
  // sustainPunch,
  // decayTime,
  // startFrequency,
  // minFrequency,
  // slide,
  // deltaSlide,
  // vibratoDepth,
  // vibratoSpeed,
  // changeAmount,
  // changeSpeed,
  // squareDuty,
  // dutySweep,
  // repeatSpeed,
  // phaserOffset,
  // phaserSweep,
  // lpFilterCutoff,
  // lpFilterCutoffSweep,
  // lpFilterResonance,
  // hpFilterCutoff,
  // hpFilterCutoffSweep,

  // synth.waveType = Math.floor(Math.random() * 4);
  // synth.attackTime = Math.pow(Math.random() * 2 - 1, 4);
  // synth.sustainTime = Math.pow(Math.random() * 2 - 1, 2);
  // synth.sustainPunch = Math.pow(Math.random() * 0.8, 2);
  // synth.decayTime = Math.random();
  // synth.startFrequency = (Math.random() < 0.5) ? Math.pow(Math.random() * 2 - 1, 2) : (Math.pow(Math.random() * 0.5, 3) + 0.5);
  // synth.minFrequency = 0.0;
  // synth.slide = Math.pow(Math.random() * 2 - 1, 5);
  // synth.deltaSlide = Math.pow(Math.random() * 2 - 1, 3);
  // synth.vibratoDepth = Math.pow(Math.random() * 2 - 1, 3);
  // synth.vibratoSpeed = Math.random() * 2 - 1;
  // synth.changeAmount = Math.random() * 2 - 1;
  // synth.changeSpeed = Math.random() * 2 - 1;
  // synth.squareDuty = Math.random() * 2 - 1;
  // synth.dutySweep = Math.pow(Math.random() * 2 - 1, 3);
  // synth.repeatSpeed = Math.random() * 2 - 1;
  // synth.phaserOffset = Math.pow(Math.random() * 2 - 1, 3);
  // synth.phaserSweep = Math.pow(Math.random() * 2 - 1, 3);
  // synth.lpFilterCutoff = 1 - Math.pow(Math.random(), 3);
  // synth.lpFilterCutoffSweep = Math.pow(Math.random() * 2 - 1, 3);
  // synth.lpFilterResonance = Math.random() * 2 - 1;
  // synth.hpFilterCutoff = Math.pow(Math.random(), 5);
  // synth.hpFilterCutoffSweep = Math.pow(Math.random() * 2 - 1, 5);

export default function(seed) {
  return [
    Math.floor(Math.random() * 4),
    .8,
    Math.pow(Math.random() * 2 - 1, 4), 
    Math.pow(Math.random() * 2 - 1, 2),
    Math.pow(Math.random() * 0.8, 2),
    Math.random(),
    (Math.random() < 0.5) ? Math.pow(Math.random() * 2 - 1, 2) : (Math.pow(Math.random() * 0.5, 3) + 0.5),
    0,
    Math.pow(Math.random() * 2 - 1, 5),
    Math.pow(Math.random() * 2 - 1, 3),
    Math.pow(Math.random() * 2 - 1, 3),
    Math.random() * 2 - 1,
    Math.random() * 2 - 1,
    Math.random() * 2 - 1,
    Math.random() * 2 - 1,
    Math.pow(Math.random() * 2 - 1, 3),
    Math.random() * 2 - 1,
    Math.pow(Math.random() * 2 - 1, 3),
    Math.pow(Math.random() * 2 - 1, 3),
    1 - Math.pow(Math.random(), 3),
    Math.pow(Math.random() * 2 - 1, 3),
    Math.random() * 2 - 1,
    Math.pow(Math.random(), 5),
    Math.pow(Math.random() * 2 - 1, 5),
  ];
}
