// Tag-Nacht-Zyklus: Der Hase läuft durch Tag, Abendrot, Sternennacht und
// Morgengrauen. Alle Farben werden über die zurückgelegte Strecke zwischen
// Stützstellen linear interpoliert.

export const CYCLE = 6500; // Weltpixel pro vollem Tag

// n = "Nächtlichkeit" (0 Tag … 1 tiefe Nacht), light = Multiplikationsfarbe,
// mit der die Szene abgedunkelt wird; far/near = Hügelfarben im Hintergrund.
const DAY = {
  n: 0,
  top: [127, 201, 239], bot: [184, 228, 247],
  far: [124, 180, 140], near: [88, 150, 105],
  light: [255, 255, 255],
};
const SUNSET = {
  n: 0.3,
  top: [94, 74, 138], bot: [255, 158, 94],
  far: [122, 92, 142], near: [82, 62, 112],
  light: [255, 214, 185],
};
const NIGHT = {
  n: 1,
  top: [13, 16, 48], bot: [35, 42, 92],
  far: [30, 36, 70], near: [20, 25, 55],
  light: [148, 155, 215],
};
const DAWN = {
  n: 0.35,
  top: [122, 134, 196], bot: [255, 210, 160],
  far: [112, 112, 162], near: [82, 86, 132],
  light: [235, 222, 235],
};

const STOPS = [
  { p: 0.0, c: DAY },
  { p: 0.34, c: DAY },
  { p: 0.46, c: SUNSET },
  { p: 0.56, c: NIGHT },
  { p: 0.8, c: NIGHT },
  { p: 0.9, c: DAWN },
  { p: 1.0, c: DAY },
];

export function phaseOf(cameraX) {
  return (cameraX / CYCLE + 0.05) % 1;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function lerpRgb(a, b, t) {
  return [0, 1, 2].map((i) => Math.round(lerp(a[i], b[i], t)));
}

export function colorsAt(phase) {
  let a = STOPS[0];
  let b = STOPS[STOPS.length - 1];
  for (let i = 0; i < STOPS.length - 1; i++) {
    if (phase >= STOPS[i].p && phase <= STOPS[i + 1].p) {
      a = STOPS[i];
      b = STOPS[i + 1];
      break;
    }
  }
  const t = b.p === a.p ? 0 : (phase - a.p) / (b.p - a.p);
  return {
    n: lerp(a.c.n, b.c.n, t),
    top: lerpRgb(a.c.top, b.c.top, t),
    bot: lerpRgb(a.c.bot, b.c.bot, t),
    far: lerpRgb(a.c.far, b.c.far, t),
    near: lerpRgb(a.c.near, b.c.near, t),
    light: lerpRgb(a.c.light, b.c.light, t),
  };
}

export function nightness(phase) {
  return colorsAt(phase).n;
}

export function rgb(c) {
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}
