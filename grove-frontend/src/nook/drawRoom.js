import { PALETTE, ROOM } from './palette';
import { pipSprite, plantSprite, seedlingSprite, CENTER } from './sprites';
import { lightPatch } from './windowLight';

// The nook is a fixed 128 x 80 pixel scene. Every position below is in those
// logical pixels. The canvas is scaled up by whole numbers only.
export const ROOM_W = 128;
export const ROOM_H = 80;

// Where Pip stands. He starts on the windowsill and moves to the shelf at level 2.
export const PIP_SPOTS = {
  sill: { cx: 29, baseY: 37 },
  shelf: { cx: 82, baseY: 25 },
};
export const HERO_SPOT = { cx: 65, baseY: 49 };

const rect = (ctx, x, y, w, h, color) => {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
};

// Lesson rooms turn the outlines off. Set at the start of each drawRoom call.
let ghostsOn = true;

// A faint outline that shows where something will appear once it unlocks.
function ghost(ctx, x, y, w, h) {
  if (!ghostsOn) return;
  ctx.fillStyle = ROOM.ghost;
  ctx.fillRect(x, y, w, 1);
  ctx.fillRect(x, y + h - 1, w, 1);
  ctx.fillRect(x, y, 1, h);
  ctx.fillRect(x + w - 1, y, 1, h);
}

// Draws a sprite so its bottom row sits on `baseY` and its centre column on `cx`.
export function drawSprite(ctx, rows, cx, baseY) {
  const top = baseY - rows.length + 1;
  const left = cx - CENTER;
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x += 1) {
      const color = PALETTE[row[x]];
      if (color) rect(ctx, left + x, top + y, 1, 1, color);
    }
  });
}

function drawBackdrop(ctx, window) {
  rect(ctx, 0, 0, ROOM_W, 56, ROOM.wall);
  rect(ctx, 0, 40, ROOM_W, 14, ROOM.wainscot);
  rect(ctx, 0, 40, ROOM_W, 1, ROOM.wainscotLine);
  rect(ctx, 0, 54, ROOM_W, 2, ROOM.baseboard);
  rect(ctx, 0, 56, ROOM_W, 24, ROOM.floor);
  [60, 65, 71, 77].forEach((y) => rect(ctx, 0, y, ROOM_W, 1, ROOM.plank));
  [20, 52, 90, 110].forEach((x, i) => rect(ctx, x, 56 + i * 5, 1, 5, ROOM.plank));
  // window, sill, and the light it throws on the floor
  rect(ctx, 14, 8, 30, 30, ROOM.windowFrame);
  const patch = lightPatch(window);
  const pane = patch.kind === 'lamp' ? ROOM.skyDark : ROOM.sky;
  [[16, 10], [30, 10], [16, 24], [30, 24]].forEach(([x, y]) => rect(ctx, x, y, 12, 12, pane));
  rect(ctx, 12, 38, 34, 2, ROOM.sill);
  drawLight(ctx, patch);
}

const BEAM_COLORS = { cool: ROOM.beamCool, warm: ROOM.beamWarm, hot: ROOM.beamHot };

// The light on the floor: the original beam, a sun patch for the window, a lamp glow, or none.
function drawLight(ctx, patch) {
  if (patch.kind === 'default') {
    for (let y = 56; y < 80; y += 1) rect(ctx, Math.round(22 + (y - 56) * 0.9), y, 28, 1, ROOM.beam);
  } else if (patch.kind === 'sun') {
    const color = patch.soft ? ROOM.beamSoft : BEAM_COLORS[patch.tint];
    for (let y = 56; y < 56 + patch.reach; y += 1) rect(ctx, Math.round(22 + (y - 56) * 0.9), y, 28, 1, color);
  } else if (patch.kind === 'lamp') {
    [[12, 66, 22], [8, 68, 30], [8, 70, 30], [12, 72, 22]].forEach(([x, y, w]) => rect(ctx, x, y, w, 2, ROOM.lamp));
  }
}

function drawTable(ctx) {
  rect(ctx, 52, 50, 26, 3, ROOM.wood);
  rect(ctx, 52, 50, 26, 1, ROOM.woodLight);
  rect(ctx, 54, 53, 2, 13, ROOM.woodDark);
  rect(ctx, 74, 53, 2, 13, ROOM.woodDark);
}

// A small potted plant for the shelf: a pot and a leaf blob in the plant's condition colour.
function drawMiniPlant(ctx, x, baseY, condition) {
  const leaf = condition === 'needs-attention' ? PALETTE.n : PALETTE.G;
  rect(ctx, x + 1, baseY - 6, 3, 3, leaf);
  if (condition === 'due-soon') rect(ctx, x + 4, baseY - 8, 1, 2, PALETTE.b);
  rect(ctx, x, baseY - 3, 5, 3, PALETTE.t);
  rect(ctx, x, baseY - 3, 5, 1, PALETTE.u);
}

