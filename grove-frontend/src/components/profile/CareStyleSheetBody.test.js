import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import CareStyleSheetBody from './CareStyleSheetBody';
import { userAPI } from '../../lib/api';

jest.mock('../../lib/api', () => ({ userAPI: { updateMe: jest.fn() } }));
jest.mock('sonner', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));
let mockUser;
const mockUpdateUser = jest.fn();
const applyPatch = (patch) => { mockUser = { ...mockUser, ...patch }; };
jest.mock('../../contexts/AuthContext', () => ({ useAuth: () => ({ user: mockUser, updateUser: mockUpdateUser }) }));

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let container; let root;
const q = (id) => container.querySelector(`[data-testid="${id}"]`);
const mount = async () => { await act(async () => { root.render(<CareStyleSheetBody />); }); };
beforeEach(() => {
  mockUser = { prefer_manual_plant_entry: false };
  mockUpdateUser.mockReset().mockImplementation(applyPatch);
  userAPI.updateMe.mockReset().mockResolvedValue({});
  localStorage.clear();
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => { act(() => root.unmount()); container.remove(); });

test('shows the care text choice and both switches', async () => {
  await mount();
  ['care-text-simple', 'care-text-detailed', 'profile-daily-trivia-toggle', 'profile-prefer-manual-toggle'].forEach((id) => {
    expect(q(id)).not.toBeNull();
  });
});

test('a failed manual-entry save puts the switch back and shows Try again', async () => {
  userAPI.updateMe.mockRejectedValue(new Error('offline'));
  await mount();
  await act(async () => { q('profile-prefer-manual-toggle').click(); });
  expect(mockUpdateUser).toHaveBeenNthCalledWith(1, { prefer_manual_plant_entry: true });
  expect(mockUpdateUser).toHaveBeenLastCalledWith({ prefer_manual_plant_entry: false });
  expect(mockUser.prefer_manual_plant_entry).toBe(false);
  expect(q('profile-prefer-manual-toggle').getAttribute('aria-checked')).toBe('false');
  expect(q('manual-entry-error').textContent).toContain('Try again');
  expect(q('profile-prefer-manual-toggle').getAttribute('aria-describedby')).toContain('manual-entry-error');
});

test('a successful manual-entry save keeps the new value with no error', async () => {
  await mount();
  await act(async () => { q('profile-prefer-manual-toggle').click(); });
  expect(userAPI.updateMe).toHaveBeenCalledWith({ prefer_manual_plant_entry: true });
  expect(mockUser.prefer_manual_plant_entry).toBe(true);
  expect(q('manual-entry-error')).toBeNull();
});

test('a failed care text save shows Try again under the toggle', async () => {
  userAPI.updateMe.mockRejectedValue(new Error('offline'));
  await mount();
  await act(async () => { q('care-text-detailed').click(); });
  expect(q('care-text-error').textContent).toContain('Try again');
});

test('the daily tip switch saves on the device and the server', async () => {
  await mount();
  await act(async () => { q('profile-daily-trivia-toggle').click(); });
  expect(localStorage.getItem('grove_show_daily_trivia')).toBe('true');
  expect(userAPI.updateMe).toHaveBeenCalledWith({ show_daily_trivia: true });
  expect(mockUser.show_daily_trivia).toBe(true);
  expect(q('daily-trivia-error')).toBeNull();
});

test('a failed daily tip save puts the switch and the device copy back and shows Try again', async () => {
  userAPI.updateMe.mockRejectedValue(new Error('offline'));
  await mount();
  await act(async () => { q('profile-daily-trivia-toggle').click(); });
  expect(localStorage.getItem('grove_show_daily_trivia')).toBe('false');
  expect(mockUser.show_daily_trivia).toBe(false);
  expect(q('profile-daily-trivia-toggle').getAttribute('aria-checked')).toBe('false');
  expect(q('daily-trivia-error').textContent).toContain('Try again');
  expect(q('profile-daily-trivia-toggle').getAttribute('aria-describedby')).toContain('daily-trivia-error');
});

test('Try again on the daily tip saves it and returns focus to the switch', async () => {
  userAPI.updateMe.mockRejectedValueOnce(new Error('offline'));
  await mount();
  await act(async () => { q('profile-daily-trivia-toggle').click(); });
  await act(async () => { q('daily-trivia-error').querySelector('button').click(); });
  await act(async () => { await new Promise((r) => setTimeout(r, 0)); });
  expect(q('daily-trivia-error')).toBeNull();
  expect(mockUser.show_daily_trivia).toBe(true);
  expect(localStorage.getItem('grove_show_daily_trivia')).toBe('true');
  expect(document.activeElement).toBe(q('profile-daily-trivia-toggle'));
});

test('focus returns to the manual-entry switch after a successful retry', async () => {
  userAPI.updateMe.mockRejectedValueOnce(new Error('offline'));
  await mount();
  await act(async () => { q('profile-prefer-manual-toggle').click(); });
  const retry = q('manual-entry-error').querySelector('button');
  retry.focus();
  await act(async () => { retry.click(); });
  await act(async () => { await new Promise((r) => setTimeout(r, 0)); });
  expect(q('manual-entry-error')).toBeNull();
  expect(document.activeElement).toBe(q('profile-prefer-manual-toggle'));
});
