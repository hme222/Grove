import { PALETTE, ROOM } from './palette';
import { drawRoom, drawSprite, ROOM_W, ROOM_H, PIP_SPOTS, HERO_SPOT } from './drawRoom';

const recorder = () => {
  const calls = [];
  const ctx = {
    fillStyle: '',
    fillRect(x, y, w, h) {
      calls.push({ x, y, w, h, color: this.fillStyle });
    },
  };
  return { ctx, calls };
};

const BASE = ['window', 'table', 'sill', 'floor'];
const LEVELS = {
  1: BASE,
  2: [...BASE, 'shelf'],
  3: [...BASE, 'shelf', 'rug', 'lamp'],
  4: [...BASE, 'shelf', 'rug', 'lamp', 'hanging', 'wall-art'],
};

const view = (over = {}) => ({
  unlocked: LEVELS[1],
  pip: { form: 'seed', location: 'sill', mood: 'calm' },
  hero: null,
  readiness: null,
  shelfPlants: [],
  ...over,
});

const draw = (v, tick = 0) => {
  const { ctx, calls } = recorder();
  drawRoom(ctx, v, tick);
  return calls;
};
const ghosts = (calls) => calls.filter((c) => c.color === ROOM.ghost);
const withColor = (calls, color) => calls.filter((c) => c.color === color);
const inkX = (calls) => withColor(calls, PALETTE.k).map((c) => c.x);

test('the room is 128 by 80', () => {
  expect([ROOM_W, ROOM_H]).toEqual([128, 80]);
});

test('nothing is ever drawn outside the room, at any level', () => {
  [1, 2, 3, 4].forEach((level) => {
    const calls = draw(
      view({
        unlocked: LEVELS[level],
        pip: { form: 'bloom', location: level >= 2 ? 'shelf' : 'sill', mood: 'pleased' },
        hero: { group: 'monstera', condition: 'needs-attention' },
        shelfPlants: [{ condition: 'fine' }, { condition: 'due-soon' }],
      }),
      1
    );
    calls.forEach((c) => {
      expect(c.x).toBeGreaterThanOrEqual(0);
      expect(c.y).toBeGreaterThanOrEqual(0);
      expect(c.x + c.w).toBeLessThanOrEqual(ROOM_W);
      expect(c.y + c.h).toBeLessThanOrEqual(ROOM_H);
    });
  });
});

test('locked slots show faint outlines and no real item', () => {
  const calls = draw(view());
  expect(ghosts(calls).length).toBeGreaterThan(0);
  expect(withColor(calls, ROOM.rug)).toHaveLength(0);
  expect(withColor(calls, ROOM.lampPole)).toHaveLength(0);
  expect(withColor(calls, ROOM.cord)).toHaveLength(0);
  expect(calls.filter((c) => c.color === ROOM.wood && c.x === 72 && c.y === 26)).toHaveLength(0);
});

test('every locked slot has its own outline in the right place, and loses it once unlocked', () => {
  const outlines = [
    ['shelf', 72, 14, 46],
    ['rug', 36, 66, 56],
    ['lamp', 2, 30, 9],
    ['hanging', 119, 0, 9],
    ['wall-art', 54, 8, 18],
  ];
  const locked = ghosts(draw(view()));
  const open = ghosts(draw(view({ unlocked: LEVELS[4], hero: { group: 'pothos', condition: 'fine' } })));
  outlines.forEach(([, x, y, w]) => {
    expect(locked.filter((c) => c.x === x && c.y === y && c.w === w && c.h === 1)).toHaveLength(1);
    expect(open.filter((c) => c.x === x && c.y === y && c.w === w && c.h === 1)).toHaveLength(0);
  });
});

test('each level draws what it unlocks', () => {
  expect(draw(view({ unlocked: LEVELS[2] })).filter((c) => c.color === ROOM.wood && c.x === 72 && c.y === 26)).toHaveLength(1);
  const three = draw(view({ unlocked: LEVELS[3] }));
  expect(withColor(three, ROOM.rug).length).toBeGreaterThan(0);
  expect(withColor(three, ROOM.lampPole).length).toBeGreaterThan(0);
  expect(withColor(three, ROOM.cord)).toHaveLength(0);
  const four = draw(view({ unlocked: LEVELS[4] }));
  expect(withColor(four, ROOM.cord).length).toBeGreaterThan(0);
  expect(four.filter((c) => c.color === ROOM.wood && c.x === 54 && c.y === 8)).toHaveLength(1);
});

