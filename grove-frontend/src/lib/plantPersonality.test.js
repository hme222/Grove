import { plantPersonality, checkInsLabel, PERSONALITY_COPY } from './plantPersonality';

const expectRow = (stats, id, title, line) => {
  expect(plantPersonality(stats)).toEqual({ id, title, line });
};

describe('plantPersonality', () => {
  test('none: no plants', () => {
    expectRow(
      { total_plants: 0, total_care_logs: 0 },
      'none',
      null,
      "Add a plant and we'll start figuring out your plant personality."
    );
  });

  test('null or empty stats are none', () => {
    expect(plantPersonality(null).id).toBe('none');
    expect(plantPersonality(undefined).id).toBe('none');
    expect(plantPersonality({}).id).toBe('none');
  });

  test('freshStart: plants but no care logs', () => {
    expectRow(
      { total_plants: 2, total_care_logs: 0 },
      'freshStart',
      'The Fresh Start',
      "New plants, new chapter. You're in the getting-to-know-you phase, and that's the fun part."
    );
  });

  test('propagator: one or more propagations', () => {
    expectRow(
      { total_plants: 2, total_care_logs: 1, propagation_count: 1 },
      'propagator',
      'The Propagator',
      'You look at a stem and see a whole new plant. Patient, curious, a little bit mad scientist.'
    );
  });

  test('jungleKeeper: ten or more plants', () => {
    expectRow(
      { total_plants: 10, total_care_logs: 1, propagation_count: 0 },
      'jungleKeeper',
      'The Jungle Keeper',
      "Ten or more plants. That's not a plant, that's a household. Bet you know every one's quirks."
    );
  });

  test('steadyHand: nothing needs water and five or more logs', () => {
    expectRow(
      { total_plants: 3, total_care_logs: 5, plants_needing_water: 0 },
      'steadyHand',
      'The Steady Hand',
      'You show up when your plants need you, right on time. Routine might be your love language.'
    );
  });

  test('regular: check-in goal met', () => {
    expectRow(
      {
        total_plants: 3,
        total_care_logs: 2,
        plants_needing_water: 1,
        check_ins: { this_week: 3, weekly_goal: 3 },
      },
      'regular',
      'The Regular',
      "Check-in goal met. You'd rather spot something early than fix it late."
    );
  });

  test('bigPicture: more than half need water', () => {
    expectRow(
      {
        total_plants: 4,
        total_care_logs: 2,
        plants_needing_water: 3,
        check_ins: { this_week: 1, weekly_goal: 3 },
      },
      'bigPicture',
      'The Big-Picture Gardener',
      'You think in big moves, not tiny chores. Today handles the details: who to visit first, one plant at a time.'
    );
  });

  test('bigPicture needs strictly more than half', () => {
    expect(
      plantPersonality({ total_plants: 4, total_care_logs: 2, plants_needing_water: 2 }).id
    ).toBe('growing');
  });

  test('growing: anything else', () => {
    expectRow(
      {
        total_plants: 4,
        total_care_logs: 2,
        plants_needing_water: 1,
        check_ins: { this_week: 1, weekly_goal: 3 },
      },
      'growing',
      'The Growing Gardener',
      "Still finding your rhythm and noticing as you go. That's how plant people are made."
    );
  });

  test('rule order: propagator beats jungleKeeper', () => {
    expect(
      plantPersonality({ total_plants: 12, propagation_count: 1, total_care_logs: 3 }).id
    ).toBe('propagator');
  });

  test('copy table has all eight ids', () => {
    expect(Object.keys(PERSONALITY_COPY).sort()).toEqual(
      ['bigPicture', 'freshStart', 'growing', 'jungleKeeper', 'none', 'propagator', 'regular', 'steadyHand'].sort()
    );
  });
});

describe('checkInsLabel', () => {
  test('formats this week against the goal', () => {
    expect(checkInsLabel({ check_ins: { this_week: 1, weekly_goal: 3 } })).toBe('1 of 3');
  });
  test('falls back to a goal of 3', () => {
    expect(checkInsLabel({ check_ins: { this_week: 2 } })).toBe('2 of 3');
  });
  test('null when check_ins is missing', () => {
    expect(checkInsLabel({})).toBeNull();
    expect(checkInsLabel(null)).toBeNull();
  });
});
