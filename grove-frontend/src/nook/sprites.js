// Pixel sprites for Pip's nook. Every row is 15 characters wide, so each sprite
// has a centre column (index 7) and draws symmetrically. Letters map to colours
// in palette.js and '.' is transparent. Sprites are anchored by their bottom row.
export const SPRITE_WIDTH = 15;
export const CENTER = 7;

// Pip's four forms, drawn above his pot. They grow with the nook level.
export const PIP_TOPS = {
  'seed': [
    '......eee......',
  ],
  'sprout': [
    '.....g...g.....',
    '.....gg.gg.....',
    '......GdG......',
    '.......d.......',
    '.......d.......',
  ],
  'leafy': [
    '......ggg......',
    '......gGg......',
    '...............',
    '...g...d...g...',
    '...gggGdGggg...',
    '...gGgGdGgGg...',
    '.......d.......',
    '.......d.......',
    '.......d.......',
  ],
  'bloom': [
    '.......r.......',
    '......ror......',
    '.....rooor.....',
    '......ror......',
    '.......r.......',
    '.......d.......',
    '.......d.......',
    '.......d.......',
    '....g..d..g....',
    '....ggGdGgg....',
    '....GgGdGgG....',
    '.......d.......',
    '.......d.......',
    '.......d.......',
  ],
};

// Pip's pot with each mood's face.
export const FACE_POTS = {
  'calm': [
    '....sssssss....',
    '..uuuuuuuuuuu..',
    '..uuuuuuuuuuu..',
    '...ttttttttt...',
    '...ttktttktt...',
    '...tptttttpt...',
    '...tttktkttt...',
    '...ttttktttt...',
    '....TTTTTTT....',
  ],
  'curious': [
    '....sssssss....',
    '..uuuuuuuuuuu..',
    '..uuuuuuuuuuu..',
    '...ttttttttt...',
    '...ttktttktt...',
    '...tptttttpt...',
    '...ttttktttt...',
    '...ttttktttt...',
    '....TTTTTTT....',
  ],
  'sleepy': [
    '....sssssss....',
    '..uuuuuuuuuuu..',
    '..uuuuuuuuuuu..',
    '...ttttttttt...',
    '...tkktttkkt...',
    '...tptttttpt...',
    '...ttttttttt...',
    '...tttkkkttt...',
    '....TTTTTTT....',
  ],
  'pleased': [
    '....sssssss....',
    '..uuuuuuuuuuu..',
    '..uuuuuuuuuuu..',
    '...ttttttttt...',
    '...ttktttktt...',
    '...tptttttpt...',
    '...ttktttktt...',
    '...tttkkkttt...',
    '....TTTTTTT....',
  ],
};

// A plain pot for real plants and the readiness plant. Real plants never get faces.
export const PLAIN_POT = [
    '....sssssss....',
    '..uuuuuuuuuuu..',
    '..uuuuuuuuuuu..',
    '...ttttttttt...',
    '...ttttttttt...',
    '...ttttttttt...',
    '...ttttttttt...',
    '...ttttttttt...',
    '....TTTTTTT....',
  ];

// One template per species group, drawn above a plain pot.
export const PLANT_TOPS = {
  'pothos': [
    '...............',
    '......ggg......',
    '......GGG......',
    '.......G.......',
    '.......d.ggg...',
    '...ggg.d.GGG...',
    '...GGG.d..G....',
    '....Gd.d..ggg..',
    '..gggd.d..GGG..',
    '..GGGd.d...G...',
    '...G...d.......',
    '.......d.......',
  ],
  'monstera': [
    '....ggg........',
    '...GGGG........',
    '..GG.GG.ggg....',
    '...GGdG.GGGG...',
    '.....GG.GG.GG..',
    '.......dGdGG...',
    '....gggdGG.....',
    '...GGGGd.......',
    '..GG.GGd.......',
    '...GGdGd.......',
    '.....GGd.......',
    '.......d.......',
  ],
  'succulent': [
    '...............',
    '...............',
    '...............',
    '...............',
    '...............',
    '...............',
    '.......g.......',
    '.......g.......',
    '..g..ggggg..g..',
    '...GG.GdG.GG...',
    '....gggGggg....',
    '...GGGGGGGGG...',
  ],
  'snake': [
    '...............',
    '......ggG......',
    '......gGG......',
    '......gdG......',
    '...gg.gdG.gg...',
    '...gG.gdG.gG...',
    '...gG.gdG.gG...',
    '...gG.gdG.gG...',
    '...gG.gdG.gG...',
    '...gG.gdG.gG...',
    '...gG.gdG.gG...',
    '...gG.gdG.gG...',
  ],
  'generic': [
    '...............',
    '......GgG......',
    '.....GgGgG.....',
    '....GgGgGgG....',
    '...gGggGggGg...',
    '..gGgGgggGgGg..',
    '..GgGgGGGgGgG..',
    '..gGgGgggGgGg..',
    '...gGg.d.gGg...',
    '.......d.......',
    '.......d.......',
    '.......d.......',
  ],
};

// The readiness plant before it is ready.
export const SEEDLING_TOPS = {
  'seed': [
    '......eee......',
  ],
  'sprouting': [
    '......g.g......',
    '......GdG......',
    '.......d.......',
  ],
};

const LEAF_LETTERS = 'gGd';
const MUTED = { g: 'm', G: 'n', d: 'n' };

// Side leaves sag one pixel; the centre column (the stem) stays put.
function droop(rows) {
  const grid = rows.map((row) => row.split(''));
  for (let y = grid.length - 2; y >= 0; y -= 1) {
    for (let x = 0; x < SPRITE_WIDTH; x += 1) {
      if (x !== CENTER && LEAF_LETTERS.includes(grid[y][x]) && grid[y + 1][x] === '.') {
        grid[y + 1][x] = grid[y][x];
        grid[y][x] = '.';
      }
    }
  }
  return grid.map((row) => row.join(''));
}

// A plant's condition changes its shape and colour, and the page always adds a text label.
export function applyCondition(rows, condition) {
  if (condition === 'due-soon') {
    const grid = rows.map((row) => row.split(''));
    if (grid.length > 1 && grid[0][12] === '.' && grid[1][12] === '.') {
      grid[0][12] = 'b';
      grid[1][12] = 'b';
    }
    return grid.map((row) => row.join(''));
  }
  if (condition === 'needs-attention') {
    return droop(rows).map((row) => row.replace(/[gGd]/g, (c) => MUTED[c]));
  }
  return rows.slice();
}

export function pipSprite(form, mood = 'calm') {
  const top = PIP_TOPS[form] || PIP_TOPS.seed;
  const pot = FACE_POTS[mood] || FACE_POTS.calm;
  return [...top, ...pot];
}

export function plantSprite(group, condition = 'fine') {
  const top = PLANT_TOPS[group] || PLANT_TOPS.generic;
  return [...applyCondition(top, condition), ...PLAIN_POT];
}

export function seedlingSprite(stage) {
  const top = SEEDLING_TOPS[stage] || SEEDLING_TOPS.seed;
  return [...top, ...PLAIN_POT];
}
