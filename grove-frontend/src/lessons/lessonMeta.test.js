import { LESSON_META, NOTE_CHIPS, lessonPath } from './lessonMeta';

test('lesson ids match the backend list', () => {
  expect(Object.keys(LESSON_META).sort()).toEqual([
    'habit-stacking',
    'light-basics',
    'plant-er',
    'plant-parent-reset',
    'soil-finger-test',
    'window-map',
  ]);
});

test('every lesson has a matching id, a title, and a blurb', () => {
  Object.entries(LESSON_META).forEach(([key, lesson]) => {
    expect(lesson.id).toBe(key);
    expect(lesson.title.length).toBeGreaterThan(0);
    expect(lesson.blurb.length).toBeGreaterThan(0);
  });
});

test('note chips are unique and short', () => {
  expect(new Set(NOTE_CHIPS).size).toBe(NOTE_CHIPS.length);
  NOTE_CHIPS.forEach((chip) => expect(chip.length).toBeLessThanOrEqual(24));
});

test('lessonPath builds the lesson route', () => {
  expect(lessonPath('plant-er')).toBe('/lessons/plant-er');
});
