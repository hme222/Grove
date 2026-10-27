import { STATUS_LABELS } from '../components/StatusDot';
// Words for Pip's nook. Proposed copy, for content review.
export const READINESS_STEP_LABELS = {
  'light-spot': 'Find a light spot',
  drainage: 'Check drainage',
  'soil-mix': 'Choose a soil mix',
};

export const READINESS_STATE_LABELS = { seed: 'Seed', sprouting: 'Sprouting', ready: 'Ready' };

// Nook tiles say a plant's state in the same words as every other status in the app.
export const CONDITION_LABELS = {
  fine: STATUS_LABELS.healthy,
  'due-soon': STATUS_LABELS.needs_water,
  'needs-attention': STATUS_LABELS.urgent,
};

export const PLANT_SOURCE = "From your records and Grove’s plant check";

// The lesson Pip points to when a plant needs attention.
export const QUIET_LESSON = 'plant-er';

const ITEM_LABELS = {
  shelf: 'a shelf',
  rug: 'a rug',
  lamp: 'a lamp',
  hanging: 'a hanging plant',
  'wall-art': 'a botanical print',
};

// What the nook holds beyond the window, table, and floor, in plain words.
export function unlockedItems(unlocked) {
  return Object.keys(ITEM_LABELS).filter((slot) => (unlocked || []).includes(slot)).map((slot) => ITEM_LABELS[slot]);
}

// How many plants need a look, said to match the tiles. Calm, never a count of problems.
export function lookLine(state) {
  const needing = ((state && state.plants) || []).filter((p) => p.condition === 'needs-attention').length;
  const n = Math.max(needing, state && state.quiet ? 1 : 0);
  if (n === 0) return 'Everyone looks settled.';
  if (n === 1) return 'One of your plants could use a look.';
  return 'Some of your plants could use a look.';
}

// Pip's one line. While a plant needs attention Pip stays calm and never celebrates.
export function pipLine(state) {
  if (!state) return '';
  if (state.quiet) return `${lookLine(state)} I’ll keep quiet. This lesson can help.`;
  if (state.level_up) return `Your nook grew. It’s ${String(state.level_name).toLowerCase()} now.`;
  if (state.grew) return 'Your nook grew.';
  return state.pip && state.pip.location === 'shelf'
    ? "I’ll be up on the shelf if you need me."
    : "I’ll be on the windowsill if you need me.";
}
