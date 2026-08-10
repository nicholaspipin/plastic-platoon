import './style.css';
import { PlasticPlatoonGame } from './plastic-platoon';

const root = document.querySelector<HTMLDivElement>('#app');

if (!root) {
  throw new Error('Missing #app root');
}

const game = new PlasticPlatoonGame(root, __BUILD_SHA__);
void game.start();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('./sw.js').catch(() => undefined);
  });
}

Object.assign(window, {
  plasticPlatoon: game
});
