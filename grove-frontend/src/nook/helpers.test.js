import { unlockedItems, pipLine, READINESS_STEP_LABELS, CONDITION_LABELS } from './nookCopy';
import { pipMood } from './pipMood';
import { integerScale } from './scale';
import { shouldShowNookOffer, hasFinishedALesson } from './offerGate';
import { buildView } from './buildView';

describe('nookCopy', () => {
  test('names what is unlocked in plain words and in order', () => {
    expect(unlockedItems(['window', 'table', 'sill', 'floor'])).toEqual([]);
    expect(unlockedItems(['shelf', 'lamp', 'rug'])).toEqual(['a shelf', 'a rug', 'a lamp']);
    expect(unlockedItems(['shelf', 'rug', 'lamp', 'hanging', 'wall-art'])).toEqual([
      'a shelf', 'a rug', 'a lamp', 'a hanging plant', 'a botanical print',
    ]);
    expect(unlockedItems(undefined)).toEqual([]);
  });

  test('Pip stays quiet while a plant needs attention, and never celebrates then', () => {
    const line = pipLine({ quiet: true, level_up: true, grew: true, level_name: 'Lived in', pip: { location: 'shelf' } });
    expect(line).toContain('keep quiet');
    expect(line.toLowerCase()).not.toContain('grew');
  });

  test('a level up says the nook grew and names the level', () => {
    expect(pipLine({ level_up: true, grew: true, level_name: 'Settling in', pip: { location: 'shelf' } })).toBe(
      "Your nook grew. It's settling in now."
    );
  });

  test('growth alone says the nook grew, with no numbers', () => {
    const line = pipLine({ grew: true, level_name: 'Bare', pip: { location: 'sill' } });
    expect(line).toBe('Your nook grew.');
    expect(line).not.toMatch(/\d/);
  });

  test('otherwise Pip says where he is', () => {
    expect(pipLine({ pip: { location: 'sill' } })).toContain('windowsill');
    expect(pipLine({ pip: { location: 'shelf' } })).toContain('shelf');
    expect(pipLine(null)).toBe('');
  });

  test('every readiness step and condition has a label', () => {
    expect(Object.keys(READINESS_STEP_LABELS)).toEqual(['light-spot', 'drainage', 'soil-mix']);
    expect(Object.keys(CONDITION_LABELS)).toEqual(['fine', 'due-soon', 'needs-attention']);
  });
});

describe('pipMood', () => {
  test.each([
    [0, 'sleepy'], [4, 'sleepy'], [5, 'curious'], [10, 'curious'], [11, 'calm'], [20, 'calm'], [21, 'sleepy'], [23, 'sleepy'],
  ])('at hour %i Pip is %s', (hour, mood) => {
    expect(pipMood({ hour })).toBe(mood);
  });

  test('celebrating beats the time of day, and quiet beats celebrating', () => {
    expect(pipMood({ hour: 2, celebrating: true })).toBe('pleased');
    expect(pipMood({ hour: 2, celebrating: true, quiet: true })).toBe('calm');
  });
});

describe('integerScale', () => {
  test.each([[0, 2], [undefined, 2], [200, 2], [256, 2], [343, 2], [384, 3], [500, 3], [640, 5], [700, 5]])(
    'a %s px wide space scales %i times',
    (width, scale) => {
      expect(integerScale(width)).toBe(scale);
    }
  );
});

describe('the nook offer gate', () => {
  const ready = {
    onboarding_complete: true,
    primary_track: 'rescue',
    first_care_celebrated: true,
    tutorials_seen: [],
  };

  test('shows after the first care log', () => {
    expect(shouldShowNookOffer(ready)).toBe(true);
  });

  test('shows after the first finished lesson for someone with no plant', () => {
    expect(shouldShowNookOffer({ ...ready, first_care_celebrated: false, tutorials_seen: ['lesson:plant-er'] })).toBe(true);
  });

  test('does not show before any real action', () => {
    expect(shouldShowNookOffer({ ...ready, first_care_celebrated: false, tutorials_seen: ['collection'] })).toBe(false);
  });

  test('does not show once the offer was made, whatever the answer was', () => {
    expect(shouldShowNookOffer({ ...ready, nook_offered_at: '2026-10-14T10:00:00Z' })).toBe(false);
  });

  test('does not show to long-time users with no saved track, or before onboarding ends', () => {
    expect(shouldShowNookOffer({ ...ready, primary_track: undefined })).toBe(false);
    expect(shouldShowNookOffer({ ...ready, onboarding_complete: false })).toBe(false);
  });

  test('handles a missing user and odd data', () => {
    expect(shouldShowNookOffer(null)).toBe(false);
    expect(hasFinishedALesson({ tutorials_seen: [null, 7, 'lesson:soil-finger-test'] })).toBe(true);
    expect(hasFinishedALesson({})).toBe(false);
  });
});

describe('buildView', () => {
  const state = {
    unlocked: ['window', 'shelf'],
    pip: { form: 'sprout', location: 'shelf' },
    hero: { id: 'p1', group: 'snake', condition: 'due-soon' },
    shelf_plants: [{ id: 'p2', group: 'pothos', condition: 'fine' }],
    readiness: null,
  };

  test('maps the state and keeps the mood', () => {
    expect(buildView(state, 'sleepy')).toEqual({
      unlocked: ['window', 'shelf'],
      pip: { form: 'sprout', location: 'shelf', mood: 'sleepy' },
      hero: { group: 'snake', condition: 'due-soon' },
      readiness: null,
      shelfPlants: [{ condition: 'fine' }],
      window: null,
    });
  });

  test('passes the window through', () => {
    const window = { draw_direction: 'S', season: 'summer', view: 'open', lamp: false };
    expect(buildView({ ...state, window }, 'calm').window).toEqual(window);
    expect(buildView({ ...state, window: undefined }, 'calm').window).toBeNull();
  });

  test('puts the readiness plant on the table only while there is no real plant', () => {
    const readiness = { state: 'sprouting', group: 'monstera' };
    expect(buildView({ ...state, hero: null, readiness }, 'calm').readiness).toEqual({ state: 'sprouting', group: 'monstera' });
    expect(buildView({ ...state, readiness }, 'calm').readiness).toBeNull();
  });

  test('keeps a replaced readiness plant on the shelf as a keepsake', () => {
    const readiness = { state: 'ready', group: 'monstera' };
    expect(buildView({ ...state, readiness }, 'calm').shelfPlants).toEqual([{ condition: 'fine' }, { condition: 'fine' }]);
  });
});
