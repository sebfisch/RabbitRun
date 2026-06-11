import { Game, VIEW_W, VIEW_H } from './game.js';
import { render } from './render.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

function resize() {
  const s = Math.min(window.innerWidth / VIEW_W, window.innerHeight / VIEW_H);
  // ab Faktor 2 ganzzahlig skalieren (gleichmäßige Pixel), darunter bildschirmfüllend
  const scale = s >= 2 ? Math.floor(s) : s;
  canvas.style.width = `${Math.round(VIEW_W * scale)}px`;
  canvas.style.height = `${Math.round(VIEW_H * scale)}px`;
}
resize();
window.addEventListener('resize', resize);
window.addEventListener('orientationchange', resize);

const game = new Game();

window.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  game.onPress();
});
// verhindert Doppeltipp-Zoom/Scrollen auf iOS; Eingabe läuft über pointerdown
window.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
window.addEventListener('contextmenu', (e) => e.preventDefault());
window.addEventListener('keydown', (e) => {
  if (e.repeat) return;
  if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
    e.preventDefault();
    game.onPress();
  }
});

const STEP = 1 / 60;
let last = performance.now();
let accumulator = 0;

function frame(now) {
  let dt = (now - last) / 1000;
  last = now;
  if (dt > 0.1) dt = 0.1; // Tab-Wechsel: keine Physik-Sprünge
  accumulator += dt;
  while (accumulator >= STEP) {
    game.update(STEP);
    accumulator -= STEP;
  }
  ctx.imageSmoothingEnabled = false;
  render(ctx, game);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
