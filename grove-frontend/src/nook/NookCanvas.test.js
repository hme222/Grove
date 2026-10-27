import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import NookCanvas from './NookCanvas';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const VIEW = {
  unlocked: ['window', 'table', 'sill', 'floor'],
  pip: { form: 'seed', location: 'sill', mood: 'calm' },
  hero: null,
  readiness: null,
  shelfPlants: [],
};

let container;
let root;
let calls;

const install = () => {
  calls = [];
  const ctx = { fillStyle: '', fillRect: (...args) => calls.push(args) };
  HTMLCanvasElement.prototype.getContext = () => ctx;
};

const mount = (props = {}) => act(() => root.render(<NookCanvas view={VIEW} label="Pip's nook" {...props} />));
const canvas = () => container.querySelector('canvas');
const mediaQuery = (matches) => {
  window.matchMedia = () => ({ matches });
};

beforeEach(() => {
  jest.useFakeTimers();
  install();
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

test('draws the nook on mount and describes it for screen readers', () => {
  mount();
  expect(calls.length).toBeGreaterThan(0);
  expect(canvas().getAttribute('role')).toBe('img');
  expect(canvas().getAttribute('aria-label')).toBe("Pip's nook");
  expect(canvas().width).toBe(128);
  expect(canvas().height).toBe(80);
});

const setWidth = (width) => {
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => width });
};
const setDpr = (dpr) => {
  window.devicePixelRatio = dpr;
};

afterEach(() => {
  delete HTMLElement.prototype.clientWidth;
  delete window.devicePixelRatio;
});

test('fills the full width of its container with a canvas of the same aspect ratio', () => {
  setWidth(390);
  mount();
  expect(canvas().className).toMatch(/\bw-full\b/);
  expect(canvas().className).toMatch(/object-cover/);
  expect(canvas().style.imageRendering).toBe('pixelated');
  expect(canvas().style.aspectRatio.replace(/\s/g, '')).toBe('128/80');
  // The picture is never sized in fixed pixels, so no blank strip can be left beside it.
  expect(canvas().style.width).toBe('');
});

test.each([
  [320, 1, 2],
  [390, 1, 3],
  [500, 1, 3],
  [320, 2, 5],
  [390, 2, 6],
  [500, 2, 7],
])('at %ipx wide and %ix density the backing canvas is drawn at %ix', (width, dpr, scale) => {
  setWidth(width);
  setDpr(dpr);
  mount();
  expect(canvas().dataset.scale).toBe(String(scale));
  expect(canvas().width).toBe(128 * scale);
  expect(canvas().height).toBe(80 * scale);
});

test('draws in room pixels through a scale transform so drawRoom needs no change', () => {
  setWidth(390);
  const transforms = [];
  HTMLCanvasElement.prototype.getContext = () => ({ fillStyle: '', fillRect: () => {}, setTransform: (...args) => transforms.push(args) });
  mount();
  expect(transforms[transforms.length - 1]).toEqual([3, 0, 0, 3, 0, 0]);
});

test('an explicit scale fixes the width, for small pictures', () => {
  mount({ scale: 1 });
  expect(canvas().parentElement.style.width).toBe('128px');
  expect(canvas().width).toBe(128);
  expect(canvas().height).toBe(80);
});

test('redraws every 700ms so Pip can bob', () => {
  mount();
  const first = calls.length;
  act(() => jest.advanceTimersByTime(700));
  expect(calls.length).toBeGreaterThan(first);
});

test('does not move when animation is off', () => {
  mount({ animate: false });
  const first = calls.length;
  act(() => jest.advanceTimersByTime(3000));
  expect(calls.length).toBe(first);
});

test('does not move for people who prefer reduced motion', () => {
  mediaQuery(true);
  mount();
  const first = calls.length;
  act(() => jest.advanceTimersByTime(3000));
  expect(calls.length).toBe(first);
});

test('stops redrawing after it is removed', () => {
  mount();
  act(() => root.render(null));
  const after = calls.length;
  act(() => jest.advanceTimersByTime(3000));
  expect(calls.length).toBe(after);
});

test('renders without a drawing context and does not throw', () => {
  HTMLCanvasElement.prototype.getContext = () => null;
  expect(() => mount()).not.toThrow();
  expect(canvas()).not.toBeNull();
});
