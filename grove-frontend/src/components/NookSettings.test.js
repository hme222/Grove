import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import NookSettings from './NookSettings';
import { nookAPI } from '../lib/api';

jest.mock('../lib/api', () => ({ nookAPI: { settings: jest.fn() } }));

let mockUser = null;
const mockUpdateUser = jest.fn();
jest.mock('../contexts/AuthContext', () => ({ useAuth: () => ({ user: mockUser, updateUser: mockUpdateUser }) }));

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container;
let root;

const q = (id) => container.querySelector(`[data-testid="${id}"]`);
const click = (el) => act(() => el.dispatchEvent(new MouseEvent('click', { bubbles: true })));
const flush = () => act(async () => {});
const mount = () => act(async () => root.render(<NookSettings />));

beforeEach(() => {
  jest.clearAllMocks();
  mockUser = { nook_enabled: false };
  nookAPI.settings.mockResolvedValue({ data: { nook_enabled: true, nook_offered_at: 'x', nook_hero_plant_id: null } });
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

test('is a switch that shows whether the nook is on', async () => {
  await mount();
  const toggle = q('profile-nook-switch');
  expect(toggle.getAttribute('role')).toBe('switch');
  expect(toggle.getAttribute('aria-checked')).toBe('false');
  expect(toggle.textContent).toBe('Off');
  mockUser = { nook_enabled: true };
  await mount();
  expect(q('profile-nook-switch').getAttribute('aria-checked')).toBe('true');
  expect(q('profile-nook-switch').textContent).toBe('On');
});

test('explains that the nook is optional and that turning it off keeps what was earned', async () => {
  await mount();
  expect(q('profile-nook').textContent).toContain('It never scores your plants.');
  expect(q('profile-nook').textContent).toContain('keeps everything');
});

test('turning it on saves and updates the signed-in user', async () => {
  await mount();
  await click(q('profile-nook-switch'));
  await flush();
  expect(nookAPI.settings).toHaveBeenCalledWith({ enabled: true });
  expect(mockUpdateUser).toHaveBeenCalledWith({ nook_enabled: true, nook_offered_at: 'x', nook_hero_plant_id: null });
});

test('turning it off asks for enabled false', async () => {
  mockUser = { nook_enabled: true };
  await mount();
  await click(q('profile-nook-switch'));
  await flush();
  expect(nookAPI.settings).toHaveBeenCalledWith({ enabled: false });
});

test('a double tap saves once', async () => {
  await mount();
  await act(async () => {
    const toggle = q('profile-nook-switch');
    toggle.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    toggle.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
  await flush();
  expect(nookAPI.settings).toHaveBeenCalledTimes(1);
});

test('a failed save shows a plain error and does not change the user', async () => {
  nookAPI.settings.mockRejectedValue(new Error('network'));
  await mount();
  await click(q('profile-nook-switch'));
  await flush();
  expect(q('profile-nook-error').textContent).toBe('Couldn’t save that. Try again.');
  expect(mockUpdateUser).not.toHaveBeenCalled();
});
