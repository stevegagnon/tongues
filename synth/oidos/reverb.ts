
import { generate_random_data } from './util';

const BASE_SAMPLE_RATE = 44100.0;
const DELAY_STEP = 256 / BASE_SAMPLE_RATE;
const NBUFS = 200;
const NOISESIZE = 64;

function buffer_size_for_sample_rate(sample_rate) {
  const s = Math.ceil(sample_rate * DELAY_STEP * 200);
  let p = 0;
  for(;;) {
    if (p >= s) {
      return p;
    }
    p *= 2;
  }
}

function filter(a, i, value, strength) {
  const c = a[i];
  a[i] = c + (value - c) * strength;
  return a[i];
}

export function reverb(
  max_decay,
  delayadd,
  filterlow,
  filterhigh,
  dampenlow,
  dampenhigh,
  delaymin,
  delaymax,
  seed,
  nbufs,
  volumes,
  decay_mul,
  sample_rate,
) {
  let fhstate = (new Array(nbufs)).fill(0);
  let flstate = (new Array(nbufs)).fill(0);
  let dhstate = (new Array(nbufs)).fill(0);
  let dlstate = (new Array(nbufs)).fill(0);

  let buffer_size = buffer_size_for_sample_rate(sample_rate);
  let buffer_index = 0;

  let delay_buffers = fhstate.map(() => (new Array(buffer_size)).fill(0));
  let random_data = generate_random_data(NOISESIZE * NOISESIZE * NOISESIZE);
  let feedback = max_decay;

  let sample_rate_scale = sample_rate / BASE_SAMPLE_RATE;
  let scaled_delayadd = Math.round(delayadd * sample_rate_scale);
  // Heuristic adjustment of filter coefficients to sort of compensate for sample rate.
  // Hits the frequency content pretty well, but still gives variation in decay time.
  let scaled_filterlow = Math.pow(filterlow, Math.sqrt(sample_rate_scale));
  let scaled_filterhigh = Math.pow(filterhigh, Math.sqrt(sample_rate_scale));
  let scaled_dampenlow = Math.pow(dampenlow, Math.sqrt(sample_rate_scale));
  let scaled_dampenhigh = Math.pow(dampenhigh, Math.sqrt(sample_rate_scale));

  return (inputs, outputs) => {
    let size = inputs[0].length;
    let b = 0;

    for (let delay = delaymin + 1; delay < delaymax + 1; ++delay) {
      let random = random_data[seed + delay];
      // Is there an echo with this delay?
      if (Math.floor(random * (delay - delaymin) / 0x100000000) < (nbufs - b)) {
        let scaled_delay = Math.round(delay * sample_rate_scale);
        let c = b & 1;
        for (let i = 0; i < size; ++i) {
          // Extract delayed signal
          let out_index = (buffer_index + i - scaled_delay - scaled_delayadd) & (buffer_size - 1);
          let out = delay_buffers[b][out_index];
          outputs[c][i] += out * volumes[c];

          // Filter input
          let input = inputs[c][i];
          let f_input_low = filter(fhstate, b, input, scaled_filterlow);
          let f_input_high = filter(flstate, b, input, scaled_filterhigh);
          let f_input = f_input_high - f_input_low;

          // Filter echo
          let echo_index = (buffer_index + i - scaled_delay) & (buffer_size - 1);
          let echo = delay_buffers[b][echo_index];
          let f_echo_low = filter(dhstate, b, echo, scaled_dampenlow);
          let f_echo_high = filter(dlstate, b, echo, scaled_dampenhigh);
          let f_echo = f_echo_high - f_echo_low;

          // Sum input with attenuated echo
          let in_index = (buffer_index + i) & (buffer_size - 1);
          delay_buffers[b][in_index] = f_echo * feedback + f_input;
        }

        ++b;
      }

      feedback *= decay_mul;
    }

    buffer_index += size;
  };
}
