import oidos from '../synth';
import { default_values, random_values } from '../util';


const sampleRate = 44100;
let audioCtx;


let last;

document.getElementById('play1').addEventListener('click', () => {
  last = random_values(400);
  play(...last);
});

document.getElementById('play2').addEventListener('click', () => {
  play(...last);
});


function getAudioCtx() {
  if (!audioCtx) {
    audioCtx = new AudioContext({ sampleRate });
  }
  return audioCtx;
}

function play(...args) {
  console.log(args);
  
  const gen = oidos(...args);
  const samples = gen(44100 * 3);

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
