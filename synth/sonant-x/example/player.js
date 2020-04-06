import song from './song';
import render from '../render';

const sampleRate = 44100;

const play = document.getElementById('rendered-play');


play.addEventListener('click', () => {
  const samples = render(song, sampleRate);
  console.log(samples);

  const audioCtx = new AudioContext({ sampleRate });
  const myArrayBuffer = audioCtx.createBuffer(2, samples[0].length, sampleRate);

  for (let ch = 0; ch < 2; ++ch) {
    const c = myArrayBuffer.getChannelData(ch);
    for (let i = 0; i < samples[ch].length; ++i) {
      c[i] = samples[ch][i];
    }
  }

  console.log(myArrayBuffer);
  
  const source = audioCtx.createBufferSource();
  source.buffer = myArrayBuffer;
  source.connect(audioCtx.destination);
  source.start();
});
