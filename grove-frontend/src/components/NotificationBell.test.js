import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import NotificationBell, { routeForNotification } from './NotificationBell';

jest.mock('../lib/api', () => ({ notificationAPI: {
  getUnreadCount: jest.fn(() => Promise.resolve({ data: { unread_count: 0 } })),
  getAll: jest.fn(() => Promise.resolve({ data: { notifications: [], unread_count: 0 } })),
} }));
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({ useNavigate: () => mockNavigate }), { virtual: true });
jest.mock('sonner', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const mount = async () => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => { root.render(<NotificationBell />); });
  return { container, done: () => { act(() => root.unmount()); container.remove(); } };
};

test('streak notifications have no route of their own any more', () => {
  // Old ones already stored fall through to the profile, not a care nudge.
  expect(routeForNotification({ type: 'streak_at_risk' })).toBe('/profile');
  expect(routeForNotification({ type: 'streak_milestone' })).toBe('/profile');
});

test('care and swap routes are unchanged', () => {
  expect(routeForNotification({ type: 'care_due' })).toBe('/care/today');
  expect(routeForNotification({ type: 'swap_match', entity_id: 's1' })).toBe('/swaps/s1');
});

test('the panel is a named dialog: the bell says it is open and focus moves to its title', async () => {
  const { container, done } = await mount();
  const bell = container.querySelector('[data-testid="notification-bell"]');
  expect(bell.getAttribute('aria-expanded')).toBe('false');
  await act(async () => { bell.click(); });
  await act(async () => {});
  const panel = container.querySelector('[data-testid="notification-center"]');
  expect(panel.getAttribute('role')).toBe('dialog');
  expect(document.getElementById(panel.getAttribute('aria-labelledby')).textContent).toBe('Notifications');
  expect(bell.getAttribute('aria-expanded')).toBe('true');
  expect(document.activeElement === document.getElementById('notification-center-title')).toBe(true);
  done();
});

test('Escape closes it and gives focus back to the bell', async () => {
  const { container, done } = await mount();
  const bell = container.querySelector('[data-testid="notification-bell"]');
  await act(async () => { bell.click(); });
  await act(async () => { document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); });
  await act(async () => { await new Promise((r) => setTimeout(r, 0)); });
  expect(container.querySelector('[data-testid="notification-center"]')).toBeNull();
  expect(document.activeElement === bell).toBe(true);
  done();
});

test('the panel links to notification settings', async () => {
  const { container, done } = await mount();
  await act(async () => { container.querySelector('[data-testid="notification-bell"]').click(); });
  await act(async () => { container.querySelector('[data-testid="notification-settings-link"]').click(); });
  expect(mockNavigate).toHaveBeenCalledWith('/settings/notifications');
  expect(container.querySelector('[data-testid="notification-center"]')).toBeNull();
  done();
});
