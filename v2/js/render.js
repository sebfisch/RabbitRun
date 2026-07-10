import { SPRITES } from './sprites.js';
import { GROUND_Y, TILE } from './terrain.js';
import { VIEW_W, VIEW_H } from './game.js';
import { phaseOf, colorsAt, rgb } from './daycycle.js';

const PIT_DARK = '#1b1426';
const PIT_EDGE = '#3a2a18';
const INK = '#222034';

function mod(n, m) {
  return ((n % m) + m) % m;
}

// Deterministischer Pseudo-Zufall für Sterne und Hintergrund-Bäume
function hash(n) {
  const s = Math.sin(n * 127.1) * 43758.5453;
  return s - Math.floor(s);
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

function drawSky(ctx, colors) {
  const grad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
  grad.addColorStop(0, rgb(colors.top));
  grad.addColorStop(1, rgb(colors.bot));
  ctx.fillStyle = grad;
  ctx.fillRect(-8, -8, VIEW_W + 16, VIEW_H + 16);
}

function drawStars(ctx, night, time) {
  if (night <= 0.05) return;
  ctx.fillStyle = '#fff6e0';
  for (let i = 0; i < 45; i++) {
    const x = Math.floor(hash(i) * VIEW_W);
    const y = Math.floor(hash(i + 99) * 95);
    const twinkle = 0.5 + 0.5 * Math.sin(time * 2 + i * 1.7);
    ctx.globalAlpha = night * (0.25 + 0.75 * twinkle);
    ctx.fillRect(x, y, 1, 1);
  }
  ctx.globalAlpha = 1;
}

function drawSunMoon(ctx, colors) {
  const sunAlpha = Math.max(0, Math.min(1, 1 - colors.n * 1.8));
  const moonAlpha = Math.max(0, Math.min(1, colors.n * 1.6 - 0.4));
  if (sunAlpha > 0) {
    ctx.globalAlpha = sunAlpha;
    ctx.drawImage(SPRITES.sun, 284, 12);
  }
  if (moonAlpha > 0) {
    ctx.globalAlpha = moonAlpha;
    ctx.drawImage(SPRITES.moon, 282, 14);
  }
  ctx.globalAlpha = 1;
}

function hillLayer(ctx, px, color, baseY, seed, freq, amp) {
  ctx.fillStyle = color;
  for (let x = 0; x < VIEW_W; x += 4) {
    const wx = x + px;
    const h = Math.sin(wx * freq + seed) * amp
      + Math.sin(wx * freq * 2.6 + seed * 3.1) * amp * 0.4;
    const y = Math.max(40, Math.round((baseY + h) / 2) * 2);
    ctx.fillRect(x, y, 4, GROUND_Y - y);
  }
}

function drawHills(ctx, cameraX, colors) {
  hillLayer(ctx, cameraX * 0.15, rgb(colors.far), 100, 7, 0.006, 24);
  hillLayer(ctx, cameraX * 0.3, rgb(colors.near), 118, 5, 0.011, 14);
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

function drawTrees(ctx, cameraX) {
  const px = cameraX * 0.55;
  const spacing = 76;
  const first = Math.floor(px / spacing) - 1;
  for (let i = 0; i < VIEW_W / spacing + 3; i++) {
    const idx = first + i;
    const r = hash(idx * 13.7);
    if (r < 0.3) continue;
    const sprite = r < 0.68 ? SPRITES.bush : SPRITES.tree;
    const x = Math.round(idx * spacing - px + (hash(idx * 7.3) - 0.5) * 36);
    ctx.drawImage(sprite, x, GROUND_Y - sprite.height);
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

  for (const p of game.terrain.platforms) {
    const sx = Math.round(p.x - game.cameraX);
    if (sx > VIEW_W || sx + p.width < 0) continue;
    for (let i = 0; i < p.width / TILE; i++) {
      ctx.drawImage(SPRITES.platform, sx + i * TILE, p.y);
    }
  }
}

function drawParticles(ctx, game, glowPass) {
  for (const p of game.particles.items) {
    if (p.glow !== glowPass) continue;
    let a = 1 - p.age / p.life;
    if (p.flicker) a *= 0.5 + 0.5 * Math.sin(p.age * 14);
    ctx.globalAlpha = Math.max(0, Math.min(1, a));
    ctx.fillStyle = p.color;
    ctx.fillRect(Math.round(p.x - game.cameraX), Math.round(p.y), p.size, p.size);
  }
  ctx.globalAlpha = 1;
}

function drawRabbit(ctx, game) {
  const r = game.rabbit;
  const cam = game.cameraX;

  // Leuchtspur während der Goldmöhren-Power
  for (const s of game.trail) {
    ctx.globalAlpha = 0.3 * (1 - s.t / 0.25);
    ctx.drawImage(SPRITES.rabbitJump, Math.round(s.x - 3 - cam), Math.round(s.y + r.h - 16));
  }
  ctx.globalAlpha = 1;

  const animRate = Math.max(6, game.speed / 12);
  let sprite;
  if (r.onGround) {
    sprite = SPRITES.rabbitRun[Math.floor(r.animTime * animRate) % 2];
  } else if (r.flutterTime < 0.25) {
    sprite = SPRITES.rabbitFlutter;
  } else {
    sprite = SPRITES.rabbitJump;
  }

  // Squash & Stretch: in der Luft gestreckt, bei der Landung gestaucht
  let sx = 1;
  let sy = 1;
  if (!r.onGround) {
    const k = Math.min(0.22, Math.abs(r.vy) / 2200);
    sy = 1 + k;
    sx = 1 - k * 0.7;
  } else if (r.landTimer > 0) {
    const k = (r.landTimer / 0.12) * 0.3;
    sy = 1 - k;
    sx = 1 + k;
  }
  const fx = r.x + r.w / 2 - cam;
  const fy = r.y + r.h;
  ctx.save();
  ctx.translate(Math.round(fx), Math.round(fy));
  ctx.scale(sx, sy);
  ctx.drawImage(sprite, -8, -16);
  ctx.restore();
}

function drawEntities(ctx, game) {
  const cam = game.cameraX;

  for (const carrot of game.carrots) {
    ctx.drawImage(SPRITES.carrot, Math.round(carrot.x - cam), Math.round(carrot.drawY));
  }

  for (const gold of game.golds) {
    const x = Math.round(gold.x - cam);
    const y = Math.round(gold.drawY);
    ctx.drawImage(SPRITES.goldCarrot, x, y);
    // Funkel-Ring
    ctx.fillStyle = '#ffd75e';
    for (let i = 0; i < 4; i++) {
      const a = gold.t * 3 + (i * Math.PI) / 2;
      ctx.fillRect(x + 4 + Math.round(Math.cos(a) * 9), y + 5 + Math.round(Math.sin(a) * 8), 1, 1);
    }
  }

  for (const fox of game.foxes) {
    if (fox.squashed) {
      // Plattgemacht: Sprite an der Bodenkante zusammenstauchen
      ctx.save();
      ctx.translate(Math.round(fox.x + fox.w / 2 - cam), GROUND_Y);
      ctx.scale(1.3, Math.max(0.15, 0.4 - fox.squashTime));
      ctx.drawImage(SPRITES.fox[0], -10, -14);
      ctx.restore();
      continue;
    }
    const frame = Math.floor(fox.animTime * 8) % 2;
    // Sprite (20x14) relativ zur Hitbox (16x10) zentriert/auf Boden gesetzt
    ctx.drawImage(SPRITES.fox[frame], Math.round(fox.x - 2 - cam), fox.y + fox.h - 14);
  }

  for (const hawk of game.hawks) {
    const frame = hawk.state === 'swoop' ? 1 : Math.floor(hawk.t * 8) % 2;
    ctx.drawImage(SPRITES.hawk[frame], Math.round(hawk.x - 2 - cam), Math.round(hawk.y - 2));
  }

  drawRabbit(ctx, game);
}

function drawAura(ctx, game) {
  if (game.power <= 0 || game.state !== 'running') return;
  // Kurz vor Schluss blinkt die Aura als Warnung
  if (game.power < 1.3 && Math.floor(game.power * 8) % 2 === 0) return;
  const r = game.rabbit;
  ctx.fillStyle = '#ffd75e';
  for (let i = 0; i < 3; i++) {
    const a = game.time * 7 + i * 2.09;
    const x = Math.round(r.x + r.w / 2 - game.cameraX + Math.cos(a) * 12);
    const y = Math.round(r.y + r.h / 2 + Math.sin(a) * 9);
    ctx.fillRect(x, y, 2, 2);
  }
}

function drawPopups(ctx, game) {
  for (const p of game.popups) {
    ctx.globalAlpha = Math.max(0, 1 - p.t / 0.8);
    text(ctx, p.str, Math.round(p.x - game.cameraX), Math.round(p.y - p.t * 22), 7, p.color);
  }
  ctx.globalAlpha = 1;
}

function drawHud(ctx, game) {
  ctx.drawImage(SPRITES.carrot, 4, 3);
  text(ctx, `x ${game.stats.carrots}`, 16, 12, 8, '#ffffff', 'left');
  text(ctx, String(game.score), VIEW_W - 4, 12, 8, '#ffffff', 'right');
  if (game.combo > 1 && game.comboTimer > 0) {
    text(ctx, `COMBO x${game.combo}`, VIEW_W - 4, 24, 8, '#ffd75e', 'right');
  }
  if (game.power > 0) {
    const w = Math.round(46 * (game.power / 6));
    ctx.fillStyle = INK;
    ctx.fillRect(VIEW_W / 2 - 25, 5, 50, 6);
    ctx.fillStyle = '#ffd75e';
    ctx.fillRect(VIEW_W / 2 - 23, 7, w, 2);
  }
}

function drawStartOverlay(ctx, game) {
  text(ctx, 'RABBIT RUN 2', VIEW_W / 2, 44, 22, '#ffd75e');
  text(ctx, 'Tippen: springen - halten = höher', VIEW_W / 2, 68, 8);
  text(ctx, 'In der Luft tippen: Doppelsprung', VIEW_W / 2, 81, 8);
  text(ctx, 'Nach unten wischen: Sturzflug!', VIEW_W / 2, 94, 8);
  text(ctx, 'Spring Füchsen auf den Kopf', VIEW_W / 2, 107, 8);
  text(ctx, 'Goldmöhre: Magnet + unbesiegbar', VIEW_W / 2, 120, 8);
  if (game.highscore > 0) {
    text(ctx, `Rekord: ${game.highscore}`, VIEW_W / 2, 134, 8, '#fff6e0');
  }
  if (Math.floor(game.stateTime * 1.5) % 2 === 0) {
    text(ctx, 'Tippen zum Starten', VIEW_W / 2, 146, 8, '#ffd75e');
  }
}

function drawGameOverOverlay(ctx, game) {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  text(ctx, 'GAME OVER', VIEW_W / 2, 54, 18, '#ff5a5a');
  text(ctx, `Punkte: ${game.score}`, VIEW_W / 2, 80, 10);
  text(
    ctx,
    `Möhren: ${game.stats.carrots}   Plattgemacht: ${game.stats.stomps}`,
    VIEW_W / 2, 96, 8
  );
  if (game.newRecord) {
    text(ctx, `Neuer Rekord: ${game.highscore}!`, VIEW_W / 2, 112, 8, '#ffd75e');
  } else {
    text(ctx, `Rekord: ${game.highscore}`, VIEW_W / 2, 112, 8, '#fff6e0');
  }
  if (game.stateTime > 0.5 && Math.floor(game.stateTime * 1.5) % 2 === 0) {
    text(ctx, 'Tippen für Neustart', VIEW_W / 2, 136, 8, '#ffd75e');
  }
}

export function render(ctx, game) {
  const colors = colorsAt(phaseOf(game.cameraX));
  const time = game.time + game.stateTime;

  ctx.save();
  if (game.shake > 0) {
    const mag = game.shake * 14;
    ctx.translate(
      Math.round((Math.random() - 0.5) * mag),
      Math.round((Math.random() - 0.5) * mag)
    );
  }

  drawSky(ctx, colors);
  drawStars(ctx, colors.n, time);
  drawSunMoon(ctx, colors);
  drawHills(ctx, game.cameraX, colors);
  drawClouds(ctx, game.cameraX);
  drawTrees(ctx, game.cameraX);
  drawTerrain(ctx, game);
  drawParticles(ctx, game, false);
  drawEntities(ctx, game);

  // Nachtabdunklung: multipliziert die ganze Szene mit dem Lichtwert des
  // Tageszyklus. Glow-Partikel und HUD werden danach gezeichnet und
  // "leuchten" so im Dunkeln.
  const l = colors.light;
  if (l[0] < 250 || l[1] < 250 || l[2] < 250) {
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = rgb(l);
    ctx.fillRect(-8, -8, VIEW_W + 16, VIEW_H + 16);
    ctx.globalCompositeOperation = 'source-over';
  }

  drawParticles(ctx, game, true);
  drawAura(ctx, game);
  drawPopups(ctx, game);
  ctx.restore();

  drawHud(ctx, game);
  if (game.state === 'start') drawStartOverlay(ctx, game);
  else if (game.state === 'gameover') drawGameOverOverlay(ctx, game);
}
