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
document.addEventListener('fullscreenchange', resize);

// Vollbild geht aus Sicherheitsgründen nur nach einer Nutzergeste, daher beim
// Klick/Tap, der das Spiel startet (nicht bei Sprüngen). Beim Game Over wird
// es wieder verlassen. iOS Safari unterstützt die Fullscreen-API nicht –
// dort bleibt es beim Vollbild-Layout.
function tryFullscreen() {
  if (document.fullscreenElement) return;
  const el = document.documentElement;
  const request = el.requestFullscreen || el.webkitRequestFullscreen;
  if (request) {
    try {
      const result = request.call(el);
      if (result && result.catch) result.catch(() => {});
    } catch {
      // Vollbild nicht verfügbar – Spiel läuft normal weiter
    }
  }
}

function exitFullscreen() {
  if (!document.fullscreenElement) return;
  const exit = document.exitFullscreen || document.webkitExitFullscreen;
  if (exit) {
    try {
      const result = exit.call(document);
      if (result && result.catch) result.catch(() => {});
    } catch {
      // ignorieren
    }
  }
}

const game = new Game();

function startsGame() {
  return game.state === 'start' || (game.state === 'gameover' && game.stateTime > 0.5);
}

// Bei Touch-Eingaben gilt erst pointerup als Nutzergeste für die
// Fullscreen-API, daher wird Vollbild beim Loslassen des Start-Taps angefordert.
let fullscreenOnRelease = false;

window.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  if (startsGame()) fullscreenOnRelease = true;
  game.onPress();
});
window.addEventListener('pointerup', () => {
  if (fullscreenOnRelease) {
    fullscreenOnRelease = false;
    tryFullscreen();
  }
  game.onRelease();
});
window.addEventListener('pointercancel', () => {
  fullscreenOnRelease = false;
  game.onRelease();
});
// verhindert Doppeltipp-Zoom/Scrollen auf iOS; Eingabe läuft über pointerdown
window.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
window.addEventListener('contextmenu', (e) => e.preventDefault());
const JUMP_KEYS = ['Space', 'ArrowUp', 'KeyW'];
window.addEventListener('keydown', (e) => {
  if (e.repeat) return;
  if (JUMP_KEYS.includes(e.code)) {
    e.preventDefault();
    game.onPress();
  }
});
window.addEventListener('keyup', (e) => {
  if (JUMP_KEYS.includes(e.code)) game.onRelease();
});

const STEP = 1 / 60;
let last = performance.now();
let accumulator = 0;
let prevState = game.state;

function frame(now) {
  let dt = (now - last) / 1000;
  last = now;
  if (dt > 0.1) dt = 0.1; // Tab-Wechsel: keine Physik-Sprünge
  accumulator += dt;
  while (accumulator >= STEP) {
    game.update(STEP);
    accumulator -= STEP;
  }
  if (game.state === 'gameover' && prevState !== 'gameover') {
    exitFullscreen();
  }
  prevState = game.state;
  ctx.imageSmoothingEnabled = false;
  render(ctx, game);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
