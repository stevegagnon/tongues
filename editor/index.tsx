import { h, render } from 'atomico';
import App from './components/App';
import { player } from '../synth/player';
import { ZzFx } from '../synth/ZzFx';
import song from './song';
import soundbox from '../synth/soundbox';
import voice from '../synth/voice';
import ks from '../synth/ks';
import outer_m2 from '../synth/outer_m2';

/*
const [playSound] = player([
  [ZzFx, [.4,.1,1,1.1,.96,6.8,.8,.7,.42]]
]);


const [playSound] = player([
  [soundbox, [song]]
]);



const [playSound] = player([
  [voice, ['oijuaeE']]
]);

const [playSound] = player([
  [outer_m2, []]
]);


const [playSound] = player([
  [ks, []]
]);

*/

const [playSound] = player([
  [soundbox, [song]]
]);



render(<App sound={playSound} />, document.body);
