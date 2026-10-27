import { PALETTE } from './palette';
import {
  SPRITE_WIDTH,
  CENTER,
  PIP_TOPS,
  PLANT_TOPS,
  SEEDLING_TOPS,
  FACE_POTS,
  PLAIN_POT,
  pipSprite,
  plantSprite,
  seedlingSprite,
  applyCondition,
} from './sprites';

const everyRow = () => [
  ...Object.values(PIP_TOPS).flat(),
  ...Object.values(PLANT_TOPS).flat(),
  ...Object.values(SEEDLING_TOPS).flat(),
  ...Object.values(FACE_POTS).flat(),
  ...PLAIN_POT,
];

const lowestRow = (rows, column) => {
  let lowest = -1;
  rows.forEach((row, y) => {
    if (row[column] !== '.') lowest = y;
  });
  return lowest;
};

test('every row is 15 characters wide, so each sprite has a center column', () => {
  expect(SPRITE_WIDTH).toBe(15);
  expect(CENTER).toBe(7);
  everyRow().forEach((row) => expect(row).toHaveLength(SPRITE_WIDTH));
});

test('every letter in every sprite is in the palette or transparent', () => {
  everyRow().forEach((row) =>
    row.split('').forEach((letter) => expect(letter === '.' || PALETTE[letter] !== undefined).toBe(true))
  );
});

test('Pip has four forms that grow taller', () => {
  const heights = ['seed', 'sprout', 'leafy', 'bloom'].map((form) => PIP_TOPS[form].length);
  expect(heights).toEqual([...heights].sort((a, b) => a - b));
  expect(new Set(heights).size).toBe(4);
});

test('only the bloom form has a flower', () => {
  const flower = (form) => PIP_TOPS[form].join('').match(/[ro]/g);
  expect(flower('bloom')).not.toBeNull();
  ['seed', 'sprout', 'leafy'].forEach((form) => expect(flower(form)).toBeNull());
});

test('Pip has four moods and each one changes his face', () => {
  const moods = ['calm', 'curious', 'sleepy', 'pleased'];
  const faces = moods.map((mood) => pipSprite('seed', mood).join('|'));
  expect(new Set(faces).size).toBe(4);
});

test('Pip always has a face, and real plants and the readiness plant never do', () => {
  ['seed', 'sprout', 'leafy', 'bloom'].forEach((form) => expect(pipSprite(form).join('')).toContain('k'));
  ['pothos', 'monstera', 'succulent', 'snake', 'generic'].forEach((group) =>
    ['fine', 'due-soon', 'needs-attention'].forEach((condition) =>
      expect(plantSprite(group, condition).join('')).not.toContain('k')
    )
  );
  ['seed', 'sprouting'].forEach((stage) => expect(seedlingSprite(stage).join('')).not.toContain('k'));
});

test('there is one template for each of five species groups', () => {
  expect(Object.keys(PLANT_TOPS).sort()).toEqual(['generic', 'monstera', 'pothos', 'snake', 'succulent']);
});

test('unknown forms, moods, groups, and stages fall back instead of failing', () => {
  expect(pipSprite('nope', 'nope')).toEqual(pipSprite('seed', 'calm'));
  expect(plantSprite('nope')).toEqual(plantSprite('generic', 'fine'));
  expect(seedlingSprite('nope')).toEqual(seedlingSprite('seed'));
});

test('a plant sits above a plain pot and keeps its width', () => {
  const rows = plantSprite('pothos', 'fine');
  expect(rows.slice(-PLAIN_POT.length)).toEqual(PLAIN_POT);
  expect(rows).toHaveLength(PLANT_TOPS.pothos.length + PLAIN_POT.length);
});

describe('applyCondition', () => {
  test('fine leaves the sprite as it is, as a copy', () => {
    const copy = applyCondition(PLANT_TOPS.pothos, 'fine');
    expect(copy).toEqual(PLANT_TOPS.pothos);
    expect(copy).not.toBe(PLANT_TOPS.pothos);
  });

  test('due soon adds a small water drop in the top right', () => {
    const rows = applyCondition(PLANT_TOPS.snake, 'due-soon');
    expect(rows[0][12]).toBe('b');
    expect(rows[1][12]).toBe('b');
    expect(rows.slice(2)).toEqual(PLANT_TOPS.snake.slice(2));
  });

  test('due soon leaves the sprite alone when the corner is taken', () => {
    const rows = ['............x..', '............x..', '...............'];
    expect(applyCondition(rows, 'due-soon')).toEqual(rows);
  });

  test('needs attention mutes every green', () => {
    ['pothos', 'monstera', 'succulent', 'snake', 'generic'].forEach((group) => {
      const joined = applyCondition(PLANT_TOPS[group], 'needs-attention').join('');
      expect(joined).not.toMatch(/[gGd]/);
      expect(joined).toMatch(/[mn]/);
    });
  });

  test('needs attention sags the side leaves and leaves the stem where it is', () => {
    const before = PLANT_TOPS.pothos;
    const after = applyCondition(before, 'needs-attention');
    expect(after).toHaveLength(before.length);
    let lowered = 0;
    for (let column = 0; column < SPRITE_WIDTH; column += 1) {
      const was = lowestRow(before, column);
      const now = lowestRow(after, column);
      if (column === CENTER) expect(now).toBe(was);
      else {
        expect(now).toBeGreaterThanOrEqual(was);
        if (now > was) lowered += 1;
      }
    }
    expect(lowered).toBeGreaterThan(0);
  });

  test('every condition keeps the sprite the same size', () => {
    ['fine', 'due-soon', 'needs-attention'].forEach((condition) => {
      const rows = applyCondition(PLANT_TOPS.monstera, condition);
      expect(rows).toHaveLength(PLANT_TOPS.monstera.length);
      rows.forEach((row) => expect(row).toHaveLength(SPRITE_WIDTH));
    });
  });
});
