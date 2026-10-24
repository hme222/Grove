// Light levels for a room, in plain words. The four levels match the species guide.
export const LIGHT_LEVELS = [
  { id: 'low', label: 'Low', phrase: 'low light', help: 'Far from a window, or a room that faces north.' },
  { id: 'medium', label: 'Medium', phrase: 'medium light', help: 'A few feet back from a window.' },
  { id: 'bright_indirect', label: 'Bright', phrase: 'bright, indirect light', help: 'Close to a window, but out of the direct sun.' },
  { id: 'bright_direct', label: 'Direct sun', phrase: 'direct sun', help: 'Sun lands on it for a few hours a day.' },
];

export const lightHelp = (id) => LIGHT_LEVELS.find((l) => l.id === id)?.help || '';
export const lightPhrase = (id) => LIGHT_LEVELS.find((l) => l.id === id)?.phrase || 'its own kind of light';

// One sentence about a plant that does not suit the room's light. Plants that suit it get none.
export function fitSentence({ name, need, fit }) {
  if (fit === 'dim') return `This room is a little dim for ${name}, which likes ${lightPhrase(need)}.`;
  if (fit === 'too_dim') return `${name} needs much more light than this room gets. It likes ${lightPhrase(need)}.`;
  if (fit === 'too_bright') return `This room is brighter than ${name} likes. It prefers ${lightPhrase(need)}.`;
  return '';
}

// What to say about the room as a whole.
export function roomSummary(room) {
  if (!room.light) return { tone: 'prompt', text: 'Tell us how bright this room is and we will check your plants suit it.' };
  const known = (room.fits || []).filter((f) => f.fit);
  const issues = known.filter((f) => f.fit !== 'good');
  if (!known.length) return { tone: 'neutral', text: '' };
  if (!issues.length) return { tone: 'good', text: known.length === 1 ? `${known[0].name} suits this light.` : `All ${known.length} plants here suit this light.` };
  return { tone: 'issues', text: '', issues: issues.map(fitSentence) };
}
