
export function player(synths) {
  let context = new AudioContext({ sampleRate: 44100 });
  return synths.map(([synth, args]) => {
    const data = synth(...args);
    const buffer = context.createBuffer(data.length, data[0].length, 44100);
    data.map((ch, i) => buffer.getChannelData(i).set(ch));
    return () => {
      let bufferSource = context.createBufferSource();
      bufferSource.buffer = buffer;
      bufferSource.connect(context.destination);
      bufferSource.start()
    };
  });
}
