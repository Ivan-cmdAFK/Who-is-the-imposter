import { render } from 'preact';
import { registerSW } from 'virtual:pwa-register';
import { App } from './App';
import './styles.css';

registerSW({ immediate: true });

// iOS Safari only applies :active (the press animations) when a touch listener exists.
document.addEventListener('touchstart', () => {}, { passive: true });

render(<App />, document.getElementById('app')!);
