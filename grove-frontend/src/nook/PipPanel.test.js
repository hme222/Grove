import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import PipPanel from './PipPanel';
import { PALETTE } from './palette';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container;
let root;
let calls;
let clears;

const mediaQuery = (matches) => {
  window.matchMedia = () => ({ matches });
};
const mount = (props = {}) => act(() => root.render(<PipPanel {...props} />));
const canvas = () => container.querySelector('canvas');

beforeEach(() => {
  jest.useFakeTimers();
  calls = [];
  clears = 0;
  const ctx = {
    fillStyle: '',
    fillRect: (x, y, w, h) => calls.push({ x, y, w, h }),
    clearRect: () => {
      clears += 1;
    },
  };
  HTMLCanvasElement.prototype.getContext = () => ctx;
  mediaQuery(false);
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  jest.useRealTimers();
  HTMLCanvasElement.prototype.getContext = () => null;
  delete window.matchMedia;
});

test('draws Pip and labels the picture', () => {
  mount({ form: 'leafy', label: 'Pip, hosting this lesson' });
  expect(calls.length).toBeGreaterThan(0);
  expect(canvas().getAttribute('role')).toBe('img');
  expect(canvas().getAttribute('aria-label')).toBe('Pip, hosting this lesson');
});

test('the canvas is 15 wide and one pixel taller than the sprite, for the bob', () => {
  mount({ form: 'seed' });
  expect(canvas().width).toBe(15);
  expect(canvas().height).toBe(11);
  mount({ form: 'bloom' });
  expect(canvas().height).toBe(24);
});

test('scales the picture by the given whole number', () => {
  mount({ form: 'seed', scale: 3 });
  expect(canvas().style.width).toBe('45px');
  expect(canvas().style.height).toBe('33px');
});

test('holds still unless asked to animate', () => {
  mount({ form: 'seed' });
  const painted = clears;
  act(() => jest.advanceTimersByTime(6000));
  expect(clears).toBe(painted);
});

test('bobs for five seconds and then holds still', () => {
  mount({ form: 'seed', animate: true });
  const start = clears;
  act(() => jest.advanceTimersByTime(700));
  expect(clears).toBeGreaterThan(start);
  act(() => jest.advanceTimersByTime(4400));
  const settled = clears;
  act(() => jest.advanceTimersByTime(6000));
  expect(clears).toBe(settled);
});

test('does not move for people who prefer reduced motion', () => {
  mediaQuery(true);
  mount({ form: 'seed', animate: true });
  const painted = clears;
  act(() => jest.advanceTimersByTime(6000));
  expect(clears).toBe(painted);
});

test('renders without a drawing context and does not throw', () => {
  HTMLCanvasElement.prototype.getContext = () => null;
  expect(() => mount({ form: 'seed' })).not.toThrow();
});

test('the palette is the nook palette', () => {
  expect(PALETTE.k).toBe('#3B3A36');
});
