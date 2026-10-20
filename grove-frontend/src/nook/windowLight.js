// Turns the person's window into a sun patch for the nook room, and into one plain sentence.
// `window` is the object the nook state carries, or null when none is saved.

const DIRECTION_NAMES = {
  N: 'north', NE: 'northeast', E: 'east', SE: 'southeast',
  S: 'south', SW: 'southwest', W: 'west', NW: 'northwest',
};

export const directionName = (direction) => DIRECTION_NAMES[direction] || '';

// Rows of floor the patch reaches in summer, and its tint. The room floor is 24 rows deep.
const PATCH = {
  NE: { rows: 8, tint: 'cool' },
  E: { rows: 12, tint: 'cool' },
  SE: { rows: 16, tint: 'warm' },
  S: { rows: 20, tint: 'warm' },
  SW: { rows: 22, tint: 'hot' },
  W: { rows: 17, tint: 'hot' },
  NW: { rows: 7, tint: 'warm' },
};
const FLOOR_ROWS = 24;
// In winter the sun sits low, so a south-facing patch reaches deeper into the room.
const WINTER_EXTRA = { SE: 6, S: 6, SW: 6, W: 5 };

export function lightPatch(window) {
  if (!window) return { kind: 'default', reach: FLOOR_ROWS, tint: 'cool', soft: false };
  if (window.lamp) return { kind: 'lamp', reach: 0, tint: 'warm', soft: false };
  const base = PATCH[window.draw_direction];
  if (!base) {
    return window.draw_direction === 'N'
      ? { kind: 'none', reach: 0, tint: 'cool', soft: false }
      : { kind: 'default', reach: FLOOR_ROWS, tint: 'cool', soft: false };
  }
  let reach = base.rows + (window.season === 'winter' ? WINTER_EXTRA[window.draw_direction] || 0 : 0);
  const soft = window.view === 'tree' || window.view === 'building';
  if (soft) reach = Math.round(reach * 0.6);
  return { kind: 'sun', reach: Math.min(reach, FLOOR_ROWS), tint: base.tint, soft };
}

const VIEW_WORDS = { open: 'open sky', tree: 'a tree', building: 'a building' };

export function windowSentence(window) {
  if (!window) return '';
  if (window.lamp) return "There's no window here, so the nook is lit by a lamp.";
  const view = VIEW_WORDS[window.view] || VIEW_WORDS.open;
  return `Your window faces ${directionName(window.direction)} and looks out on ${view}. ${window.arrives || ''}`.trim();
}
