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

test('care check shows as on', () => {
  expect(q('pref-toggle-push_care_due').getAttribute('aria-checked')).toBe('true');
});

test('streak, bloom hour and challenge pushes are not offered to a new owner', () => {
  ['push_streak_at_risk', 'push_streak_milestone', 'push_bloom_hour', 'push_grove_challenge'].forEach((key) => {
    expect(q(`pref-row-${key}`)).toBeNull();
  });
  expect(container.textContent.toLowerCase()).not.toContain('streak');
});

test('care reminders, swap messages and email stay on the list', () => {
  ['push_care_due', 'push_swap_message', 'email_digest', 'email_swap_match'].forEach((key) => {
    expect(q(`pref-row-${key}`)).not.toBeNull();
  });
});

test('someone who already turned bloom hour on can still see it to turn it off', async () => {
  act(() => root.unmount());
  notificationAPI.getPreferences.mockResolvedValue({ data: { ...DEFAULTS, push_bloom_hour: true } });
  root = createRoot(container);
  await act(async () => { root.render(<NotificationPreferencesPage />); });
  expect(q('pref-toggle-push_bloom_hour').getAttribute('aria-checked')).toBe('true');
  expect(q('pref-row-push_grove_challenge')).toBeNull();
});

test('a stored streak value never brings the toggle back', async () => {
  act(() => root.unmount());
  notificationAPI.getPreferences.mockResolvedValue({ data: { ...DEFAULTS, push_streak_at_risk: true } });
  root = createRoot(container);
  await act(async () => { root.render(<NotificationPreferencesPage />); });
  expect(q('pref-row-push_streak_at_risk')).toBeNull();
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

test('a failed save puts the switch back and says the change was undone', async () => {
  notificationAPI.updatePreferences.mockRejectedValueOnce(new Error('network'));
  expect(q('pref-toggle-push_care_due').getAttribute('aria-checked')).toBe('true');
  await act(async () => { q('pref-toggle-push_care_due').click(); });
  expect(q('pref-toggle-push_care_due').getAttribute('aria-checked')).toBe('true');
  const { toast } = require('sonner');
  expect(toast.error.mock.calls[0][0]).toMatch(/undone/);
});
