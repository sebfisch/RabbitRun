import { GROUND_Y } from './terrain.js';

export const GRAVITY = 950;       // px/s²
export const JUMP_VY = -340;      // px/s, voller Sprung (Taste gehalten)
const JUMP_VY_TAP = -240;         // Sprung, wenn beim Absprung schon losgelassen
const JUMP_CUT_VY = -130;         // Aufstieg wird beim Loslassen hierauf gekappt
const AIR_JUMP_VY = -300;         // Doppelsprung ("Ohrenflattern")
const MAX_FALL = 460;
const DIVE_FALL = 560;

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
    this.airJumps = 1;     // verfügbare Doppelsprünge (wird bei Landung aufgefüllt)
    this.airJumpTime = 99; // Zeit seit dem letzten Doppelsprung
    this.flutterTime = 99; // steuert die Flatter-Animation nach dem Doppelsprung
    this.diving = false;   // Sturzflug aktiv
    this.landTimer = 0;    // steuert das Stauchen bei der Landung
    // Für die Stomp-Erkennung: Fußposition zu Frame-Beginn und
    // Fallgeschwindigkeit vor der Lande-Korrektur. Ein Sturzflug legt bis zu
    // 9 px pro Frame zurück – der Vergleich "nachher" allein würde Treffer
    // von oben fälschlich als seitliche Berührung werten.
    this.prevFeet = this.y + this.h;
    this.fallSpeed = 0;
    // Ereignis-Flags, die die Spiellogik ausliest (Sound/Partikel/Shake)
    this.justJumped = false;
    this.justAirJumped = false;
    this.slammed = false;
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

  // Sturzflug (Wisch nach unten): bricht den Sprung ab und saust nach unten.
  // Landet der Hase dabei auf einem Fuchs, wird der plattgemacht.
  dive() {
    if (this.onGround || this.diving) return false;
    // Ein unmittelbar zuvor verbrauchter Doppelsprung wird erstattet, damit
    // ein Wisch (der mit pointerdown beginnt) nicht versehentlich beides kostet.
    if (this.airJumps === 0 && this.airJumpTime < 0.18) {
      this.airJumps = 1;
      this.vy = 0;
    }
    this.jumpBuffer = 0;
    this.jumpHeld = false;
    this.diving = true;
    this.vy = Math.max(this.vy, 320);
    return true;
  }

  update(dt, terrain) {
    this.animTime += dt;
    this.airJumpTime += dt;
    this.flutterTime += dt;
    this.landTimer = Math.max(0, this.landTimer - dt);

    if (this.jumpBuffer > 0) {
      if (this.onGround || this.coyote > 0) {
        this.vy = this.jumpHeld ? JUMP_VY : JUMP_VY_TAP;
        this.onGround = false;
        this.coyote = 0;
        this.jumpBuffer = 0;
        this.diving = false;
        this.justJumped = true;
      } else if (this.airJumps > 0) {
        this.airJumps--;
        this.airJumpTime = 0;
        this.flutterTime = 0;
        this.vy = AIR_JUMP_VY;
        this.jumpBuffer = 0;
        this.diving = false;
        this.justAirJumped = true;
      }
    }
    this.jumpBuffer = Math.max(0, this.jumpBuffer - dt);

    const feetBefore = this.y + this.h;
    this.prevFeet = feetBefore;
    const g = this.diving ? GRAVITY * 2.2 : GRAVITY;
    this.vy = Math.min(this.diving ? DIVE_FALL : MAX_FALL, this.vy + g * dt);
    this.y += this.vy * dt;
    this.fallSpeed = this.vy; // vor der Lande-Korrektur gemerkt (Landen setzt vy auf 0)

    // Landen nur von oben, auf der höchsten Oberfläche (Boden oder Plattform).
    // Wer beim Überqueren einer Schlucht unter die Bodenkante sinkt, kann
    // nicht auf der anderen Seite "auftauchen" – schmale Schluchten bleiben
    // damit tödlich, und Plattformen sind von unten durchlässig.
    let landed = null;
    if (this.vy >= 0) {
      const cx = this.x + this.w / 2;
      for (const top of terrain.surfacesAt(cx)) {
        if (this.y + this.h >= top && feetBefore <= top + 0.5) {
          if (landed === null || top < landed) landed = top;
        }
      }
    }
    if (landed !== null) {
      this.y = landed - this.h;
      this.vy = 0;
      if (!this.onGround) {
        this.landTimer = 0.12;
        if (this.diving) this.slammed = true;
      }
      this.onGround = true;
      this.coyote = 0.08;
      this.airJumps = 1;
      this.diving = false;
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
    this.squashed = false; // vom Hasen plattgesprungen
    this.squashTime = 0;
  }

  update(dt) {
    if (this.squashed) {
      this.squashTime += dt;
      return;
    }
    this.x += this.vx * dt;
    this.animTime += dt;
  }
}

// Falke: fliegt hoch heran und stürzt sich kurz vor dem Hasen auf Bodenhöhe –
// dann heißt es drüberspringen. Im Sturzflug kann der Hase ihn selbst erwischen.
export class Hawk {
  constructor(x, vx) {
    this.w = 14;
    this.h = 8;
    this.x = x;
    this.y0 = 34 + Math.random() * 16;
    this.y = this.y0;
    this.vx = vx;
    this.t = Math.random() * 6;
    this.state = 'fly'; // 'fly' | 'swoop'
    this.dead = false;
  }

  update(dt, rabbit) {
    this.t += dt;
    this.x += this.vx * dt;
    if (this.state === 'fly') {
      this.y = this.y0 + Math.sin(this.t * 4) * 4;
      if (this.x - rabbit.x < 160 && this.x + this.w > rabbit.x - 8) {
        this.state = 'swoop';
      }
    } else {
      const target = GROUND_Y - 22;
      this.y = Math.min(target, this.y + 175 * dt);
    }
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

// Goldmöhre: seltene Power-Möhre – kurz unbesiegbar plus Möhren-Magnet.
export class GoldCarrot extends Carrot {}
