import renderKs from '../index';

document.getElementById('play1').addEventListener('click', () => {
  play();
});

const sampleRate = 44100;
let audioCtx;

function getAudioCtx() {
  if (!audioCtx) {
    audioCtx = new AudioContext({ sampleRate });
  }
  return audioCtx;
}

function play(...args) {
  console.log(args);

  const samples = renderKs()[0];

  console.log(samples);
  
  const audioCtx = getAudioCtx();

  const myArrayBuffer = audioCtx.createBuffer(1, samples.length, sampleRate);

  const c = myArrayBuffer.getChannelData(0);

  for (let i = 0; i < samples.length; ++i) {
    c[i] = samples[i];
  }

  const source = audioCtx.createBufferSource();
  source.buffer = myArrayBuffer;
  source.connect(audioCtx.destination);
  source.start();
}
