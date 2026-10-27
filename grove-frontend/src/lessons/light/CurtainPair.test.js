import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import CurtainPair from './CurtainPair';
import { lessonView } from './lessonView';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container;
let root;
beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

test('shows both windows with their names and lines as text', () => {
  act(() => root.render(<CurtainPair />));
  const names = [...container.querySelectorAll('[role="img"]')].map((el) => el.getAttribute('aria-label'));
  expect(names).toEqual(['South window, no curtain', 'South window, sheer curtain']);
  expect(container.textContent).toContain('Direct. Sharp patch, strong light.');
  expect(container.textContent).toContain('Filtered, bright indirect. Soft patch, no scorch.');
});

test('a lesson room is bare: no Pip, and a plant on the table', () => {
  const view = lessonView({ draw_direction: 'S', season: 'summer', view: 'open', lamp: false });
  expect(view.pip).toBeNull();
  expect(view.hero).not.toBeNull();
  expect(view.unlocked).toEqual(['window', 'table', 'sill', 'floor']);
  expect(view.hideGhosts).toBe(true);
});


test('in the southern hemisphere the sunny window is the north one', () => {
  act(() => root.render(<CurtainPair hemisphere="south" />));
  const names = [...container.querySelectorAll('[role="img"]')].map((el) => el.getAttribute('aria-label'));
  expect(names).toEqual(['North window, no curtain', 'North window, sheer curtain']);
});
