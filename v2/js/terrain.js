// Segmentbasierter Boden wie in Version 1, ergänzt um schwebende Plattformen.
// Alle Breiten sind Vielfache von TILE, damit die Kacheln sauber scrollen.

export const TILE = 16;
export const GROUND_Y = 150;

export class Terrain {
  constructor() {
    this.segments = [];
    this.platforms = [];
    this.endX = 0;
  }

  appendSolid(width) {
    this.segments.push({ x: this.endX, width, isGap: false });
    this.endX += width;
  }

  appendGap(width) {
    this.segments.push({ x: this.endX, width, isGap: true });
    this.endX += width;
  }

  addPlatform(x, width, y) {
    this.platforms.push({ x, width, y });
  }

  // Bodenhöhe an Welt-x, oder null über einer Schlucht / außerhalb.
  groundAt(x) {
    for (const seg of this.segments) {
      if (x >= seg.x && x < seg.x + seg.width) {
        return seg.isGap ? null : GROUND_Y;
      }
    }
    return null;
  }

  // Alle Oberkanten (Boden und Plattformen), auf denen man bei Welt-x
  // landen kann. Plattformen sind von unten durchlässig – das regelt die
  // Lande-Logik des Hasen, die nur Landungen von oben zulässt.
  surfacesAt(x) {
    const tops = [];
    const ground = this.groundAt(x);
    if (ground !== null) tops.push(ground);
    for (const p of this.platforms) {
      if (x >= p.x && x < p.x + p.width) tops.push(p.y);
    }
    return tops;
  }

  prune(minX) {
    while (this.segments.length && this.segments[0].x + this.segments[0].width < minX) {
      this.segments.shift();
    }
    this.platforms = this.platforms.filter((p) => p.x + p.width >= minX);
  }
}
