// Alle Grafiken werden als Pixel-Grids definiert (1 Zeichen = 1 Pixel)
// und einmalig auf Offscreen-Canvases "gebacken".

const PALETTE = {
  '.': null,       // transparent
  'W': '#f4f4f4',  // Hase weiß
  'G': '#c9c9c9',  // Hase Schatten / Schwanz / Mondkrater
  'P': '#f2a0b5',  // rosa (Ohren, Nase)
  'O': '#e8762c',  // Fuchs/Möhre orange
  'D': '#a3501d',  // Fuchs dunkel (Beine, Ohren)
  'C': '#fff6e0',  // creme (Fuchsbrust, Wolken, Mond)
  'K': '#222034',  // Umriss / Augen
  'L': '#5ac54f',  // Gras hell / Möhrengrün
  'g': '#33984b',  // Gras dunkel / Baumkronen
  'B': '#9b6a3c',  // Erde hell
  'b': '#6e4520',  // Erde dunkel / Baumstamm
  'Y': '#ffd75e',  // Sonne / Gold
  'H': '#8a5a2b',  // Falke braun
  'h': '#5c3a17',  // Falke dunkel
};

function bake(rows) {
  const h = rows.length;
  const w = Math.max(...rows.map((r) => r.length));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < rows[y].length; x++) {
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

// Doppelsprung: Beine eng angezogen ("Ohrenflattern")
const RABBIT_FLUTTER = [
  ...RABBIT_TOP,
  '...WWWWWWWW.....',
  '.....WWWW.......',
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

// --- Falke (18x12, blickt nach links) ---

const HAWK_FLY_0 = [
  '.........hh.......',
  '........hHHh......',
  '.......hHHHHh.....',
  '.......hHHHHHh....',
  '..hh...hHHHHHHh...',
  '.hYKh.hHHHHHHHHhh.',
  '..hHHHHHHHHHHHHHHh',
  '...CCCHHHHHHHHhh..',
  '....CCCCHHHHh.....',
  '......CCHHh.......',
  '..................',
  '..................',
];

const HAWK_FLY_1 = [
  '..................',
  '..................',
  '..hh..............',
  '.hYKh.hHHHHhh.....',
  '..hHHHHHHHHHHhhh..',
  '...CCHHHHHHHHHHHh.',
  '...CCCHHHHHHHHHHh.',
  '....CCCHHHHHh.....',
  '......hHHHHh......',
  '.......hHHh.......',
  '........hh........',
  '..................',
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

// --- Goldmöhre (8x10) ---

const GOLD_CARROT = [
  '..L..L..',
  '..LLLL..',
  '...LL...',
  '..YYYY..',
  '.YYYYYY.',
  '.YYOYYY.',
  '..YYYY..',
  '..YYY...',
  '...YY...',
  '...Y....',
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

// --- Schwebende Plattform (16x8) ---

const PLATFORM_TILE = [
  'LLLgLLLLgLLLLgLL',
  'LgLLLLgLLLgLLLLg',
  'gggggggggggggggg',
  'BBBBbBBBBBBBbBBB',
  'BBbBBBBBBbBBBBBB',
  '.bBBBBBbBBBBBb..',
  '..bBBb....bBb...',
  '...b........b...',
];

// --- Bäume und Büsche für den Parallax-Hintergrund ---

const TREE = [
  '.....gggggg.....',
  '...gggLLggggg...',
  '..ggLLLLgggggg..',
  '.gggLLggggggggg.',
  '.ggggggggLLggg..',
  '..gggggggggggg..',
  '...gggggggggg...',
  '.....gggggg.....',
  '.......bb.......',
  '.......bb.......',
  '.......bB.......',
  '......bBB.......',
];

const BUSH = [
  '....gggg....',
  '..ggLLggg...',
  '.ggLggggggg.',
  'gggggggggggg',
  '.gggggggggg.',
];

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

// --- Mond (12x12, Sichel mit Kratern) ---

const MOON = [
  '....CCCC....',
  '..CCCCCC....',
  '.CCCCC......',
  '.CCCC.......',
  'CCGCC.......',
  'CCCC........',
  'CCCCC.......',
  'CCGCC.......',
  '.CCCC.......',
  '.CCCCC......',
  '..CCCCCC....',
  '....CCCC....',
];

export const SPRITES = {
  rabbitRun: [bake(RABBIT_RUN_0), bake(RABBIT_RUN_1)],
  rabbitJump: bake(RABBIT_JUMP),
  rabbitFlutter: bake(RABBIT_FLUTTER),
  fox: [bake(FOX_RUN_0), bake(FOX_RUN_1)],
  hawk: [bake(HAWK_FLY_0), bake(HAWK_FLY_1)],
  carrot: bake(CARROT),
  goldCarrot: bake(GOLD_CARROT),
  grass: bake(GRASS_TILE),
  dirt: bake(DIRT_TILE),
  platform: bake(PLATFORM_TILE),
  tree: bake(TREE),
  bush: bake(BUSH),
  clouds: [bake(CLOUD_0), bake(CLOUD_1)],
  sun: bake(SUN),
  moon: bake(MOON),
};
