import { GROUND_Y } from './terrain.js';

export const GRAVITY = 950;       // px/s²
export const JUMP_VY = -340;      // px/s, voller Sprung (Taste gehalten)
const JUMP_VY_TAP = -240;         // Sprung, wenn beim Absprung schon losgelassen
const JUMP_CUT_VY = -130;         // Aufstieg wird beim Loslassen hierauf gekappt

export function aabb(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export class Rabbit {
  constructor(x) {
    // Hitbox kleiner als das 16x16-Sprite (spielerfreundlich)
    this.x = x;
    this.w = 10;
    this.h = 12;
    this.y = GROUND_Y - this.h;
    this.vy = 0;
    this.onGround = true;
    this.coyote = 0;       // Restzeit, in der nach Verlassen des Bodens noch gesprungen werden darf
    this.jumpBuffer = 0;   // Restzeit, in der ein zu früher Tastendruck noch zählt
    this.jumpHeld = false;
    this.fallen = false;   // in eine Schlucht gestürzt (unter die Bodenkante)
    this.animTime = 0;
  }

  queueJump() {
    this.jumpBuffer = 0.1;
    this.jumpHeld = true;
  }

  // Loslassen: je kürzer der Tap, desto niedriger der Sprung
  releaseJump() {
    this.jumpHeld = false;
    if (!this.onGround && this.vy < JUMP_CUT_VY) {
      this.vy = JUMP_CUT_VY;
    }
  }

  update(dt, terrain) {
    this.animTime += dt;

    if (this.jumpBuffer > 0 && (this.onGround || this.coyote > 0)) {
      this.vy = this.jumpHeld ? JUMP_VY : JUMP_VY_TAP;
      this.onGround = false;
      this.coyote = 0;
      this.jumpBuffer = 0;
    }
    this.jumpBuffer = Math.max(0, this.jumpBuffer - dt);

    const feetBefore = this.y + this.h;
    this.vy += GRAVITY * dt;
    this.y += this.vy * dt;

    // Landen nur, wenn der Hase von oben kommt. Wer beim Überqueren einer
    // Schlucht unter die Bodenkante sinkt, kann nicht auf der anderen Seite
    // "auftauchen" – auch schmale Schluchten sind damit tödlich.
    const ground = terrain.groundAt(this.x + this.w / 2);
    if (ground !== null && this.vy >= 0 && this.y + this.h >= ground && feetBefore <= ground + 0.5) {
      this.y = ground - this.h;
      this.vy = 0;
      this.onGround = true;
      this.coyote = 0.08;
    } else {
      this.onGround = false;
      this.coyote = Math.max(0, this.coyote - dt);
    }

    if (!this.onGround && this.y + this.h > GROUND_Y + 4) {
      this.fallen = true;
    }
  }
}

export class Fox {
  constructor(x, vx) {
    this.w = 16;
    this.h = 10;
    this.x = x;
    this.y = GROUND_Y - this.h;
    this.vx = vx; // negativ: läuft dem Hasen entgegen
    this.animTime = Math.random();
  }

  update(dt) {
    this.x += this.vx * dt;
    this.animTime += dt;
  }
}

export class Carrot {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.w = 8;
    this.h = 10;
    this.t = Math.random() * 6;
  }

  update(dt) {
    this.t += dt;
  }

  get drawY() {
    return this.y + Math.sin(this.t * 4) * 1.5;
  }
}
