import { daysSince, dueLabel } from './careCopy';

const NOW = new Date('2026-10-16T12:00:00Z');
const daysAgo = (n) => new Date(NOW.getTime() - n * 86400000).toISOString();
const daysAhead = (n) => new Date(NOW.getTime() + n * 86400000).toISOString();

describe('dueLabel', () => {
  test('a plant past its schedule gets a check-in that keeps days since watering', () => {
    expect(dueLabel({ next_water_due: daysAgo(3), last_watered_at: daysAgo(10) }, NOW)).toBe('Last watered 10 days ago');
  });

  test('without a last-watered date (a plant that has had a check but no watering) it keeps how far past schedule', () => {
    const checked = { last_care_at: daysAgo(5) };
    expect(dueLabel({ ...checked, next_water_due: daysAgo(2) }, NOW)).toBe('Due 2 days ago');
    expect(dueLabel({ ...checked, next_water_due: daysAgo(1.2) }, NOW)).toBe('Due 1 day ago');
  });

  test('never uses deadline words', () => {
    [daysAgo(1.5), daysAgo(30)].forEach((due) => {
      expect(dueLabel({ last_care_at: daysAgo(40), next_water_due: due }, NOW)).not.toMatch(/overdue|urgent/i);
      expect(dueLabel({ next_water_due: due }, NOW)).not.toMatch(/overdue|urgent/i);
    });
  });

  test('upcoming and missing schedules', () => {
    expect(dueLabel({ next_water_due: daysAgo(0.5) }, NOW)).toBe('Due today');
    expect(dueLabel({ next_water_due: daysAhead(1) }, NOW)).toBe('Due tomorrow');
    expect(dueLabel({ next_water_due: daysAhead(4) }, NOW)).toBe('Due in 4 days');
    expect(dueLabel({}, NOW)).toBe('Schedule needed');
  });
});

test('daysSince ignores missing and bad dates', () => {
  expect(daysSince(null, NOW)).toBeNull();
  expect(daysSince('not a date', NOW)).toBeNull();
  expect(daysSince(daysAgo(9), NOW)).toBe(9);
});

describe('checkInterval', () => {
  const { checkInterval } = require('./careCopy');
  test('words an interval as a check, never a command to water', () => {
    expect(checkInterval(7)).toBe('Check about every 7 days');
    expect(checkInterval(1)).toBe('Check about every 1 day');
    expect(checkInterval(7)).not.toMatch(/^Water/);
  });
  test('has a safe line when there is no interval', () => {
    expect(checkInterval(null)).toBe('Check the soil first');
  });
});

describe('a plant nobody has cared for', () => {
  const now = new Date('2026-12-10T12:00:00Z');
  const added = '2026-11-20T12:00:00.000Z'; // the watering date the server stamps when a plant is added
  const overdue = '2026-12-07T12:00:00.000Z';

  test('is never "last watered" or "due N days ago", even when its first check is overdue', () => {
    const plant = { created_at: added, last_watered_at: added, next_water_due: overdue };
    expect(dueLabel(plant, now)).toBe('No checks yet');
    expect(dueLabel({ ...plant, last_watered_at: null }, now)).toBe('No checks yet');
  });

  test('still shows the schedule when the first check is not overdue', () => {
    expect(dueLabel({ created_at: added, last_watered_at: added, next_water_due: '2026-12-10T12:00:00.000Z' }, now)).toBe('Due today');
    expect(dueLabel({ created_at: added, last_watered_at: added, next_water_due: '2026-12-15T12:00:00.000Z' }, now)).toBe('Due in 5 days');
  });

  test('a soil check counts as care even though nothing was watered', () => {
    const plant = { created_at: added, last_watered_at: added, last_care_at: '2026-12-01T12:00:00.000Z', next_water_due: overdue };
    expect(dueLabel(plant, now)).toBe('Last watered 20 days ago');
  });

  test('a watered plant keeps the gentle "last watered" wording', () => {
    expect(dueLabel({ created_at: added, last_watered_at: '2026-11-30T12:00:00.000Z', next_water_due: overdue }, now)).toBe('Last watered 10 days ago');
  });
});
