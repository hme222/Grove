import { readingLine, suitLine, directionName, levelName } from './lightCopy';

test('each shadow reading says what it means', () => {
  expect(readingLine('crisp').toLowerCase()).toContain('direct');
  expect(readingLine('soft').toLowerCase()).toContain('bright indirect');
  expect(readingLine('faint').toLowerCase()).toContain('low');
  expect(readingLine('nothing')).toBe('');
  expect(readingLine(undefined)).toBe('');
});

test('a plant is described kindly, never as a failure', () => {
  expect(suitLine('Pothos', 'suits')).toBe('Your Pothos suits this spot.');
  expect(suitLine('Jade', 'prefers_brighter')).toBe('Your Jade would like a sunnier spot.');
  expect(suitLine('Fern', 'prefers_dimmer')).toBe('Your Fern would like a shadier spot.');
  expect(suitLine('Fern', 'other')).toBe('');
});

test('direction and level names are plain words', () => {
  expect(directionName('SW')).toBe('southwest');
  expect(levelName('bright_direct')).toBe('Direct sun');
  expect(levelName('bright_indirect')).toBe('Bright indirect');
  expect(levelName('medium')).toBe('Medium');
  expect(levelName('low')).toBe('Low');
  expect(levelName('nope')).toBe('');
});
