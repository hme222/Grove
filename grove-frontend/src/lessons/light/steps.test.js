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
  default: ({ onSaved, onLater, initialView, initialHemisphere }) =>
    require('react').createElement('div', { 'data-testid': 'pick-wrap' },
      require('react').createElement('button', {
        'data-testid': 'pick-mock',
        onClick: () => onSaved({ sun: 'midday', direction: 'S', view: 'tree', hemisphere: 'south' }),
      }, 'pick'),
      require('react').createElement('button', { 'data-testid': 'pick-later-mock', onClick: () => onLater() }, 'later'),
      require('react').createElement('span', { 'data-testid': 'pick-initial' }, `${initialView}-${initialHemisphere}`)),
}));
jest.mock('./WindowRoomStep', () => ({
  __esModule: true,
  default: ({ window }) => require('react').createElement('div', { 'data-testid': 'room-mock' }, window.direction),
}));
import { nookAPI } from '../../lib/api';
jest.mock('./ShadowTestStep', () => ({
  __esModule: true,
  default: ({ onSaved, onLater }) =>
    require('react').createElement('div', { 'data-testid': 'shadow-step' },
      require('react').createElement('button', { 'data-testid': 'shadow-saved', onClick: () => onSaved('crisp') }, 'saved'),
      require('react').createElement('button', { 'data-testid': 'shadow-later-mock', onClick: () => onLater() }, 'later')),
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
  expect(ctx.updateUser).toHaveBeenCalledWith({ window_sun: 'midday', window_view: 'tree', hemisphere: 'south', light_prompt_pending: false });
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


test('saving a shadow reading keeps the signed-in user in step and clears the pending prompt', () => {
  const ctx = { user: {}, updateUser: jest.fn() };
  show(renderLightCard({ interactive: 'shadow-test' }, helpers(), ctx));
  act(() => q('shadow-saved').dispatchEvent(new MouseEvent('click', { bubbles: true })));
  expect(ctx.updateUser).toHaveBeenCalledWith({ light_reading: 'crisp', light_prompt_pending: false });
});

test('later marks the prompt pending on the signed-in user, unless it was already dismissed', () => {
  const ctx = { user: {}, updateUser: jest.fn() };
  show(renderLightCard({ interactive: 'shadow-test' }, helpers(), ctx));
  act(() => q('shadow-later-mock').dispatchEvent(new MouseEvent('click', { bubbles: true })));
  expect(ctx.updateUser).toHaveBeenCalledWith({ light_prompt_pending: true });
  const dismissed = { user: { light_prompt_dismissed: true }, updateUser: jest.fn() };
  show(renderLightCard({ interactive: 'window-pick' }, helpers(), dismissed));
  act(() => q('pick-later-mock').dispatchEvent(new MouseEvent('click', { bubbles: true })));
  expect(dismissed.updateUser).not.toHaveBeenCalled();
  const fresh = { user: {}, updateUser: jest.fn() };
  show(renderLightCard({ interactive: 'window-pick' }, helpers(), fresh));
  act(() => q('pick-later-mock').dispatchEvent(new MouseEvent('click', { bubbles: true })));
  expect(fresh.updateUser).toHaveBeenCalledWith({ light_prompt_pending: true });
});

test('the window pick starts from the saved hemisphere and view', () => {
  show(renderLightCard({ interactive: 'window-pick' }, helpers(), { user: { hemisphere: 'south', window_view: 'tree' }, updateUser: jest.fn() }));
  expect(q('pick-initial').textContent).toBe('tree-south');
});

test('the curtain card is labeled for the person\'s hemisphere', () => {
  show(renderLightCard({ interactive: 'curtain', cta: 'Got it' }, helpers(), { user: { hemisphere: 'south' } }));
  expect([...container.querySelectorAll('[role="img"]')].map((el) => el.getAttribute('aria-label'))[0]).toBe('North window, no curtain');
});
