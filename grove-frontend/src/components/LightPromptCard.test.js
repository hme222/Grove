import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import LightPromptCard from './LightPromptCard';
import { lightAPI } from '../lib/api';

jest.mock('../lib/api', () => ({ lightAPI: { prompt: jest.fn() } }));

let mockUser = {};
const mockUpdateUser = jest.fn();
jest.mock('../contexts/AuthContext', () => ({ useAuth: () => ({ user: mockUser, updateUser: mockUpdateUser }) }));

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({ useNavigate: () => mockNavigate }), { virtual: true });

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container;
let root;
const q = (id) => container.querySelector(`[data-testid="${id}"]`);
const click = (el) => act(() => el.dispatchEvent(new MouseEvent('click', { bubbles: true })));
const flush = () => act(async () => {});
const at = (hour, minute = 0) => new Date(2026, 9, 20, hour, minute);
const mount = async (now = at(12)) => {
  await act(async () => {
    root.render(<LightPromptCard now={now} />);
  });
};

beforeEach(() => {
  jest.clearAllMocks();
  mockUser = { light_prompt_pending: true };
  lightAPI.prompt.mockResolvedValue({ data: {} });
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

test.each([
  [at(11, 0), true],
  [at(14, 59), true],
  [at(10, 59), false],
  [at(15, 0), false],
  [at(0, 0), false],
])('shows only around midday (%s → %s)', async (now, shown) => {
  await mount(now);
  expect(!!q('light-prompt')).toBe(shown);
});

test('hidden when nothing is pending, or once dismissed', async () => {
  mockUser = { light_prompt_pending: false };
  await mount();
  expect(q('light-prompt')).toBeNull();
  mockUser = { light_prompt_pending: true, light_prompt_dismissed: true };
  await mount();
  expect(q('light-prompt')).toBeNull();
  mockUser = null;
  await mount();
  expect(q('light-prompt')).toBeNull();
});

test('check now goes to the lesson where they left off', async () => {
  await mount();
  await click(q('light-prompt-go'));
  expect(mockNavigate).toHaveBeenLastCalledWith('/lessons/light-basics');
  mockUser = { light_prompt_pending: true, window_sun: 'midday' };
  await mount();
  await click(q('light-prompt-go'));
  expect(mockNavigate).toHaveBeenLastCalledWith('/lessons/window-map');
  mockUser = { light_prompt_pending: true, light_reading: 'soft' };
  await mount();
  await click(q('light-prompt-go'));
  expect(mockNavigate).toHaveBeenLastCalledWith('/lessons/window-map');
});

test('not today dismisses once and hides the card', async () => {
  await mount();
  const button = q('light-prompt-dismiss');
  act(() => {
    button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
  await flush();
  expect(lightAPI.prompt).toHaveBeenCalledTimes(1);
  expect(lightAPI.prompt).toHaveBeenCalledWith('dismiss');
  expect(mockUpdateUser).toHaveBeenCalledWith({ light_prompt_pending: false, light_prompt_dismissed: true });
  expect(q('light-prompt')).toBeNull();
});

test('a failed dismiss still hides the card for now', async () => {
  lightAPI.prompt.mockRejectedValue(new Error('network'));
  await mount();
  await click(q('light-prompt-dismiss'));
  await flush();
  expect(q('light-prompt')).toBeNull();
});

test('both buttons are labelled and at least 44px tall', async () => {
  await mount();
  ['light-prompt-go', 'light-prompt-dismiss'].forEach((id) => {
    expect(q(id).textContent.trim().length).toBeGreaterThan(0);
    expect(q(id).className).toContain('min-h-[44px]');
  });
});
