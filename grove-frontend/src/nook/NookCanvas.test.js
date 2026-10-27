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

test('scales by whole numbers, two times at least', () => {
  mount();
  expect(canvas().dataset.scale).toBe('2');
  expect(canvas().style.width).toBe('256px');
  expect(canvas().style.height).toBe('160px');
});

test('an explicit scale is used as given, for small pictures', () => {
  mount({ scale: 1 });
  expect(canvas().style.width).toBe('128px');
  expect(canvas().style.height).toBe('80px');
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
