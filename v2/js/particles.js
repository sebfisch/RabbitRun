// Einfaches Partikelsystem in Weltkoordinaten. Partikel mit glow=true werden
// nach der Nachtabdunklung gezeichnet und leuchten dadurch im Dunkeln.

export class Particles {
  constructor() {
    this.items = [];
  }

  add(p) {
    this.items.push(Object.assign(
      { vx: 0, vy: 0, g: 0, age: 0, life: 0.5, size: 1, color: '#ffffff', flicker: false, glow: false },
      p
    ));
  }

  // Staubwölkchen beim Absprung / bei der Landung
  dust(x, y, n = 5) {
    for (let i = 0; i < n; i++) {
      this.add({
        x: x + (Math.random() - 0.5) * 10,
        y: y - Math.random() * 3,
        vx: (Math.random() - 0.5) * 50,
        vy: -15 - Math.random() * 35,
        g: 260,
        life: 0.3 + Math.random() * 0.15,
        color: '#cbb591',
      });
    }
  }

  // Wölkchen, wenn ein Gegner plattgemacht wird oder der Hase doppelt springt
  poof(x, y, n = 8) {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      this.add({
        x, y,
        vx: Math.cos(a) * 45,
        vy: Math.sin(a) * 45 - 20,
        g: 120,
        life: 0.35,
        size: 2,
        color: '#e8e8e8',
      });
    }
  }

  sparkle(x, y, color = '#fff6e0', n = 6) {
    for (let i = 0; i < n; i++) {
      this.add({
        x, y,
        vx: (Math.random() - 0.5) * 90,
        vy: (Math.random() - 0.8) * 90,
        g: 150,
        life: 0.35 + Math.random() * 0.2,
        color,
        glow: true,
      });
    }
  }

  // Glühwürmchen für die Nacht
  firefly(x, y) {
    this.add({
      x, y,
      vx: (Math.random() - 0.5) * 12,
      vy: (Math.random() - 0.5) * 9,
      life: 2 + Math.random() * 1.5,
      color: '#d8f26a',
      flicker: true,
      glow: true,
    });
  }

  update(dt) {
    for (const p of this.items) {
      p.age += dt;
      p.vy += p.g * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    this.items = this.items.filter((p) => p.age < p.life);
  }
}
