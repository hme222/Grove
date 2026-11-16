// Rule-based plant personality. Pure and local: no AI, no backend call.
// Rules and approved copy: docs/superpowers/specs/2026-11-16-profile-tile-hub-design.md
// The thresholds (5 logs, 10 plants) are guesses, not findings.

export const PERSONALITY_COPY = {
  none: {
    title: null,
    line: "Add a plant and we'll start figuring out your plant personality.",
  },
  freshStart: {
    title: 'The Fresh Start',
    line: "New plants, new chapter. You're in the getting-to-know-you phase, and that's the fun part.",
  },
  propagator: {
    title: 'The Propagator',
    line: 'You look at a stem and see a whole new plant. Patient, curious, a little bit mad scientist.',
  },
  jungleKeeper: {
    title: 'The Jungle Keeper',
    line: "Ten or more plants. That's not a plant, that's a household. Bet you know every one's quirks.",
  },
  steadyHand: {
    title: 'The Steady Hand',
    line: 'You show up when your plants need you, right on time. Routine might be your love language.',
  },
  regular: {
    title: 'The Regular',
    line: "Check-in goal met. You'd rather spot something early than fix it late.",
  },
  bigPicture: {
    title: 'The Big-Picture Gardener',
    line: 'You think in big moves, not tiny chores. Today handles the details: who to visit first, one plant at a time.',
  },
  growing: {
    title: 'The Growing Gardener',
    line: "Still finding your rhythm and noticing as you go. That's how plant people are made.",
  },
};

const DEFAULT_WEEKLY_GOAL = 3;

const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);

export function plantPersonality(stats) {
  const s = stats || {};
  const totalPlants = num(s.total_plants);
  const logs = num(s.total_care_logs);
  const needingWater = num(s.plants_needing_water);
  const thisWeek = num(s.check_ins?.this_week);
  const goal = num(s.check_ins?.weekly_goal) || DEFAULT_WEEKLY_GOAL;

  let id = 'growing';
  if (totalPlants === 0) id = 'none';
  else if (logs === 0) id = 'freshStart';
  else if (num(s.propagation_count) >= 1) id = 'propagator';
  else if (totalPlants >= 10) id = 'jungleKeeper';
  else if (needingWater === 0 && logs >= 5) id = 'steadyHand';
  else if (thisWeek >= goal) id = 'regular';
  else if (needingWater * 2 > totalPlants) id = 'bigPicture';

  return { id, ...PERSONALITY_COPY[id] };
}

export function checkInsLabel(stats) {
  const c = stats?.check_ins;
  if (!c) return null;
  const goal = num(c.weekly_goal) || DEFAULT_WEEKLY_GOAL;
  return `${num(c.this_week)} of ${goal}`;
}
