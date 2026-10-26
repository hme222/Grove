import { routeForNotification } from './NotificationBell';

jest.mock('../lib/api', () => ({ notificationAPI: {} }));
jest.mock('react-router-dom', () => ({ useNavigate: () => jest.fn() }), { virtual: true });
jest.mock('sonner', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

test('streak notifications have no route of their own any more', () => {
  // Old ones already stored fall through to the profile, not a care nudge.
  expect(routeForNotification({ type: 'streak_at_risk' })).toBe('/profile');
  expect(routeForNotification({ type: 'streak_milestone' })).toBe('/profile');
});

test('care and swap routes are unchanged', () => {
  expect(routeForNotification({ type: 'care_due' })).toBe('/care/today');
  expect(routeForNotification({ type: 'swap_match', entity_id: 's1' })).toBe('/swaps/s1');
});
