import { Terrain, GROUND_Y, TILE } from './terrain.js';
import { Rabbit, Fox, Hawk, Carrot, GoldCarrot, aabb, GRAVITY, JUMP_VY } from './entities.js';
import { Particles } from './particles.js';
import { SFX } from './audio.js';
import { phaseOf, nightness } from './daycycle.js';

export const VIEW_W = 320;
export const VIEW_H = 180;

const BASE_SPEED = 95;   // px/s
const MAX_SPEED = 235;
const SPEED_RAMP = 3.2;  // px/s Zuwachs pro Sekunde Spielzeit
const AIRTIME = 2 * -JUMP_VY / GRAVITY; // Sprungdauer ≈ 0,72 s
const RABBIT_SCREEN_X = 64;
const HIGHSCORE_KEY = 'rabbitrun2.highscore';
const POWER_TIME = 6;    // Sekunden Goldmöhren-Power
const COMBO_WINDOW = 1.6;

// Freischalt-Zeitpunkte (Sekunden Spielzeit), damit die Schwierigkeit
// nach und nach ansteigt
const UNLOCK_HIGH_PLATFORM = 18;
const UNLOCK_HAWK = 22;
const UNLOCK_ISLAND = 40;
const UNLOCK_FOX_PAIR = 55;

function loadHighscore() {
  try {
    return parseInt(localStorage.getItem(HIGHSCORE_KEY), 10) || 0;
  } catch {
    return 0;
  }
}

function saveHighscore(value) {
  try {
    localStorage.setItem(HIGHSCORE_KEY, String(value));
  } catch {
    // z. B. Private Browsing – Highscore gilt dann nur für diese Sitzung
  }
}

function quantize(v) {
  return Math.max(TILE, Math.round(v / TILE) * TILE);
}

export class Game {
  constructor() {
    this.highscore = loadHighscore();
    this.state = 'start'; // 'start' | 'running' | 'gameover'
    this.stateTime = 0;
    this.resetWorld();
  }

  resetWorld() {
    this.cameraX = 0;
    this.time = 0;
    this.speed = BASE_SPEED;
    this.score = 0;
    this.stats = { carrots: 0, stomps: 0 };
    this.combo = 0;
    this.comboTimer = 0;
    this.power = 0;
    this.shake = 0;
    this.newRecord = false;
    this.lastGoldX = -9999;
    this.terrain = new Terrain();
    this.terrain.appendSolid(VIEW_W + TILE * 4); // hindernisfreie Anlaufstrecke
    this.foxes = [];
    this.hawks = [];
    this.carrots = [];
    this.golds = [];
    this.popups = [];
    this.trail = [];
    this.particles = new Particles();
    this.rabbit = new Rabbit(RABBIT_SCREEN_X);
  }

  setState(state) {
    this.state = state;
    this.stateTime = 0;
  }

  onPress() {
    if (this.state === 'start') {
      this.setState('running');
    } else if (this.state === 'running') {
      this.rabbit.queueJump();
    } else if (this.state === 'gameover' && this.stateTime > 0.5) {
      this.resetWorld();
      this.setState('running');
    }
  }

  onRelease() {
    if (this.state === 'running') {
      this.rabbit.releaseJump();
    }
  }

  onDive() {
    if (this.state !== 'running') return;
    if (this.rabbit.dive()) SFX.dive();
  }

  popup(x, y, str, color = '#ffffff') {
    this.popups.push({ x, y, str, color, t: 0 });
  }

