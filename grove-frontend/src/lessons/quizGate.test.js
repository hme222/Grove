import { shouldShowQuiz, QUIZ_WINDOW_DAYS } from './quizGate';

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.parse('2026-10-14T12:00:00Z');
const iso = (daysAgo) => new Date(NOW - daysAgo * DAY).toISOString();

const newUser = (overrides = {}) => ({
  onboarding_complete: true,
  primary_track: undefined,
  created_at: iso(0),
  ...overrides,
});

test('shows for a new user who finished onboarding and has no track', () => {
  expect(shouldShowQuiz(newUser(), NOW)).toBe(true);
});

test('does not show before onboarding is complete', () => {
  expect(shouldShowQuiz(newUser({ onboarding_complete: false }), NOW)).toBe(false);
});

test('does not show once a track is saved', () => {
  expect(shouldShowQuiz(newUser({ primary_track: 'rebirth' }), NOW)).toBe(false);
});

test('does not interrupt long-time users', () => {
  expect(shouldShowQuiz(newUser({ created_at: iso(QUIZ_WINDOW_DAYS + 1) }), NOW)).toBe(false);
  expect(shouldShowQuiz(newUser({ created_at: iso(200) }), NOW)).toBe(false);
});

test('still shows on the last day of the window', () => {
  expect(shouldShowQuiz(newUser({ created_at: iso(QUIZ_WINDOW_DAYS - 0.5) }), NOW)).toBe(true);
});

test('handles missing or bad data without throwing', () => {
  expect(shouldShowQuiz(null, NOW)).toBe(false);
  expect(shouldShowQuiz(undefined, NOW)).toBe(false);
  expect(shouldShowQuiz(newUser({ created_at: undefined }), NOW)).toBe(false);
  expect(shouldShowQuiz(newUser({ created_at: 'not a date' }), NOW)).toBe(false);
  expect(shouldShowQuiz(newUser({ created_at: new Date(NOW + 5 * DAY).toISOString() }), NOW)).toBe(false);
});
