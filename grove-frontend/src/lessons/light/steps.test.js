import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { renderLightCard } from './steps';

jest.mock('../../lib/api', () => ({
  lightAPI: { setReading: jest.fn(), prompt: jest.fn() },
  nookAPI: { state: jest.fn() },
}));
jest.mock('./FitsStep', () => ({
  __esModule: true,
  default: ({ cta }) => require('react').createElement('div', { 'data-testid': 'fits-mock' }, cta),
}));
jest.mock('./ClosingStep', () => ({
  __esModule: true,
  default: ({ nookOn, picked, markDone }) =>
    require('react').createElement('div', { 'data-testid': 'closing-mock' }, `${nookOn}-${picked ? picked.direction : 'none'}`, markDone),
}));
jest.mock('./WindowPickStep', () => ({
  __esModule: true,
  default: ({ onSaved }) =>
    require('react').createElement('button', {
      'data-testid': 'pick-mock',
      onClick: () => onSaved({ sun: 'midday', direction: 'S', view: 'tree', hemisphere: 'south' }),
    }, 'pick'),
}));
jest.mock('./WindowRoomStep', () => ({
  __esModule: true,
  default: ({ window }) => require('react').createElement('div', { 'data-testid': 'room-mock' }, window.direction),
}));
import { nookAPI } from '../../lib/api';
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

const flush = () => act(async () => {});

test('the window pick step remembers the pick for the room and for the signed-in user', () => {
  const ctx = { user: {}, updateUser: jest.fn(), setWindow: jest.fn() };
  show(renderLightCard({ interactive: 'window-pick' }, helpers(), ctx));
  act(() => q('pick-mock').dispatchEvent(new MouseEvent('click', { bubbles: true })));
  expect(ctx.setWindow).toHaveBeenCalledWith({ sun: 'midday', direction: 'S', view: 'tree', hemisphere: 'south' });
  expect(ctx.updateUser).toHaveBeenCalledWith({ window_sun: 'midday', window_view: 'tree', hemisphere: 'south' });
});

test('the room card uses the window picked in this visit', async () => {
  show(renderLightCard({ interactive: 'window-room', cta: 'Got it' }, helpers(), { user: {}, window: { direction: 'SW' } }));
  await flush();
  expect(q('room-mock').textContent).toBe('SW');
  expect(nookAPI.state).not.toHaveBeenCalled();
  expect(q('step-next')).not.toBeNull();
});

test('the room card loads the saved window when the lesson was resumed', async () => {
  nookAPI.state.mockResolvedValue({ data: { window: { direction: 'E' } } });
  show(renderLightCard({ interactive: 'window-room', cta: 'Got it' }, helpers(), { user: {}, window: null }));
  await flush();
  expect(q('room-mock').textContent).toBe('E');
});

test('with no window saved the room card says to pick one first, and still moves on', async () => {
  nookAPI.state.mockResolvedValue({ data: { window: null } });
  const h = helpers();
  show(renderLightCard({ interactive: 'window-room', cta: 'Got it' }, h, { user: {}, window: null }));
  await flush();
  expect(q('room-none').textContent).toBe('Pick your window first and this will fill in.');
  act(() => q('step-next').dispatchEvent(new MouseEvent('click', { bubbles: true })));
  expect(h.next).toHaveBeenCalledTimes(1);
});

test('the room card still moves on if the saved window cannot be loaded', async () => {
  nookAPI.state.mockRejectedValue(new Error('network'));
  show(renderLightCard({ interactive: 'window-room', cta: 'Got it' }, helpers(), { user: {}, window: null }));
  await flush();
  expect(q('room-none')).not.toBeNull();
  expect(q('step-next')).not.toBeNull();
});

test('the fits card gets the fits step with its button text', () => {
  show(renderLightCard({ interactive: 'fits', cta: 'Got it' }, helpers(), { user: {} }));
  expect(q('fits-mock').textContent).toBe('Got it');
});

test('the closing card gets the ending, the picked window, and the lesson finish control', () => {
  const ctx = {
    user: {}, nookOn: true, window: { direction: 'S' },
    renderMarkDone: () => React.createElement('span', { 'data-testid': 'md' }, 'finish'),
  };
  show(renderLightCard({ interactive: 'closing' }, helpers(), ctx));
  expect(q('closing-mock').textContent).toBe('true-Sfinish');
});

test('the closing card copes with no window picked and no finish control given', () => {
  show(renderLightCard({ interactive: 'closing' }, helpers(), { user: {}, nookOn: false, window: null }));
  expect(q('closing-mock').textContent).toBe('false-none');
});
