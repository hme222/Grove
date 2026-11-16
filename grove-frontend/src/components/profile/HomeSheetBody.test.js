import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import HomeSheetBody from './HomeSheetBody';
import { userAPI } from '../../lib/api';

jest.mock('../../lib/api', () => ({ userAPI: { updateMe: jest.fn() } }));
jest.mock('sonner', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));
jest.mock('./LocationFields', () => () => <div data-testid="location-fields" />);
let mockZip = false;
jest.mock('../../lib/features', () => ({ get ZIP_ZONE_ENABLED() { return mockZip; } }));
let mockUser;
const mockUpdateUser = jest.fn();
const applyPatch = (patch) => { mockUser = { ...mockUser, ...patch }; };
jest.mock('../../contexts/AuthContext', () => ({ useAuth: () => ({ user: mockUser, updateUser: mockUpdateUser }) }));

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let container; let root;
const q = (id) => container.querySelector(`[data-testid="${id}"]`);
const mount = async () => { await act(async () => { root.render(<HomeSheetBody />); }); };
beforeEach(() => {
  mockZip = false;
  mockUser = { has_pets: null, hemisphere: 'north' };
  mockUpdateUser.mockReset().mockImplementation(applyPatch);
  userAPI.updateMe.mockReset().mockResolvedValue({});
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => { act(() => root.unmount()); container.remove(); });

test('hemisphere chips reflect the saved value with aria-pressed', async () => {
  await mount();
  expect(q('profile-hemisphere-north').getAttribute('aria-pressed')).toBe('true');
  expect(q('profile-hemisphere-south').getAttribute('aria-pressed')).toBe('false');
  expect(container.querySelector('[role="group"][aria-labelledby]')).not.toBeNull();
});

test('choosing pets saves and sets aria-pressed', async () => {
  await mount();
  expect(q('profile-pets-yes').getAttribute('aria-pressed')).toBe('false');
  await act(async () => { q('profile-pets-yes').click(); });
  expect(userAPI.updateMe).toHaveBeenCalledWith({ has_pets: true });
  expect(q('profile-pets-yes').getAttribute('aria-pressed')).toBe('true');
  expect(q('profile-pets-no').getAttribute('aria-pressed')).toBe('false');
});

test('choosing a hemisphere saves it', async () => {
  await mount();
  await act(async () => { q('profile-hemisphere-south').click(); });
  expect(userAPI.updateMe).toHaveBeenCalledWith({ hemisphere: 'south' });
  expect(q('profile-hemisphere-south').getAttribute('aria-pressed')).toBe('true');
});

test('a failed pets save restores the old value and shows an inline error, no toast', async () => {
  const { toast } = require('sonner');
  userAPI.updateMe.mockRejectedValue(new Error('offline'));
  await mount();
  await act(async () => { q('profile-pets-yes').click(); });
  expect(mockUser.has_pets).toBe(null);
  expect(q('profile-pets-yes').getAttribute('aria-pressed')).toBe('false');
  expect(q('pets-error').textContent).toContain('Try again');
  expect(q('profile-pets-yes').getAttribute('aria-describedby')).toContain('pets-error');
  expect(toast.error).not.toHaveBeenCalled();
});

test('a failed hemisphere save restores the old value and shows an inline error', async () => {
  userAPI.updateMe.mockRejectedValue(new Error('offline'));
  await mount();
  await act(async () => { q('profile-hemisphere-south').click(); });
  expect(mockUser.hemisphere).toBe('north');
  expect(q('hemisphere-error').textContent).toContain('Try again');
});

test('location fields are absent with the flag off', async () => {
  await mount();
  expect(q('location-fields')).toBeNull();
});

test('location fields show with the flag on', async () => {
  mockZip = true;
  await mount();
  expect(q('location-fields')).not.toBeNull();
});
