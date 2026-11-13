import React, { act } from 'react';
import { createRoot } from 'react-dom/client';

let mockUser = { id: 'u1' };
const mockUpdateUser = jest.fn();
jest.mock('../../contexts/AuthContext', () => ({ useAuth: () => ({ user: mockUser, updateUser: mockUpdateUser }) }));
jest.mock('../../lib/api', () => ({ userAPI: { updateMe: jest.fn() } }));
jest.mock('../../nook/PipPanel', () => ({ __esModule: true, default: () => <span data-testid="pip-sprite" /> }));

import PipIntroGate from './PipIntroGate';
import { userAPI } from '../../lib/api';
import { holdFirstRun } from '../../lib/firstRunGate';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let root; let container;
const mount = async () => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => { root.render(<PipIntroGate />); });
  await act(async () => {});
};
const el = (id) => document.querySelector(`[data-testid="${id}"]`);

beforeEach(() => {
  jest.clearAllMocks();
  mockUser = { id: 'u1' };
  userAPI.updateMe.mockResolvedValue({ data: { pip_introduced: true } });
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  document.body.querySelectorAll('[role="dialog"], input').forEach((n) => n.remove());
});

test('someone who has not met Pip gets the hello card, with focus on the main button', async () => {
  await mount();
  expect(el('pip-intro')).not.toBeNull();
  expect(document.body.textContent).toContain('Meet Pip');
  expect(document.activeElement).toBe(el('pip-intro-agree'));
});

test('nothing for someone who has already met him, or who turned him off', async () => {
  mockUser = { id: 'u1', pip_introduced: true };
  await mount();
  expect(el('pip-intro')).toBeNull();
  act(() => root.unmount()); container.remove();
  mockUser = { id: 'u1', pip_enabled: false };
  await mount();
  expect(el('pip-intro')).toBeNull();
});

test('Nice to meet you records the hello and the card goes away', async () => {
  await mount();
  await act(async () => { el('pip-intro-agree').click(); });
  expect(userAPI.updateMe).toHaveBeenCalledWith({ pip_introduced: true });
  expect(el('pip-intro')).toBeNull();
});

test('Turn me off records the hello and switches Pip off', async () => {
  await mount();
  await act(async () => { el('pip-intro-off').click(); });
  expect(userAPI.updateMe).toHaveBeenCalledWith({ pip_introduced: true, pip_enabled: false });
  expect(el('pip-intro')).toBeNull();
});

test('a failed save keeps the card and says so', async () => {
  userAPI.updateMe.mockRejectedValue(new Error('offline'));
  await mount();
  await act(async () => { el('pip-intro-agree').click(); });
  expect(el('pip-intro')).not.toBeNull();
  expect(el('pip-intro-error').textContent).toBe('Couldn’t save that. Try again.');
});

test('Escape counts as Nice to meet you', async () => {
  await mount();
  await act(async () => { el('pip-intro').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); });
  expect(userAPI.updateMe).toHaveBeenCalledWith({ pip_introduced: true });
});

test('it waits while a first-run layer is up, and shows once that clears', async () => {
  let release;
  act(() => { release = holdFirstRun(); });
  await mount();
  expect(el('pip-intro')).toBeNull();
  await act(async () => { release(); });
  expect(el('pip-intro')).not.toBeNull();
});
