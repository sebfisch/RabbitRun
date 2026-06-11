import { SPRITES } from './sprites.js';
import { GROUND_Y, TILE } from './terrain.js';
import { VIEW_W, VIEW_H } from './game.js';

const SKY = '#7fc9ef';
const PIT_DARK = '#1b1426';
const PIT_EDGE = '#3a2a18';
const INK = '#222034';

function mod(n, m) {
  return ((n % m) + m) % m;
}

function text(ctx, str, x, y, size = 8, color = '#ffffff', align = 'center') {
  ctx.font = `bold ${size}px monospace`;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = INK;
  ctx.fillText(str, x + 1, y + 1);
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}

function drawClouds(ctx, cameraX) {
  const px = cameraX * 0.3;
  for (let i = 0; i < 5; i++) {
    const sprite = SPRITES.clouds[i % 2];
    const x = mod(i * 131 + 37 - px, VIEW_W + 96) - 48;
    const y = 12 + ((i * 29) % 50);
    ctx.drawImage(sprite, Math.round(x), y);
  }
}

function drawTerrain(ctx, game) {
  const startTile = Math.floor(game.cameraX / TILE);
  for (let i = 0; i <= VIEW_W / TILE + 1; i++) {
    const worldX = (startTile + i) * TILE;
    const screenX = Math.round(worldX - game.cameraX);
    if (game.terrain.groundAt(worldX + TILE / 2) === null) {
      // Schlucht: dunkler Abgrund
      ctx.fillStyle = PIT_EDGE;
      ctx.fillRect(screenX, GROUND_Y, TILE, 4);
      ctx.fillStyle = PIT_DARK;
      ctx.fillRect(screenX, GROUND_Y + 4, TILE, VIEW_H - GROUND_Y - 4);
    } else {
      ctx.drawImage(SPRITES.grass, screenX, GROUND_Y);
      ctx.drawImage(SPRITES.dirt, screenX, GROUND_Y + TILE);
    }
  }
}

function drawEntities(ctx, game) {
  const cam = game.cameraX;

  for (const carrot of game.carrots) {
    ctx.drawImage(SPRITES.carrot, Math.round(carrot.x - cam), Math.round(carrot.drawY));
  }

  for (const fox of game.foxes) {
    const frame = Math.floor(fox.animTime * 8) % 2;
    // Sprite (20x14) relativ zur Hitbox (16x10) zentriert/auf Boden gesetzt
    ctx.drawImage(SPRITES.fox[frame], Math.round(fox.x - 2 - cam), fox.y + fox.h - 14);
  }

  const r = game.rabbit;
  const animRate = Math.max(6, game.speed / 12);
  const sprite = r.onGround
    ? SPRITES.rabbitRun[Math.floor(r.animTime * animRate) % 2]
    : SPRITES.rabbitJump;
  ctx.drawImage(sprite, Math.round(r.x - 3 - cam), Math.round(r.y + r.h - 16));

  // Einsammel-Funkeln
  ctx.fillStyle = '#fff6e0';
  for (const e of game.effects) {
    const d = 2 + (e.t / 0.3) * 6;
    const x = Math.round(e.x - cam);
    const y = Math.round(e.y);
    ctx.fillRect(x + d, y, 1, 1);
    ctx.fillRect(x - d, y, 1, 1);
    ctx.fillRect(x, y + d, 1, 1);
    ctx.fillRect(x, y - d, 1, 1);
  }
}

function drawHud(ctx, game) {
  ctx.drawImage(SPRITES.carrot, 4, 3);
  text(ctx, `x ${game.score}`, 16, 12, 8, '#ffffff', 'left');
}

function drawStartOverlay(ctx, game) {
  text(ctx, 'RABBIT RUN', VIEW_W / 2, 56, 22, '#ffd75e');
  text(ctx, 'Tippen oder Leertaste: Springen', VIEW_W / 2, 80);
  text(ctx, 'Länger halten = höher springen!', VIEW_W / 2, 93);
  text(ctx, 'Sammle Möhren, weiche Füchsen aus!', VIEW_W / 2, 106);
  if (game.highscore > 0) {
    text(ctx, `Rekord: ${game.highscore}`, VIEW_W / 2, 122, 8, '#fff6e0');
  }
  if (Math.floor(game.stateTime * 1.5) % 2 === 0) {
    text(ctx, 'Tippen zum Starten', VIEW_W / 2, 138, 8, '#ffd75e');
  }
}

function drawGameOverOverlay(ctx, game) {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  text(ctx, 'GAME OVER', VIEW_W / 2, 60, 18, '#ff5a5a');
  text(ctx, `Möhren: ${game.score}`, VIEW_W / 2, 86);
  if (game.newRecord) {
    text(ctx, `Neuer Rekord: ${game.highscore}!`, VIEW_W / 2, 102, 8, '#ffd75e');
  } else {
    text(ctx, `Rekord: ${game.highscore}`, VIEW_W / 2, 102, 8, '#fff6e0');
  }
  if (game.stateTime > 0.5 && Math.floor(game.stateTime * 1.5) % 2 === 0) {
    text(ctx, 'Tippen für Neustart', VIEW_W / 2, 130, 8, '#ffd75e');
  }
}

export function render(ctx, game) {
  ctx.fillStyle = SKY;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.drawImage(SPRITES.sun, 284, 12);
  drawClouds(ctx, game.cameraX);
  drawTerrain(ctx, game);
  drawEntities(ctx, game);
  drawHud(ctx, game);

  if (game.state === 'start') drawStartOverlay(ctx, game);
  else if (game.state === 'gameover') drawGameOverOverlay(ctx, game);
}
