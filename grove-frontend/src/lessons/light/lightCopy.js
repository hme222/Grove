import { directionName } from '../../nook/windowLight';

export { directionName };

const READING_LINES = {
  crisp: 'A crisp shadow means direct sun on that spot.',
  soft: 'A soft shadow means bright indirect light on that spot.',
  faint: 'A faint shadow means low light on that spot.',
};

export const readingLine = (reading) => READING_LINES[reading] || '';

export function suitLine(name, suit) {
  if (suit === 'suits') return `Your ${name} suits this spot.`;
  if (suit === 'prefers_brighter') return `Your ${name} would like a sunnier spot.`;
  if (suit === 'prefers_dimmer') return `Your ${name} would like a shadier spot.`;
  return '';
}

const LEVEL_NAMES = { bright_direct: 'Direct sun', bright_indirect: 'Bright indirect', medium: 'Medium', low: 'Low' };

export const levelName = (level) => LEVEL_NAMES[level] || '';
