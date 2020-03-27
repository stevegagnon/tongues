import zzfx from '../index';

const sampleRate = 44100;
let audioCtx;

document.getElementById('play1').addEventListener('click', () => play(1,.05,78,.6,.08,0,.2,2.8,.11));
document.getElementById('play2').addEventListener('click', () => play(1,.05,10,.2,.58,2.9,.1,32.5,.6));
document.getElementById('play3').addEventListener('click', () => play(1,.05,333,1,.07,2.5,1.9,.4,.07));


function getAudioCtx() {
  if (!audioCtx) {
    audioCtx = new AudioContext({ sampleRate });
  }
  return audioCtx;
}

function play(...args) {
  console.log(args);
  

  const samples = zzfx(...args);


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
