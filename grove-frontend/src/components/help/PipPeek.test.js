import React, { act } from 'react';
import { createRoot } from 'react-dom/client';

let mockPath = '/plants';
jest.mock('react-router-dom', () => ({ useLocation: () => ({ pathname: mockPath }) }), { virtual: true });
let mockUser = { id: 'u1', pip_introduced: true };
jest.mock('../../contexts/AuthContext', () => ({ useAuth: () => ({ user: mockUser, updateUser: jest.fn() }) }));
jest.mock('../../lib/api', () => ({ careAPI: { getDueToday: jest.fn() }, userAPI: { updateMe: jest.fn() } }));
jest.mock('../../nook/PipPanel', () => ({ __esModule: true, default: () => <span data-testid="pip-sprite" /> }));
jest.mock('../../nook/usePipForm', () => ({ usePipForm: () => 'seed' }));

import PipPeek from './PipPeek';
import { HelpSheetContext } from './helpSheetContext';
import { careAPI, userAPI } from '../../lib/api';
import { holdFirstRun } from '../../lib/firstRunGate';
import { resetPipNudges, bumpDismissCount, markFirstPeekSeen, markBubbleShown } from '../../lib/pipNudges';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const overdue = (id, name, days) => ({ id, nickname: name, next_water_due: new Date(Date.now() - days * 86400000 - 5000).toISOString() });
const open = jest.fn();
let root; let container;

const render = async () => {
  await act(async () => {
    root.render(<HelpSheetContext.Provider value={{ open }}><PipPeek /></HelpSheetContext.Provider>);
  });
  await act(async () => {});
};
const mount = async () => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  await render();
};
const el = (id) => container.querySelector(`[data-testid="${id}"]`);
const click = (node) => act(async () => { node.click(); });

beforeEach(() => {
  jest.clearAllMocks();
  resetPipNudges();
  mockPath = '/plants';
  mockUser = { id: 'u1', pip_introduced: true };
  careAPI.getDueToday.mockResolvedValue({ data: [overdue('a', 'Pothos', 1), overdue('b', 'Monty', 3)] });
  userAPI.updateMe.mockResolvedValue({ data: {} });
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  document.body.querySelectorAll('[role="dialog"], input').forEach((n) => n.remove());
});

test('shows nothing, and asks nothing, when the peeks are off', async () => {
  mockUser = { id: 'u1', pip_introduced: true, pip_peeks_enabled: false };
  await mount();
  expect(el('pip-peek')).toBeNull();
  expect(careAPI.getDueToday).not.toHaveBeenCalled();
});

test('shows nothing, and asks nothing, until Pip has said hello', async () => {
  mockUser = { id: 'u1' };
  await mount();
  expect(el('pip-peek')).toBeNull();
  expect(careAPI.getDueToday).not.toHaveBeenCalled();
});

test('shows nothing when the due list cannot be loaded', async () => {
  careAPI.getDueToday.mockRejectedValue(new Error('offline'));
  await mount();
  expect(el('pip-peek')).toBeNull();
});

test('names the most overdue plant, states a fact, and never takes focus', async () => {
  await mount();
  expect(el('pip-bubble-text').textContent).toBe('Monty is 3 days overdue. Want a quick check?');
  expect(container.contains(document.activeElement)).toBe(false);
  expect(container.querySelector('[role="status"]').textContent).toContain('Monty is 3 days overdue');
});

test('Help me check opens the sheet and leaves just his head', async () => {
  await mount();
  await click(el('pip-help'));
  expect(open).toHaveBeenCalledTimes(1);
  expect(el('pip-bubble')).toBeNull();
  expect(el('pip-head')).not.toBeNull();
});

test('Not now hides that plant for the day, even after moving to another tab', async () => {
  careAPI.getDueToday.mockResolvedValue({ data: [overdue('b', 'Monty', 3)] });
  await mount();
  await click(el('pip-not-now'));
  expect(el('pip-peek')).toBeNull();
  mockPath = '/greenhouse';
  await render();
  expect(el('pip-peek')).toBeNull();
});

test('a swipe toward the edge does the same as Not now', async () => {
  careAPI.getDueToday.mockResolvedValue({ data: [overdue('b', 'Monty', 3)] });
  await mount();
  const head = el('pip-head');
  await act(async () => { head.dispatchEvent(Object.assign(new Event('pointerdown', { bubbles: true }), { clientX: 10 })); });
  await act(async () => { head.dispatchEvent(Object.assign(new Event('pointerup', { bubbles: true }), { clientX: 90 })); });
  expect(el('pip-peek')).toBeNull();
});

test('the first peek mentions the swipe; once seen, it does not', async () => {
  await mount();
  expect(el('pip-swipe-hint')).not.toBeNull();
  act(() => root.unmount()); container.remove();
  resetPipNudges();
  markFirstPeekSeen();
  await mount();
  expect(el('pip-swipe-hint')).toBeNull();
});

test('a later visit the same day shows only his head, not the bubble again', async () => {
  markBubbleShown('b');
  await mount();
  expect(el('pip-bubble')).toBeNull();
  expect(el('pip-head')).not.toBeNull();
});

test('stays hidden while a dialog is open, while a field has focus, and while a first-run layer is up', async () => {
  const dialog = document.createElement('div');
  dialog.setAttribute('role', 'dialog');
  document.body.appendChild(dialog);
  await mount();
  expect(el('pip-peek')).toBeNull();
  dialog.remove();
  await act(async () => {});
  expect(el('pip-peek')).not.toBeNull();

  const input = document.createElement('input');
  document.body.appendChild(input);
  await act(async () => { input.focus(); });
  expect(el('pip-peek')).toBeNull();
  await act(async () => { input.blur(); });
  expect(el('pip-peek')).not.toBeNull();

  let release;
  await act(async () => { release = holdFirstRun(); });
  expect(el('pip-peek')).toBeNull();
  await act(async () => { release(); });
  expect(el('pip-peek')).not.toBeNull();
});

test('stays out of the way on the help page itself', async () => {
  mockPath = '/help-my-plant';
  await mount();
  expect(el('pip-peek')).toBeNull();
});

test('the third Not now asks once whether to stop, and Yes turns the peeks off', async () => {
  bumpDismissCount(); bumpDismissCount();
  await mount();
  await click(el('pip-not-now'));
  expect(el('pip-bubble').textContent).toContain('Want me to stop popping in?');
  await click(el('pip-stop-yes'));
  expect(userAPI.updateMe).toHaveBeenCalledWith({ pip_peeks_enabled: false });
  expect(el('pip-peek')).toBeNull();
});

test('if turning the peeks off fails, it says so and stays', async () => {
  userAPI.updateMe.mockRejectedValue(new Error('offline'));
  bumpDismissCount(); bumpDismissCount();
  await mount();
  await click(el('pip-not-now'));
  await click(el('pip-stop-yes'));
  expect(container.querySelector('[role="alert"]').textContent).toContain('turn it off in Profile');
  expect(el('pip-bubble')).not.toBeNull();
});
