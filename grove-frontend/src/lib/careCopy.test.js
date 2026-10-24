import { daysSince, dueLabel } from './careCopy';

const NOW = new Date('2026-10-16T12:00:00Z');
const daysAgo = (n) => new Date(NOW.getTime() - n * 86400000).toISOString();
const daysAhead = (n) => new Date(NOW.getTime() + n * 86400000).toISOString();

describe('dueLabel', () => {
  test('a plant past its schedule gets a check-in that keeps days since watering', () => {
    expect(dueLabel({ next_water_due: daysAgo(3), last_watered_at: daysAgo(10) }, NOW)).toBe('Last watered 10 days ago');
  });

  test('without a last-watered date it keeps how far past schedule', () => {
    expect(dueLabel({ next_water_due: daysAgo(2) }, NOW)).toBe('Due 2 days ago');
    expect(dueLabel({ next_water_due: daysAgo(1.2) }, NOW)).toBe('Due 1 day ago');
  });

  test('never uses deadline words', () => {
    [daysAgo(1.5), daysAgo(30)].forEach((due) => {
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
