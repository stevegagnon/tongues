
import { generate_random_data } from './util';

const BASE_SAMPLE_RATE = 44100.0;
const DELAY_STEP = 256 / BASE_SAMPLE_RATE;
const NBUFS = 200;
const NOISESIZE = 64;
const NPARAMS = 20;

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

export function reverb(param, sample_rate) {
  let filter = (a, i, value, strength) => {
    const c = a[i];
    a[i] = c + (value - c) * strength;
    return a[i];
  }

  let buffer_size = buffer_size_for_sample_rate(sample_rate);
  let buffer_index = 0;

  let delay_buffers = [];
  let random_data = generate_random_data(NOISESIZE * NOISESIZE * NOISESIZE);
  let feedback = param.max_decay;
  let b = 0;

  let sample_rate_scale = sample_rate / BASE_SAMPLE_RATE;
  let scaled_delayadd = Math.round(param.delayadd * sample_rate_scale);
  // Heuristic adjustment of filter coefficients to sort of compensate for sample rate.
  // Hits the frequency content pretty well, but still gives variation in decay time.
  let scaled_filterlow = Math.pow(param.filterlow, Math.sqrt(sample_rate_scale));
  let scaled_filterhigh = Math.pow(param.filterhigh, Math.sqrt(sample_rate_scale));
  let scaled_dampenlow = Math.pow(param.dampenlow, Math.sqrt(sample_rate_scale));
  let scaled_dampenhigh = Math.pow(param.dampenhigh, Math.sqrt(sample_rate_scale));
  
  return (buffer) => {
    let size = buffer.length;

    for (let delay = param.delaymin+1; delay < param.delaymax+1; ++delay) {
			let random = random_data[param.seed + delay];
      // Is there an echo with this delay?
      // FIX: this depends on 64 bit ints. need make work with 32
			if ((random * (delay - param.delaymin)) >> 32 < (param.nbufs - b)) {
				let scaled_delay = Math.round(delay * sample_rate_scale);
        let c = b & 1;
        for (let i = 0; i < size; ++i) {
					// Extract delayed signal
					let out_index = (buffer_index + i - scaled_delay - scaled_delayadd) & (buffer_size - 1);
					let out = delay_buffers[b][out_index];
					outputs[c][i] += out * param.volumes[c];

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

				b += 1;
			}

			feedback *= param.decay_mul;
		}

		buffer_index += size;
  };
}





































/*

const MAXDELAY = 25600;
const NBUFS = 200;

function quantize(value, level) {

	local mask = bit.lshift(-1, math.floor(level * 31))
	local add = bit.rshift(-mask, 1)
	local f = ffi.new("float[1]")
	local i = ffi.new("int[1]")
	f[0] = value;
	ffi.copy(i, f, 4)
	i[0] = bit.band(i[0] + add, mask)
	ffi.copy(f, i, 4)
  return f[0]

  const mask = -1 << Math.floor(level * 31);
  const add = -mask >> 1;
}

export const paramnames = [
  'mix',
  'pan',
  'delaymin',
  'delaymax',
  'delayadd',
  'halftime',
  'filterlow',
  'filterhigh',
  'dampenlow',
  'dampenhigh',
  'n',
  'seed',
  'q_mixpan',
  'q_flow',
  'q_fhigh',
  'q_dlow',
  'q_dhigh'
];

function generateRandomData() {
  const randomstate = [0x6F15AAF2, 0x4E89D208, 0x9548B49A, 0x9C4FD335];
  for (let i = 0; i <= 262143; ++i) {
    let r = 0;
    for (let s = 1; s <= 3; ++s) {
      let rs = randomstate[s];
      rs = 
    }
  }
}

export function process(
  params: number[],
  numSamples: number,
  inputs: Float32Array,
  outputs: Float32Array,
) {
  let [
    mix,
    pan,
    delaymin,
    delaymax,
    delayadd,
    halftime,
    filterlow,
    filterhigh,
    dampenlow,
    dampenhigh,
    n,
    seed,
    q_mixpan,
    q_flow,
    q_fhigh,
    q_dlow,
    q_dhigh
  ] = params;

  const temp = new Float32Array(numSamples * 2);
  temp.fill(0);

  delaymin    = Math.floor(delaymin * Math.floor(MAXDELAY / 256) + 0.5) * 256
	delaymax    = Math.floor(delaymax * Math.floor(MAXDELAY / 256) + 0.5) * 256
	delayadd    = Math.floor(delayadd * Math.floor(MAXDELAY / 256) + 0.5) * 256
	filterlow   = Math.min(1, quantize(Math.pow(filterlow,  2), q_flow))
	filterhigh  = Math.min(1, quantize(Math.pow(filterhigh, 2), q_fhigh))
	dampenlow   = Math.min(1, quantize(Math.pow(dampenlow,  2), q_dlow))
	dampenhigh  = Math.min(1, quantize(Math.pow(dampenhigh, 2), q_dhigh))
	const nbufs = Math.floor(n * (NBUFS / 2) + 0.5) * 2
	seed        = Math.floor(seed * 100 + 0.5) * 2048
  mix         = mix * 10 / Math.sqrt(nbufs)
  

  for (let delay = delaymax; delay > delaymin; --delay) {

  }
}

*/