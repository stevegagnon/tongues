import sfxr from '../humphd';
import r from '../random';

const sampleRate = 44100;
let audioCtx;

const s1 = r();
const s2 = r();
const s3 = r();

document.getElementById('play1').addEventListener('click', () => play(...s1));
document.getElementById('play2').addEventListener('click', () => play(...s2));
document.getElementById('play3').addEventListener('click', () => play(...s3));


function getAudioCtx() {
  if (!audioCtx) {
    audioCtx = new AudioContext({ sampleRate });
  }
  return audioCtx;
}

function play(...args) {
  console.log(args);
  
  const samples = sfxr(...args);

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
