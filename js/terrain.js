// Segmentbasierter Boden: abwechselnd feste Abschnitte und Schluchten.
// Alle Breiten sind Vielfache von TILE, damit die Kacheln sauber scrollen.

export const TILE = 16;
export const GROUND_Y = 150;

export class Terrain {
  constructor() {
    this.segments = [];
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

  // Bodenhöhe an Welt-x, oder null über einer Schlucht / außerhalb.
  groundAt(x) {
    for (const seg of this.segments) {
      if (x >= seg.x && x < seg.x + seg.width) {
        return seg.isGap ? null : GROUND_Y;
      }
    }
    return null;
  }

  prune(minX) {
    while (this.segments.length && this.segments[0].x + this.segments[0].width < minX) {
      this.segments.shift();
    }
  }
}
