import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { renderLightCard } from './steps';

jest.mock('../../lib/api', () => ({ lightAPI: { setReading: jest.fn(), prompt: jest.fn() } }));
jest.mock('./ShadowTestStep', () => ({
  __esModule: true,
  default: () => require('react').createElement('div', { 'data-testid': 'shadow-step' }, 'shadow'),
}));

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container;
let root;
const q = (id) => container.querySelector(`[data-testid="${id}"]`);
const show = (node) => act(() => root.render(node));
beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

const helpers = () => ({ next: jest.fn(), back: jest.fn(), index: 1, isLast: false });

test('a card without a step gets nothing, and neither does an unknown key', () => {
  expect(renderLightCard({ headline: 'x' }, helpers(), { user: {} })).toBeNull();
  expect(renderLightCard({ interactive: 'made-up' }, helpers(), { user: {} })).toBeNull();
});

test('the shadow-test card gets the shadow step', () => {
  show(renderLightCard({ interactive: 'shadow-test' }, helpers(), { user: {}, updateUser: jest.fn() }));
  expect(q('shadow-step')).not.toBeNull();
});

test('the reading note says what the saved shadow means, and moves on', () => {
  const h = helpers();
  show(renderLightCard({ interactive: 'reading-note', cta: 'Got it' }, h, { user: { light_reading: 'soft' } }));
  expect(q('reading-note').textContent).toBe('A soft shadow means bright indirect light on that spot.');
  act(() => q('step-next').dispatchEvent(new MouseEvent('click', { bubbles: true })));
  expect(h.next).toHaveBeenCalledTimes(1);
});

test('the reading note is silent when no shadow was saved, but still moves on', () => {
  const h = helpers();
  show(renderLightCard({ interactive: 'reading-note', cta: 'Got it' }, h, { user: {} }));
  expect(q('reading-note')).toBeNull();
  expect(q('step-next')).not.toBeNull();
});

test('the curtain card shows the pair and a next button', () => {
  const h = helpers();
  show(renderLightCard({ interactive: 'curtain', cta: 'Got it' }, h, { user: {} }));
  expect(container.querySelectorAll('[role="img"]')).toHaveLength(2);
  act(() => q('step-next').dispatchEvent(new MouseEvent('click', { bubbles: true })));
  expect(h.next).toHaveBeenCalledTimes(1);
});