function drawShelf(ctx, unlocked, shelfPlants) {
  if (!unlocked.includes('shelf')) {
    ghost(ctx, 72, 14, 46, 14);
    return;
  }
  rect(ctx, 72, 26, 46, 2, ROOM.wood);
  rect(ctx, 76, 28, 1, 3, ROOM.woodDark);
  rect(ctx, 112, 28, 1, 3, ROOM.woodDark);
  rect(ctx, 92, 18, 3, 8, PALETTE.t);
  rect(ctx, 95, 16, 3, 10, PALETTE.G);
  rect(ctx, 98, 19, 3, 7, PALETTE.p);
  rect(ctx, 101, 17, 3, 9, PALETTE.d);
  shelfPlants.slice(0, 2).forEach((plant, i) => drawMiniPlant(ctx, 106 + i * 6, 26, plant.condition));
}

function drawRugAndLamp(ctx, unlocked) {
  if (unlocked.includes('rug')) {
    rect(ctx, 38, 66, 52, 10, ROOM.rug);
    rect(ctx, 36, 68, 56, 6, ROOM.rug);
    rect(ctx, 41, 68, 46, 6, ROOM.rugInner);
    rect(ctx, 44, 70, 40, 2, ROOM.rugStripe);
  } else {
    ghost(ctx, 36, 66, 56, 10);
  }
  if (unlocked.includes('lamp')) {
    rect(ctx, 6, 36, 1, 30, ROOM.lampPole);
    rect(ctx, 2, 30, 9, 6, ROOM.lampShade);
    rect(ctx, 3, 29, 7, 1, ROOM.lampTop);
    rect(ctx, 3, 64, 7, 2, ROOM.lampPole);
  } else {
    ghost(ctx, 2, 30, 9, 36);
  }
}

const VINES = [
  [120, 13], [121, 15], [120, 17], [122, 19], [121, 22], [123, 24], [125, 15],
  [126, 18], [125, 21], [126, 26], [124, 29], [122, 31], [120, 27],
];

function drawHangingAndArt(ctx, unlocked) {
  if (unlocked.includes('hanging')) {
    rect(ctx, 123, 0, 1, 8, ROOM.cord);
    rect(ctx, 119, 8, 9, 5, PALETTE.t);
    VINES.forEach(([x, y]) => rect(ctx, x, y, 2, 2, PALETTE.G));
    rect(ctx, 124, 17, 1, 1, PALETTE.g);
    rect(ctx, 121, 25, 1, 1, PALETTE.g);
  } else {
    ghost(ctx, 119, 0, 9, 34);
  }
  if (unlocked.includes('wall-art')) {
    rect(ctx, 54, 8, 18, 18, ROOM.wood);
    rect(ctx, 56, 10, 14, 14, ROOM.rugInner);
    rect(ctx, 62, 13, 2, 9, PALETTE.G);
    rect(ctx, 59, 15, 3, 2, PALETTE.g);
    rect(ctx, 64, 17, 3, 2, PALETTE.g);
  } else {
    ghost(ctx, 54, 8, 18, 18);
  }
}

function drawHero(ctx, view) {
  const { cx, baseY } = HERO_SPOT;
  if (view.hero) {
    drawSprite(ctx, plantSprite(view.hero.group, view.hero.condition), cx, baseY);
  } else if (view.readiness) {
    const rows = view.readiness.state === 'ready'
      ? plantSprite(view.readiness.group, 'fine')
      : seedlingSprite(view.readiness.state);
    drawSprite(ctx, rows, cx, baseY);
  } else {
    ghost(ctx, cx - 6, baseY - 8, 13, 9);
  }
}

// Draws the whole nook for one view. `tick` flips Pip's small bob; pass 0 for a still image.
//   view = { unlocked: string[], pip: { form, location, mood } | null,
//            hideGhosts?: true to skip the outlines of locked slots,
//            window: the nook state's window | null (omit for the original beam),
//            hero: { group, condition } | null,
//            readiness: { state, group } | null,
//            shelfPlants: { condition }[] }
export function drawRoom(ctx, view, tick = 0) {
  const unlocked = view.unlocked || [];
  ghostsOn = !view.hideGhosts;
  drawBackdrop(ctx, view.window);
  drawRugAndLamp(ctx, unlocked);
  drawHangingAndArt(ctx, unlocked);
  drawShelf(ctx, unlocked, view.shelfPlants || []);
  drawTable(ctx);
  drawHero(ctx, view);
  if (!view.pip) return;
  const spot = PIP_SPOTS[view.pip.location] || PIP_SPOTS.sill;
  const bob = tick % 2 ? -1 : 0;
  drawSprite(ctx, pipSprite(view.pip.form, view.pip.mood), spot.cx, spot.baseY + bob);
}
