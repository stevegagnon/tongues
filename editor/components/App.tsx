import { h } from 'atomico';

export default function App({sound: playSound}) {
  return (
    <button onclick={playSound}>Play</button>
  );
}
