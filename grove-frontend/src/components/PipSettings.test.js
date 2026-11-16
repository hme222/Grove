import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import PipSettings from './PipSettings';
import { userAPI } from '../lib/api';

jest.mock('../lib/api', () => ({ userAPI: { updateMe: jest.fn() } }));
let mockUser = {};
jest.mock('../contexts/AuthContext', () => ({ useAuth: () => ({ user: mockUser, updateUser: jest.fn() }) }));

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const show = async (user, props = {}) => {
  mockUser = user;
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => { root.render(<PipSettings {...props} />); });
  return { container, done: () => { act(() => root.unmount()); container.remove(); } };
};
const t = (c, id) => c.querySelector(`[data-testid="${id}"]`);

beforeEach(() => { jest.clearAllMocks(); userAPI.updateMe.mockResolvedValue({ data: {} }); });

test('both switches are on for someone who never set them', async () => {
  const { container, done } = await show({});
  expect(t(container, 'profile-pip-toggle').getAttribute('aria-checked')).toBe('true');
  expect(t(container, 'profile-pip-peeks-toggle').getAttribute('aria-checked')).toBe('true');
  done();
});

test('turning Pip off sends pip_enabled false', async () => {
  const { container, done } = await show({});
  await act(async () => { t(container, 'profile-pip-toggle').click(); });
  expect(userAPI.updateMe).toHaveBeenCalledWith({ pip_enabled: false });
  done();
});

test('with Pip off the peeks switch is off and cannot be changed', async () => {
  const { container, done } = await show({ pip_enabled: false });
  const peeks = t(container, 'profile-pip-peeks-toggle');
  expect(peeks.getAttribute('aria-checked')).toBe('false');
  expect(peeks.disabled).toBe(true);
  done();
});

test('turning only the peeks off sends only that', async () => {
  const { container, done } = await show({});
  await act(async () => { t(container, 'profile-pip-peeks-toggle').click(); });
  expect(userAPI.updateMe).toHaveBeenCalledWith({ pip_peeks_enabled: false });
  done();
});

test('a failed save says so', async () => {
  userAPI.updateMe.mockRejectedValue(new Error('offline'));
  const { container, done } = await show({});
  await act(async () => { t(container, 'profile-pip-toggle').click(); });
  expect(t(container, 'profile-pip-error').textContent).toContain('Couldn’t save that.');
  done();
});

test('bare drops the card but keeps the switches', async () => {
  const { container, done } = await show({}, { bare: true });
  const wrap = t(container, 'profile-pip');
  expect(wrap.className).not.toContain('rounded-card');
  expect(wrap.querySelector('h3')).toBeNull();
  expect(t(container, 'profile-pip-toggle')).not.toBeNull();
  expect(t(container, 'profile-pip-peeks-toggle')).not.toBeNull();
  done();
});

test('a failed save offers Try again, which repeats the same change', async () => {
  userAPI.updateMe.mockRejectedValueOnce(new Error('offline'));
  const { container, done } = await show({});
  await act(async () => { t(container, 'profile-pip-toggle').click(); });
  expect(t(container, 'profile-pip-toggle').getAttribute('aria-describedby')).toContain('profile-pip-error');
  await act(async () => { t(container, 'profile-pip-error').querySelector('button').click(); });
  expect(userAPI.updateMe).toHaveBeenCalledTimes(2);
  expect(userAPI.updateMe).toHaveBeenLastCalledWith({ pip_enabled: false });
  expect(t(container, 'profile-pip-error')).toBeNull();
  done();
});

test('after a failed save the switch keeps its old value, and focus returns to it after a good retry', async () => {
  userAPI.updateMe.mockRejectedValueOnce(new Error('offline'));
  const { container, done } = await show({});
  await act(async () => { t(container, 'profile-pip-toggle').click(); });
  expect(t(container, 'profile-pip-toggle').getAttribute('aria-checked')).toBe('true');
  await act(async () => { t(container, 'profile-pip-error').querySelector('button').click(); });
  await act(async () => { await new Promise((r) => setTimeout(r, 5)); });
  expect(document.activeElement).toBe(t(container, 'profile-pip-toggle'));
  done();
});

test('the save error uses the dark-surface color, readable on the moss card', async () => {
  userAPI.updateMe.mockRejectedValue(new Error('offline'));
  const { container, done } = await show({});
  await act(async () => { t(container, 'profile-pip-toggle').click(); });
  expect(t(container, 'profile-pip-error').className).toContain('text-grove-blush');
  done();
});