test('once everything is unlocked and a plant is on the table, no outlines are left', () => {
  const calls = draw(view({ unlocked: LEVELS[4], hero: { group: 'pothos', condition: 'fine' } }));
  expect(ghosts(calls)).toHaveLength(0);
});

test('with no plant at all the table shows an outline for a pot', () => {
  const calls = draw(view());
  expect(ghosts(calls).filter((c) => c.x === HERO_SPOT.cx - 6 && c.w === 13)).not.toHaveLength(0);
});

test('Pip starts on the windowsill and moves to the shelf', () => {
  const sill = inkX(draw(view({ pip: { form: 'seed', location: 'sill', mood: 'calm' } })));
  expect(Math.min(...sill)).toBeGreaterThanOrEqual(PIP_SPOTS.sill.cx - 7);
  expect(Math.max(...sill)).toBeLessThanOrEqual(PIP_SPOTS.sill.cx + 7);
  const shelf = inkX(draw(view({ unlocked: LEVELS[2], pip: { form: 'sprout', location: 'shelf', mood: 'calm' } })));
  expect(Math.min(...shelf)).toBeGreaterThanOrEqual(PIP_SPOTS.shelf.cx - 7);
  expect(Math.max(...shelf)).toBeLessThanOrEqual(PIP_SPOTS.shelf.cx + 7);
});

test('an unknown spot for Pip falls back to the sill', () => {
  const calls = draw(view({ pip: { form: 'seed', location: 'attic', mood: 'calm' } }));
  expect(Math.max(...inkX(calls))).toBeLessThanOrEqual(PIP_SPOTS.sill.cx + 7);
});

test('Pip bobs up one pixel on odd ticks', () => {
  const top = (tick) => Math.min(...withColor(draw(view(), tick), PALETTE.k).map((c) => c.y));
  expect(top(1)).toBe(top(0) - 1);
  expect(top(2)).toBe(top(0));
});

test('a plant on the table has no face, because only Pip draws ink', () => {
  const calls = draw(view({ hero: { group: 'snake', condition: 'fine' } }));
  const xs = inkX(calls);
  expect(Math.max(...xs)).toBeLessThanOrEqual(PIP_SPOTS.sill.cx + 7);
});

test('the readiness plant is a seed, then a sprout, then its species template', () => {
  const seed = draw(view({ readiness: { state: 'seed', group: 'snake' } }));
  const ready = draw(view({ readiness: { state: 'ready', group: 'snake' } }));
  const seedSeed = seed.filter((c) => c.color === PALETTE.e && c.x >= HERO_SPOT.cx - 7 && c.x <= HERO_SPOT.cx + 7);
  expect(seedSeed.length).toBeGreaterThan(0);
  expect(ready.filter((c) => c.color === PALETTE.e && c.x >= HERO_SPOT.cx - 7)).toHaveLength(0);
  expect(withColor(ready, PALETTE.G).length).toBeGreaterThan(withColor(seed, PALETTE.G).length);
});

test('a real plant takes the table over the readiness plant', () => {
  const calls = draw(view({
    hero: { group: 'monstera', condition: 'fine' },
    readiness: { state: 'seed', group: 'snake' },
  }));
  expect(calls.filter((c) => c.color === PALETTE.e && c.x >= HERO_SPOT.cx - 7)).toHaveLength(0);
});

describe('plants on the shelf', () => {
  const minis = (calls) => calls.filter((c) => c.w === 5 && c.h === 3 && c.color === PALETTE.t);

  test('only show once the shelf is unlocked', () => {
    expect(minis(draw(view({ shelfPlants: [{ condition: 'fine' }] })))).toHaveLength(0);
    expect(minis(draw(view({ unlocked: LEVELS[2], shelfPlants: [{ condition: 'fine' }] })))).toHaveLength(1);
  });

  test('never show more than two', () => {
    const plants = [1, 2, 3, 4].map(() => ({ condition: 'fine' }));
    expect(minis(draw(view({ unlocked: LEVELS[2], shelfPlants: plants })))).toHaveLength(2);
  });

  test('use the muted green for a plant that needs attention', () => {
    const calls = draw(view({ unlocked: LEVELS[2], shelfPlants: [{ condition: 'needs-attention' }] }));
    expect(calls.filter((c) => c.w === 3 && c.h === 3 && c.color === PALETTE.n)).toHaveLength(1);
  });
});

