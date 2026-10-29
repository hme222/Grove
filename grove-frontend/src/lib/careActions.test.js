import { careLoggedMessage, actionLabel, wateredToday } from './careActions';

test('one action names the action and the plant', () => {
  expect(careLoggedMessage(['water'], 'Monty')).toBe('Water logged for Monty');
  expect(careLoggedMessage('clean', 'Monty')).toBe('Wipe leaves logged for Monty');
});

test('several actions are counted, and a number of plants is pluralized', () => {
  expect(careLoggedMessage(['water', 'mist'], 'Monty')).toBe('2 actions logged for Monty');
  expect(careLoggedMessage(['water'], 3)).toBe('Water logged for 3 plants');
  expect(careLoggedMessage(['water'], 1)).toBe('Water logged for 1 plant');
});

test('an unknown action falls back to its own name', () => {
  expect(actionLabel('mystery')).toBe('mystery');
});

test('watered today compares the viewer’s own calendar day', () => {
  const now = new Date(2026, 9, 29, 15, 0, 0);
  expect(wateredToday({ last_watered_at: new Date(2026, 9, 29, 1, 0, 0).toISOString() }, now)).toBe(true);
  expect(wateredToday({ last_watered_at: new Date(2026, 9, 28, 23, 0, 0).toISOString() }, now)).toBe(false);
  expect(wateredToday({}, now)).toBe(false);
  expect(wateredToday({ last_watered_at: 'not a date' }, now)).toBe(false);
});
