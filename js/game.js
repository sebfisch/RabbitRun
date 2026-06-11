import { Terrain, GROUND_Y, TILE } from './terrain.js';
import { Rabbit, Fox, Carrot, aabb, GRAVITY, JUMP_VY } from './entities.js';

export const VIEW_W = 320;
export const VIEW_H = 180;

const BASE_SPEED = 95;   // px/s
const MAX_SPEED = 230;
const SPEED_RAMP = 3.2;  // px/s Zuwachs pro Sekunde Spielzeit
const AIRTIME = 2 * -JUMP_VY / GRAVITY; // Sprungdauer ≈ 0,72 s
const RABBIT_SCREEN_X = 64;
const HIGHSCORE_KEY = 'rabbitrun.highscore';

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
    this.newRecord = false;
    this.terrain = new Terrain();
    this.terrain.appendSolid(VIEW_W + TILE * 4); // hindernisfreie Anlaufstrecke
    this.foxes = [];
    this.carrots = [];
    this.effects = [];
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

  update(dt) {
    this.stateTime += dt;
    if (this.state !== 'running') {
      this.rabbit.animTime += dt;
      return;
    }

    this.time += dt;
    this.speed = Math.min(MAX_SPEED, BASE_SPEED + SPEED_RAMP * this.time);
    this.cameraX += this.speed * dt;
    this.rabbit.x = this.cameraX + RABBIT_SCREEN_X;

    this.generateAhead();
    this.rabbit.update(dt, this.terrain);

    for (const fox of this.foxes) {
      fox.update(dt);
      if (aabb(this.rabbit, fox)) {
        this.gameOver();
        return;
      }
    }

    for (const carrot of this.carrots) {
      carrot.update(dt);
      if (aabb(this.rabbit, carrot)) {
        carrot.collected = true;
        this.score++;
        this.effects.push({ x: carrot.x + 4, y: carrot.y + 5, t: 0 });
      }
    }
    this.carrots = this.carrots.filter((c) => !c.collected && c.x + c.w > this.cameraX - 24);

    for (const e of this.effects) e.t += dt;
    this.effects = this.effects.filter((e) => e.t < 0.3);

    if (this.rabbit.y > VIEW_H + 8) {
      this.gameOver();
      return;
    }

    this.foxes = this.foxes.filter((f) => f.x + f.w > this.cameraX - 24);
    this.terrain.prune(this.cameraX - TILE * 2);
  }

  gameOver() {
    if (this.score > this.highscore) {
      this.highscore = this.score;
      this.newRecord = true;
      saveHighscore(this.highscore);
    }
    this.setState('gameover');
  }

  generateAhead() {
    const targetX = this.cameraX + VIEW_W + TILE * 4;
    while (this.terrain.endX < targetX) {
      this.spawnFeature();
    }
  }

  // Erzeugt jeweils: sicheren Bodenabschnitt + ein Hindernis (Schlucht oder Fuchs).
  spawnFeature() {
    // Geschwindigkeit, die der Hase ungefähr haben wird, wenn er diese Stelle erreicht
    const eta = (this.terrain.endX - this.cameraX) / this.speed;
    const speedAtArrival = Math.min(MAX_SPEED, this.speed + SPEED_RAMP * eta);

    const minSolid = Math.max(64, speedAtArrival * 0.5);
    const solid = quantize(minSolid + Math.random() * 80);
    const solidStart = this.terrain.endX;
    this.terrain.appendSolid(solid);
    this.maybeSpawnCarrotRow(solidStart, solid);

    if (Math.random() < 0.5) {
      // Schlucht: höchstens 55 % der aktuellen maximalen Sprungweite
      const maxGap = Math.max(2 * TILE, Math.floor(0.55 * speedAtArrival * AIRTIME / TILE) * TILE);
      const steps = (maxGap - 2 * TILE) / TILE + 1;
      const gap = 2 * TILE + Math.floor(Math.random() * steps) * TILE;
      const gapStart = this.terrain.endX;
      this.terrain.appendGap(gap);
      if (Math.random() < 0.5) this.spawnCarrotArc(gapStart, gap);
    } else {
      // Fuchs auf einem großzügigen festen Abschnitt, nie an einer Schluchtkante
      const stretch = quantize(Math.max(176, speedAtArrival * 0.9));
      const foxX = this.terrain.endX + stretch * 0.7;
      this.terrain.appendSolid(stretch);
      this.foxes.push(new Fox(foxX, -0.25 * speedAtArrival));
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

  spawnCarrotArc(gapStart, gapWidth) {
    const offsets = [
      [0.3, 34],
      [0.5, 42],
      [0.7, 34],
    ];
    for (const [frac, height] of offsets) {
      this.carrots.push(new Carrot(gapStart + gapWidth * frac - 4, GROUND_Y - height));
    }
  }
}