test('drawSprite puts the bottom row on the base line and the centre column on the centre', () => {
  const { ctx, calls } = recorder();
  drawSprite(ctx, ['.......e.......', '.......g.......'], 20, 10);
  expect(calls).toEqual([
    { x: 20, y: 9, w: 1, h: 1, color: PALETTE.e },
    { x: 20, y: 10, w: 1, h: 1, color: PALETTE.g },
  ]);
});


describe('window light', () => {
  const lit = (over) => view({ window: { draw_direction: 'S', direction: 'S', season: 'summer', view: 'open', lamp: false, ...over } });
  const BEAMS = [ROOM.beam, ROOM.beamCool, ROOM.beamWarm, ROOM.beamHot, ROOM.beamSoft];
  const anyBeam = (calls) => calls.filter((c) => BEAMS.includes(c.color));

  test('a south window draws a warm beam in the floor rows', () => {
    const beam = withColor(draw(lit()), ROOM.beamWarm);
    expect(beam.length).toBeGreaterThan(0);
    beam.forEach((c) => expect(c.y).toBeGreaterThanOrEqual(56));
  });

  test('a west window draws a hot beam and an east window a cool one', () => {
    expect(withColor(draw(lit({ draw_direction: 'W' })), ROOM.beamHot).length).toBeGreaterThan(0);
    expect(withColor(draw(lit({ draw_direction: 'E' })), ROOM.beamCool).length).toBeGreaterThan(0);
  });

  test('a north window draws no beam at all', () => {
    expect(anyBeam(draw(lit({ draw_direction: 'N' })))).toHaveLength(0);
  });

  test('no window in the view draws the original beam', () => {
    expect(withColor(draw(view()), ROOM.beam).length).toBeGreaterThan(0);
  });

  test('a longer reach draws more rows of beam', () => {
    const rows = (d) => withColor(draw(lit({ draw_direction: d })), ROOM.beamCool).length + withColor(draw(lit({ draw_direction: d })), ROOM.beamWarm).length;
    expect(rows('S')).toBeGreaterThan(rows('NE'));
  });

  test('a tree softens the beam', () => {
    const calls = draw(lit({ view: 'tree' }));
    expect(withColor(calls, ROOM.beamSoft).length).toBeGreaterThan(0);
    expect(withColor(calls, ROOM.beamWarm)).toHaveLength(0);
  });

  test('a lamp glows on the floor and the pane is dark when there is no window', () => {
    const calls = draw(view({ window: { lamp: true } }));
    const glow = withColor(calls, ROOM.lamp);
    expect(glow.length).toBeGreaterThan(0);
    glow.forEach((c) => expect(c.y).toBeGreaterThanOrEqual(56));
    expect(withColor(calls, ROOM.skyDark).length).toBeGreaterThan(0);
    expect(withColor(calls, ROOM.sky)).toHaveLength(0);
    expect(anyBeam(calls)).toHaveLength(0);
  });

  test('a null Pip draws no Pip', () => {
    expect(inkX(draw(view()))).not.toHaveLength(0);
    expect(inkX(draw(view({ pip: null })))).toHaveLength(0);
  });

  test('nothing is drawn outside the room for any window', () => {
    const windows = [
      ...['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'].flatMap((d) =>
        ['summer', 'winter'].map((season) => ({ draw_direction: d, season, view: 'open', lamp: false }))
      ),
      { draw_direction: 'S', season: 'winter', view: 'tree', lamp: false },
      { lamp: true },
    ];
    windows.forEach((w) => {
      draw(view({ window: w }), 1).forEach((c) => {
        expect(c.x).toBeGreaterThanOrEqual(0);
        expect(c.y).toBeGreaterThanOrEqual(0);
        expect(c.x + c.w).toBeLessThanOrEqual(ROOM_W);
        expect(c.y + c.h).toBeLessThanOrEqual(ROOM_H);
      });
    });
  });
});


test('hideGhosts draws no outlines for locked slots, and the default still does', () => {
  expect(ghosts(draw(view())).length).toBeGreaterThan(0);
  expect(ghosts(draw(view({ hideGhosts: true })))).toHaveLength(0);
  expect(ghosts(draw(view({ hideGhosts: true, hero: null })))).toHaveLength(0);
});

test('drawing a room with hidden outlines does not hide them in the next room', () => {
  draw(view({ hideGhosts: true }));
  expect(ghosts(draw(view())).length).toBeGreaterThan(0);
});
