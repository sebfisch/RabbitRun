// Alle Grafiken werden als Pixel-Grids definiert (1 Zeichen = 1 Pixel)
// und einmalig auf Offscreen-Canvases "gebacken".

const PALETTE = {
  '.': null,       // transparent
  'W': '#f4f4f4',  // Hase weiß
  'G': '#c9c9c9',  // Hase Schatten / Schwanz
  'P': '#f2a0b5',  // rosa (Ohren, Nase)
  'O': '#e8762c',  // Fuchs/Möhre orange
  'D': '#a3501d',  // Fuchs dunkel (Beine, Ohren)
  'C': '#fff6e0',  // creme (Fuchsbrust, Wolken)
  'K': '#222034',  // Umriss / Augen
  'L': '#5ac54f',  // Gras hell / Möhrengrün
  'g': '#33984b',  // Gras dunkel
  'B': '#9b6a3c',  // Erde hell
  'b': '#6e4520',  // Erde dunkel
  'Y': '#ffd75e',  // Sonne
};

function bake(rows) {
  const h = rows.length;
  const w = rows[0].length;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  for (let y = 0; y < h; y++) {
    if (rows[y].length !== w) {
      throw new Error(`Sprite-Zeile ${y} hat Länge ${rows[y].length}, erwartet ${w}`);
    }
    for (let x = 0; x < w; x++) {
      const color = PALETTE[rows[y][x]];
      if (color === undefined) {
        throw new Error(`Unbekanntes Palettenzeichen '${rows[y][x]}'`);
      }
      if (color) {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }
  return canvas;
}

// --- Hase (16x16, blickt nach rechts) ---

const RABBIT_TOP = [
  '....WW..WW......',
  '.....WP..WP.....',
  '......WP..WP....',
  '.......WW.WW....',
  '........WWWWWW..',
  '.......WWWWKWW..',
  '.....WWWWWWWWWP.',
  '..WWWWWWWWWWWW..',
  '.GWWWWWWWWWWWW..',
  'GGWWWWWWWWWWW...',
  '.GWWWWWWWWWWW...',
  '..WWWWWWWWWW....',
];

const RABBIT_RUN_0 = [
  ...RABBIT_TOP,
  '..WWW....WWW....',
  '.WWW.......WWW..',
  '.WW.........WW..',
  '................',
];

const RABBIT_RUN_1 = [
  ...RABBIT_TOP,
  '...WWWWWWWW.....',
  '....WWW.WWW.....',
  '....WW...WW.....',
  '................',
];

const RABBIT_JUMP = [
  ...RABBIT_TOP,
  '..WWWW...WWWW...',
  '...WW.....WW....',
  '................',
  '................',
];

// --- Fuchs (20x14, blickt nach links) ---

const FOX_TOP = [
  '...D..D.............',
  '..DO..OD............',
  '.OOOOOOO............',
  '.OKOOOOO............',
  'KOOOOOOOOO....OOO...',
  '.CCOOOOOOOOOOOOOOOC.',
  '.CCCOOOOOOOOOOOOOCCC',
  '..CCOOOOOOOOOOOOOCC.',
  '....OOOOOOOOOOOO....',
  '.....OOOOOOOOOO.....',
];

const FOX_RUN_0 = [
  ...FOX_TOP,
  '....DD......DD......',
  '...DD........DD.....',
  '...DD.........DD....',
  '....................',
];

const FOX_RUN_1 = [
  ...FOX_TOP,
  '.....DD....DD.......',
  '......DD..DD........',
  '......DD..DD........',
  '....................',
];

// --- Möhre (8x10) ---

const CARROT = [
  '..L..L..',
  '..LLLL..',
  '...LL...',
  '..OOOO..',
  '.OOOOOO.',
  '.OOODOO.',
  '..OOOO..',
  '..OOO...',
  '...OO...',
  '...O....',
];

// --- Boden-Kacheln (16x16) ---

const DIRT_ROWS = [
  'BBBBbBBBBBBBbBBB',
  'BBbBBBBBBbBBBBBB',
  'BBBBBBBbBBBBBbBB',
  'BbBBBBBBBBBBbBBB',
];

const GRASS_TILE = [
  'LLLgLLLLgLLLLgLL',
  'LgLLLLgLLLgLLLLg',
  'gggggggggggggggg',
  ...Array.from({ length: 13 }, (_, i) => DIRT_ROWS[i % 4]),
];

const DIRT_TILE = Array.from({ length: 16 }, (_, i) => DIRT_ROWS[i % 4]);

// --- Wolken ---

const CLOUD_0 = [
  '........CCCCC...........',
  '......CCCCCCCCC.........',
  '....CCCCCCCCCCCCC.......',
  '..CCCCCCCCCCCCCCCCC.....',
  '.CCCCCCCCCCCCCCCCCCCC...',
  'CCCCCCCCCCCCCCCCCCCCCCC.',
  'CCCCCCCCCCCCCCCCCCCCCCCC',
  '.CCCCCCCCCCCCCCCCCCCCCC.',
  '...CCCCCCCCCCCCCCCC.....',
  '........................',
];

const CLOUD_1 = [
  '....CCCC........',
  '..CCCCCCCC......',
  '.CCCCCCCCCCC....',
  'CCCCCCCCCCCCCC..',
  'CCCCCCCCCCCCCCC.',
  '.CCCCCCCCCCCCC..',
  '................',
  '................',
];

// --- Sonne (12x12) ---

const SUN = [
  '....YYYY....',
  '..YYYYYYYY..',
  '.YYYYYYYYYY.',
  '.YYYYYYYYYY.',
  'YYYYYYYYYYYY',
  'YYYYYYYYYYYY',
  'YYYYYYYYYYYY',
  'YYYYYYYYYYYY',
  '.YYYYYYYYYY.',
  '.YYYYYYYYYY.',
  '..YYYYYYYY..',
  '....YYYY....',
];

export const SPRITES = {
  rabbitRun: [bake(RABBIT_RUN_0), bake(RABBIT_RUN_1)],
  rabbitJump: bake(RABBIT_JUMP),
  fox: [bake(FOX_RUN_0), bake(FOX_RUN_1)],
  carrot: bake(CARROT),
  grass: bake(GRASS_TILE),
  dirt: bake(DIRT_TILE),
  clouds: [bake(CLOUD_0), bake(CLOUD_1)],
  sun: bake(SUN),
};