  update(dt) {
    this.stateTime += dt;
    this.particles.update(dt);
    for (const p of this.popups) p.t += dt;
    this.popups = this.popups.filter((p) => p.t < 0.8);

    if (this.state !== 'running') {
      this.rabbit.animTime += dt;
      return;
    }

    this.time += dt;
    this.speed = Math.min(MAX_SPEED, BASE_SPEED + SPEED_RAMP * this.time);
    this.cameraX += this.speed * dt;
    // Ein in die Schlucht gestürzter Hase prallt an der Wand ab und fällt
    // senkrecht, statt durch die Schluchtwand zu laufen.
    if (!this.rabbit.fallen) {
      this.rabbit.x = this.cameraX + RABBIT_SCREEN_X;
    }

    this.generateAhead();
    this.rabbit.update(dt, this.terrain);
    this.consumeRabbitEvents();

    if (this.power > 0) this.power = Math.max(0, this.power - dt);
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) this.combo = 0;
    }
    this.shake = Math.max(0, this.shake - dt);

    // Leuchtspur während der Goldmöhren-Power
    if (this.power > 0) {
      this.trail.push({ x: this.rabbit.x, y: this.rabbit.y, t: 0 });
    }
    for (const s of this.trail) s.t += dt;
    this.trail = this.trail.filter((s) => s.t < 0.25);

    for (const fox of this.foxes) {
      fox.update(dt);
      if (fox.squashed || !aabb(this.rabbit, fox)) continue;
      if (this.power > 0) {
        fox.squashed = true;
        this.stompReward(fox.x + fox.w / 2, fox.y, 25);
        continue;
      }
      // Zählt als Treffer von oben, wenn die Füße zu Frame-Beginn noch über
      // dem Fuchsrücken waren und der Hase fiel – auch wenn er im selben
      // Frame tiefer sinkt oder schon auf dem Boden aufsetzt.
      if (this.rabbit.fallSpeed > 40 && this.rabbit.prevFeet <= fox.y + fox.h * 0.75) {
        // Klassischer Hüpfer auf den Kopf – der Sturzflug macht ihn leichter
        fox.squashed = true;
        this.stompReward(fox.x + fox.w / 2, fox.y, 25);
        this.bounceRabbit();
      } else {
        this.gameOver();
        return;
      }
    }

    for (const hawk of this.hawks) {
      hawk.update(dt, this.rabbit);
      if (hawk.dead || !aabb(this.rabbit, hawk)) continue;
      if (this.power > 0) {
        hawk.dead = true;
        this.stompReward(hawk.x + hawk.w / 2, hawk.y, 25);
        continue;
      }
      if (this.rabbit.diving && this.rabbit.fallSpeed > 0 &&
          this.rabbit.prevFeet <= hawk.y + hawk.h * 0.8) {
        // Falke im Sturzflug erwischt – die Königsdisziplin
        hawk.dead = true;
        this.stompReward(hawk.x + hawk.w / 2, hawk.y, 40);
        this.bounceRabbit();
      } else {
        this.gameOver();
        return;
      }
    }

    const magnet = this.power > 0;
    for (const carrot of this.carrots) {
      carrot.update(dt);
      if (magnet) this.pull(carrot, dt);
      if (aabb(this.rabbit, carrot)) {
        carrot.collected = true;
        this.collectCarrot(carrot);
      }
    }
    this.carrots = this.carrots.filter((c) => !c.collected && c.x + c.w > this.cameraX - 24);

    for (const gold of this.golds) {
      gold.update(dt);
      if (magnet) this.pull(gold, dt);
      if (aabb(this.rabbit, gold)) {
        gold.collected = true;
        this.collectGold(gold);
      }
    }
    this.golds = this.golds.filter((c) => !c.collected && c.x + c.w > this.cameraX - 24);

    // Glühwürmchen in der Nacht
    const night = nightness(phaseOf(this.cameraX));
    if (night > 0.5 && Math.random() < 2.5 * dt) {
      this.particles.firefly(
        this.cameraX + Math.random() * VIEW_W,
        GROUND_Y - 8 - Math.random() * 60
      );
    }

    if (this.rabbit.y > VIEW_H + 8) {
      this.gameOver();
      return;
    }

    this.foxes = this.foxes.filter(
      (f) => f.x + f.w > this.cameraX - 24 && (!f.squashed || f.squashTime < 0.6)
    );
    this.hawks = this.hawks.filter((h) => !h.dead && h.x + h.w > this.cameraX - 32);
    this.terrain.prune(this.cameraX - TILE * 2);
  }

  consumeRabbitEvents() {
    const r = this.rabbit;
    if (r.justJumped) {
      r.justJumped = false;
      SFX.jump();
      this.particles.dust(r.x + r.w / 2, r.y + r.h + 2, 5);
    }
    if (r.justAirJumped) {
      r.justAirJumped = false;
      SFX.airJump();
      this.particles.poof(r.x + r.w / 2, r.y + r.h, 5);
    }
    if (r.slammed) {
      r.slammed = false;
      SFX.slam();
      this.shake = Math.max(this.shake, 0.15);
      this.particles.dust(r.x + r.w / 2, r.y + r.h + 2, 9);
    }
  }

  stompReward(x, y, pts) {
    this.score += pts;
    this.stats.stomps++;
    this.popup(x, y - 8, `+${pts}`, '#ffd75e');
    SFX.stomp();
    this.particles.poof(x, y);
  }

  bounceRabbit() {
    const r = this.rabbit;
    r.vy = r.jumpHeld ? -320 : -250;
    r.onGround = false;
    r.diving = false;
    r.airJumps = 1;
    this.shake = Math.max(this.shake, 0.1);
  }

  pull(c, dt) {
    const dx = this.rabbit.x + this.rabbit.w / 2 - (c.x + c.w / 2);
    const dy = this.rabbit.y + this.rabbit.h / 2 - (c.y + c.h / 2);
    const d = Math.hypot(dx, dy);
    if (d > 0.5 && d < 78) {
      const s = ((78 - d) * 6 * dt) / d;
      c.x += dx * s;
      c.y += dy * s;
    }
  }

  collectCarrot(c) {
    this.combo = this.comboTimer > 0 ? Math.min(5, this.combo + 1) : 1;
    this.comboTimer = COMBO_WINDOW;
    const pts = 10 * this.combo;
    this.score += pts;
    this.stats.carrots++;
    this.popup(
      c.x, c.y - 4,
      this.combo > 1 ? `+${pts} x${this.combo}` : `+${pts}`,
      this.combo > 1 ? '#ffd75e' : '#ffffff'
    );
    SFX.collect(this.combo);
    this.particles.sparkle(c.x + 4, c.y + 5, '#fff6e0', 5);
  }

  collectGold(c) {
    this.power = POWER_TIME;
    this.score += 50;
    this.popup(c.x, c.y - 6, 'GOLDMÖHRE! +50', '#ffd75e');
    SFX.gold();
    this.particles.sparkle(c.x + 4, c.y + 5, '#ffd75e', 14);
  }

  gameOver() {
    this.power = 0;
    this.combo = 0;
    if (this.score > this.highscore) {
      this.highscore = this.score;
      this.newRecord = true;
      saveHighscore(this.highscore);
      SFX.record();
    }
    SFX.gameover();
    this.setState('gameover');
  }

  generateAhead() {
    const targetX = this.cameraX + VIEW_W + TILE * 4;
    while (this.terrain.endX < targetX) {
      this.spawnFeature();
    }
  }

  // Erzeugt jeweils: sicheren Bodenabschnitt (mit Möhren, Plattform oder
  // Goldmöhre) + ein Hindernis (Schlucht, Insel-Schlucht, Falke oder Fuchs).
  spawnFeature() {
    // Geschwindigkeit, die der Hase ungefähr haben wird, wenn er diese Stelle erreicht
    const eta = (this.terrain.endX - this.cameraX) / this.speed;
    const v = Math.min(MAX_SPEED, this.speed + SPEED_RAMP * eta);
    const range = v * AIRTIME; // Weite eines vollen Sprungs

    const minSolid = Math.max(64, v * 0.5);
    const solid = quantize(minSolid + Math.random() * 80);
    const solidStart = this.terrain.endX;
    this.terrain.appendSolid(solid);
    this.decorateStretch(solidStart, solid);

    const roll = Math.random();
    if (this.time > UNLOCK_ISLAND && roll < 0.12) {
      this.spawnIslandGap(range);
    } else if (roll < 0.5) {
      this.spawnGap(v, range);
    } else if (this.time > UNLOCK_HAWK && roll < 0.7) {
      this.spawnHawk(v);
    } else {
      this.spawnFox(v);
    }
  }

  decorateStretch(start, width) {
    // Goldmöhre: selten und mit Mindestabstand zur letzten
    if (this.terrain.endX - this.lastGoldX > 1400 && width >= 96 && Math.random() < 0.12) {
      this.lastGoldX = this.terrain.endX;
      this.golds.push(new GoldCarrot(start + width / 2, GROUND_Y - 36 - Math.random() * 18));
      return;
    }
    if (width >= 112 && Math.random() < 0.35) {
      this.spawnPlatform(start, width);
      return;
    }
    this.maybeSpawnCarrotRow(start, width);
  }

  // Schwebende Plattform mit Möhrenreihe. Hohe Plattformen sind nur mit
  // Doppelsprung erreichbar und tauchen erst später auf.
  spawnPlatform(start, width) {
    const high = this.time > UNLOCK_HIGH_PLATFORM && Math.random() < 0.5;
    const y = high ? GROUND_Y - 72 : GROUND_Y - 44;
    const pw = (2 + Math.floor(Math.random() * 2)) * TILE;
    const px = start + TILE + Math.floor(Math.random() * Math.max(1, width - pw - 2 * TILE));
    this.terrain.addPlatform(px, pw, y);
    const count = Math.floor(pw / 12);
    for (let i = 0; i < count; i++) {
      this.carrots.push(new Carrot(px + 4 + i * 12, y - 13));
    }
  }

  spawnGap(v, range) {
    // Schlucht: höchstens 55 % der aktuellen maximalen Sprungweite
    const maxGap = Math.max(2 * TILE, Math.floor((0.55 * range) / TILE) * TILE);
    const steps = (maxGap - 2 * TILE) / TILE + 1;
    const gap = 2 * TILE + Math.floor(Math.random() * steps) * TILE;
    const gapStart = this.terrain.endX;
    this.terrain.appendGap(gap);
    if (Math.random() < 0.5) this.spawnCarrotArc(gapStart, gap, v);
  }

  // Breite Schlucht mit rettender Insel-Plattform in der Mitte –
  // zu weit für einen Sprung, also: rauf auf die Insel und weiter.
  spawnIslandGap(range) {
    const gap = quantize(range * (1.05 + Math.random() * 0.2));
    const gapStart = this.terrain.endX;
    this.terrain.appendGap(gap);
    const pw = 2 * TILE;
    const px = gapStart + Math.round((gap - pw) / 2);
    const py = GROUND_Y - 36;
    this.terrain.addPlatform(px, pw, py);
    this.carrots.push(new Carrot(px + 4, py - 13));
    this.carrots.push(new Carrot(px + 16, py - 13));
  }

  spawnHawk(v) {
    const stretch = quantize(Math.max(176, v * 0.9));
    const start = this.terrain.endX;
    this.terrain.appendSolid(stretch);
    this.hawks.push(new Hawk(start + stretch * 0.8, -0.35 * v));
  }

  spawnFox(v) {
    // Fuchs auf einem großzügigen festen Abschnitt, nie an einer Schluchtkante
    const pair = this.time > UNLOCK_FOX_PAIR && Math.random() < 0.4;
    const stretch = quantize(Math.max(pair ? 240 : 176, v * (pair ? 1.15 : 0.9)));
    const start = this.terrain.endX;
    this.terrain.appendSolid(stretch);
    this.foxes.push(new Fox(start + stretch * 0.7, -0.25 * v));
    if (pair) {
      this.foxes.push(new Fox(start + stretch * 0.95, -0.25 * v));
    }
  }

  maybeSpawnCarrotRow(start, width) {
    if (width < 64 || Math.random() > 0.6) return;
    const count = 1 + Math.floor(Math.random() * 3);
    const x0 = start + TILE + Math.random() * (width - 2 * TILE - count * 12);
    for (let i = 0; i < count; i++) {
      this.carrots.push(new Carrot(x0 + i * 12, GROUND_Y - 13));
    }
  }

  // Möhren entlang der echten Sprungparabel platzieren, damit ein voller
  // Sprung kurz vor der Kante sie zuverlässig einsammelt.
  spawnCarrotArc(gapStart, gapWidth, speed) {
    const EARLY = 0.08; // angenommener Absprung: so viele Sekunden vor der Kante
    for (const frac of [0.3, 0.5, 0.7]) {
      const t = EARLY + (gapWidth * frac) / speed;
      const h = -JUMP_VY * t - 0.5 * GRAVITY * t * t; // Höhe der Hasen-Unterkante
      const height = Math.min(60, Math.max(18, h + 12));
      this.carrots.push(new Carrot(gapStart + gapWidth * frac - 4, GROUND_Y - height));
    }
  }
}
