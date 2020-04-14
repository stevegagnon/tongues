
function intToBytes(n) {
  const result = [];
  while (n) {
    result.push(n & 0xff);
    n >>= 8;
  }
  return result;
}

function decodeSong({ songData, rowLen, patternLen, endPattern }, [note, control]) {
  songData.map(
    ({ i, p, c }, ch) => {
      let time = 0;
      control(time, ch, [64, ...intToBytes(rowLen)]);
      i.map((v, cmd) => control(time, ch, [cmd, v]));
      for (let pattern of p) {
        if (pattern) {

          for (let ri = 0; ri < patternLen; ++ri) {
            let [rn, rc] = [c[pattern - 1].n, c[pattern - 1].f].map(a => {
              if (a[ri]) {
                let result = [];
                for (let offset = ri; a[offset]; offset += patternLen) {
                  result.push(a[offset]);
                }
                return result;
              }
            });
            if (rn) note(time, ch, rn);
            if (rc) control(time, ch, rc);
            time += 1;
          }

        } else {
          time += patternLen;
        }
      }
    }
  );
}

function encode(song) {
  const events = [];
  decodeSong(song, [
    (time, ch, cmd) => events.push([time, ch, 1, cmd]),
    (time, ch, cmd) => events.push([time, ch, 2, cmd])
  ]);
  events.sort(([t0], [t1]) => t0 - t1);
  let time = 0, cursor = 0, buffer = [];

  for (let [eventTime, channel, type, data] of events) {
    const dt = eventTime - time;
    buffer.push(dt);
    buffer.push(channel << 4 | type << 2 | data.length);
    buffer.push(...data);
    time = eventTime;
  }

  console.log(buffer);
  console.log(events);
}

function decode(song) {
}


function recodeSong({ songData, rowLen, patternLen, endPattern }) {
  const buffer = [];

  buffer.push(28);
  buffer.push(patternLen);
  buffer.push(endPattern);
  buffer.push((rowLen >> 8) & 0xff);
  buffer.push(rowLen & 0xff);
  
  songData.map(
    ({ i, p, c }) => {
      let dt = 0;
      buffer.push(...i.map(n => n | 0));
      buffer.push(p.length);
      for (let { n, f } of c) {
        for (let ri = 0; ri < patternLen; ++ri) {
          const fold = a => {
            if (a[ri]) {
              let result = [];
              for (let offset = ri; a[offset]; offset += patternLen) {
                result.push(a[offset]);
              }
              return result;
            }
          };

          let rn = fold(n);
          let rc = fold(f);

          if ((rn || rc) && dt >= 16) {

          }

          if (rn) {
            buffer.push(dt << 4 | rn.length << 2 | 1);
            buffer.push(...rn);
            dt = 0;
          }

          if (rc) {
            buffer.push(dt << 4 | rc.length << 2 | 2);
            buffer.push(...rc);
            dt = 0;
          }

          ++dt;
        }
        buffer.push(4);
      }

      buffer.push(0);

      for (let i = 0; i < endPattern; ++i) {
        buffer.push(p[i] | 0);
      }
    }
  );

  return new Blob([new Uint8Array(buffer)], { type: 'application/octet-stream' });
}
