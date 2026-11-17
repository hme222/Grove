import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import NotificationPreferencesPage, { visibleKeys } from './NotificationPreferencesPage';
import { notificationAPI } from '../lib/api';

jest.mock('../lib/api', () => ({
  notificationAPI: { getPreferences: jest.fn(), updatePreferences: jest.fn() },
}));
jest.mock('sonner', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({ useNavigate: () => mockNavigate }), { virtual: true });
let mockUser = { tier: 'free' };
jest.mock('../contexts/AuthContext', () => ({ useAuth: () => ({ user: mockUser }) }));
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

test('Recent notifications is the first row and goes to /notifications', async () => {
  const link = q('notifications-recent-link');
  expect(link).not.toBeNull();
  expect(link.tagName).toBe('BUTTON');
  expect(link.textContent).toContain('Recent notifications');
  const list = link.parentElement;
  expect(list.firstElementChild).toBe(link);
  await act(async () => { link.click(); });
  expect(mockNavigate).toHaveBeenCalledWith('/notifications');
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

test('care reminders and the daily digest stay on the list', () => {
  ['push_care_due', 'push_care_overdue', 'email_digest'].forEach((key) => {
    expect(q(`pref-row-${key}`)).not.toBeNull();
  });
});

test('with community off, swap, reaction and sitter rows are not listed, even ones on by default', () => {
  ['push_swap_match', 'push_swap_message', 'push_kudos_received', 'push_sitter_logged', 'email_swap_match'].forEach((key) => {
    expect(q(`pref-row-${key}`)).toBeNull();
  });
});

test('bouquet reminders are listed only for Pro and florist accounts', async () => {
  expect(q('pref-row-push_bouquet_reminder')).toBeNull();
  act(() => root.unmount());
  mockUser = { tier: 'florist_pro' };
  root = createRoot(container);
  await act(async () => { root.render(<NotificationPreferencesPage />); });
  expect(q('pref-row-push_bouquet_reminder')).not.toBeNull();
  mockUser = { tier: 'free' };
});

test('the alerts group says what they are: in-app alerts', () => {
  expect(q('pref-group-push-notifications').textContent).toContain('In-app alerts');
  expect(container.textContent).not.toContain('Push notifications');
});

test('visibleKeys lists a community row once community is on', () => {
  const keys = [{ key: 'push_swap_match', feature: 'community' }, { key: 'push_care_due' }];
  expect(visibleKeys(keys, {}, { community: false }).map((k) => k.key)).toEqual(['push_care_due']);
  expect(visibleKeys(keys, {}, { community: true }).map((k) => k.key)).toEqual(['push_swap_match', 'push_care_due']);
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

test('no developer notes reach the screen', () => {
  expect(container.textContent).not.toMatch(/Wave B|cron|Toggles stored/);
  expect(q('notifications-delivery-note').textContent).toBe('Push and email delivery come in a later update. Your choices are saved now.');
});
