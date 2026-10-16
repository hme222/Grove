import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import NotificationPreferencesPage from './NotificationPreferencesPage';
import { notificationAPI } from '../lib/api';

jest.mock('../lib/api', () => ({
  notificationAPI: { getPreferences: jest.fn(), updatePreferences: jest.fn() },
}));
jest.mock('sonner', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));
jest.mock('react-router-dom', () => ({ useNavigate: () => jest.fn() }), { virtual: true });
jest.mock('../components/PageHeader', () => ({ PageHeader: ({ title }) => <h1>{title}</h1> }));

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// Mirrors grove-backend/notification_policy.py DEFAULT_NOTIFICATION_PREFS.
const DEFAULTS = {
  push_care_due: true,
  push_care_overdue: false,
  push_streak_at_risk: false,
  push_streak_milestone: false,
  push_swap_match: false,
  push_swap_message: false,
  push_kudos_received: false,
  push_sitter_logged: true,
  push_bloom_hour: false,
  push_bouquet_reminder: true,
  push_grove_challenge: false,
  email_digest: true,
  email_swap_match: true,
  quiet_hours_enabled: true,
  quiet_hours_start: '21:00',
  quiet_hours_end: '08:00',
  care_daily_cap: 1,
};

let container;
let root;
const q = (id) => container.querySelector(`[data-testid="${id}"]`);

beforeEach(async () => {
  jest.clearAllMocks();
  notificationAPI.getPreferences.mockResolvedValue({ data: DEFAULTS });
  notificationAPI.updatePreferences.mockImplementation(async (partial) => ({ data: { ...DEFAULTS, ...partial } }));
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => { root.render(<NotificationPreferencesPage />); });
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

test('streak reminders show as off and care check as on', () => {
  expect(q('pref-toggle-push_streak_at_risk').getAttribute('aria-checked')).toBe('false');
  expect(q('pref-toggle-push_streak_milestone').getAttribute('aria-checked')).toBe('false');
  expect(q('pref-toggle-push_care_due').getAttribute('aria-checked')).toBe('true');
});

test('quiet hours show as on with their window', () => {
  expect(q('pref-toggle-quiet_hours_enabled').getAttribute('aria-checked')).toBe('true');
  expect(q('pref-quiet_hours_start').value).toBe('21:00');
});

test('daily limit defaults to one and can be raised', async () => {
  expect(q('pref-care-cap-1').checked).toBe(true);
  await act(async () => { q('pref-care-cap-3').click(); });
  expect(notificationAPI.updatePreferences).toHaveBeenCalledWith({ care_daily_cap: 3 });
  expect(q('pref-care-cap-3').checked).toBe(true);
});
