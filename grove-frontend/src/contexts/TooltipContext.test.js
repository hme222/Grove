import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { TooltipProvider, useTooltips } from './TooltipContext';
import { holdFirstRun } from '../lib/firstRunGate';

jest.mock('@/constants/tooltips', () => ({
  TOOLTIPS: [{ id: 't1', target: 'anchor', title: 'Tip', body: 'Body', position: 'top' }],
}), { virtual: true });
jest.mock('./AuthContext', () => ({ useAuth: () => ({ user: { created_at: new Date().toISOString() } }) }));
jest.mock('../lib/api', () => ({ userAPI: { dismissTooltip: jest.fn(), resetTooltips: jest.fn() } }));

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container;
let root;
let api;
function Probe() {
  api = useTooltips();
  return <button data-testid="anchor">anchor</button>;
}

beforeEach(() => {
  localStorage.clear();
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => root.render(<TooltipProvider><Probe /></TooltipProvider>));
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

test('a tip waits while the quiz or sign-up is open', () => {
  let release;
  act(() => { release = holdFirstRun(); });
  act(() => api.showTooltip('t1'));
  expect(document.querySelector('[data-testid="tooltip-t1"]')).toBeNull();
  act(() => release());
  act(() => api.showTooltip('t1'));
  expect(document.querySelector('[data-testid="tooltip-t1"]')).not.toBeNull();
});

test('a tip never opens over a dialog', () => {
  const dialog = document.createElement('div');
  dialog.setAttribute('role', 'dialog');
  document.body.appendChild(dialog);
  act(() => api.showTooltip('t1'));
  expect(document.querySelector('[data-testid="tooltip-t1"]')).toBeNull();
  dialog.remove();
});

test('the tip box stays inside the viewport when its target is at the left edge', () => {
  const anchor = document.querySelector('[data-testid="anchor"]');
  anchor.getBoundingClientRect = () => ({ left: 0, top: 200, width: 48, height: 44, bottom: 244, right: 48 });
  Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, get: () => 220 });
  act(() => api.showTooltip('t1'));
  const tip = document.querySelector('[data-testid="tooltip-t1"]');
  expect(parseFloat(tip.style.left)).toBeGreaterThanOrEqual(8);
  expect(tip.getAttribute('role')).toBe('status');
  delete HTMLElement.prototype.offsetWidth;
});

test('a tip waits while the welcome banner is up', () => {
  const banner = document.createElement('div');
  banner.setAttribute('data-testid', 'first-session-banner');
  document.body.appendChild(banner);
  act(() => api.showTooltip('t1'));
  expect(document.querySelector('[data-testid="tooltip-t1"]')).toBeNull();
  banner.remove();
});

test('a tip goes by itself and is remembered as seen', () => {
  jest.useFakeTimers();
  act(() => api.showTooltip('t1'));
  expect(document.querySelector('[data-testid="tooltip-t1"]')).not.toBeNull();
  act(() => jest.advanceTimersByTime(8100));
  expect(document.querySelector('[data-testid="tooltip-t1"]')).toBeNull();
  expect(JSON.parse(localStorage.getItem('grove_dismissed_tooltips'))).toContain('t1');
  jest.useRealTimers();
});

test('a tip is dropped when a first-run layer opens over it', () => {
  act(() => api.showTooltip('t1'));
  expect(document.querySelector('[data-testid="tooltip-t1"]')).not.toBeNull();
  let release;
  act(() => { release = holdFirstRun(); });
  expect(document.querySelector('[data-testid="tooltip-t1"]')).toBeNull();
  act(() => release());
});
