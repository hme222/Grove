import { LESSON_META, QUIZ_OPTIONS, NOTE_CHIPS, lessonPath } from './lessonMeta';

test('lesson ids match the backend list', () => {
  expect(Object.keys(LESSON_META).sort()).toEqual([
    'habit-stacking',
    'plant-er',
    'plant-parent-reset',
    'soil-finger-test',
    'window-blueprint',
  ]);
});

test('every lesson has a matching id, a title, and a blurb', () => {
  Object.entries(LESSON_META).forEach(([key, lesson]) => {
    expect(lesson.id).toBe(key);
    expect(lesson.title.length).toBeGreaterThan(0);
    expect(lesson.blurb.length).toBeGreaterThan(0);
  });
});

test('quiz option ids match the backend list', () => {
  expect(QUIZ_OPTIONS.map((o) => o.id).sort()).toEqual([
    'design_or_no_plant',
    'forget',
    'gifted_no_instructions',
    'overwater',
    'unwell_or_guilt',
  ]);
});

test('quiz labels never show internal track names', () => {
  const internal = ['reset', 'rebirth', 'rescue', 'steady sprout', 'seedling', 'black thumb', 'heartbroken'];
  QUIZ_OPTIONS.forEach((option) => {
    const text = option.label.toLowerCase();
    internal.forEach((name) => expect(text).not.toContain(name));
  });
});

test('note chips are unique and short', () => {
  expect(new Set(NOTE_CHIPS).size).toBe(NOTE_CHIPS.length);
  NOTE_CHIPS.forEach((chip) => expect(chip.length).toBeLessThanOrEqual(24));
});

test('lessonPath builds the lesson route', () => {
  expect(lessonPath('plant-er')).toBe('/lessons/plant-er');
});
