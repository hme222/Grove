import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import WindowPickStep from './WindowPickStep';
import { lightAPI } from '../../lib/api';

jest.mock('../../lib/api', () => ({ lightAPI: { setWindow: jest.fn(), prompt: jest.fn() } }));

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container;
let root;
const q = (id) => container.querySelector(`[data-testid="${id}"]`);
const click = (id) => act(() => q(id).dispatchEvent(new MouseEvent('click', { bubbles: true })));
const flush = () => act(async () => {});
const mount = async () => {
  const next = jest.fn();
  const onSaved = jest.fn();
  await act(async () => {
    root.render(<WindowPickStep next={next} onSaved={onSaved} />);
  });
  return { next, onSaved };
};
const SUMMARY = { sun: 'afternoon', direction: 'W', draw_direction: 'W', view: 'open', hemisphere: 'north', season: 'summer', level: 'bright_direct', arrives: 'x', lamp: false };

beforeEach(() => {
  jest.clearAllMocks();
  lightAPI.setWindow.mockResolvedValue({ data: SUMMARY });
  lightAPI.prompt.mockResolvedValue({ data: {} });
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

test('picking a timing saves once with the defaults', async () => {
  const { next, onSaved } = await mount();
  click('pick-afternoon');
  click('pick-afternoon');
  await flush();
  expect(lightAPI.setWindow).toHaveBeenCalledTimes(1);
  expect(lightAPI.setWindow).toHaveBeenCalledWith({ sun: 'afternoon', view: 'open', hemisphere: 'north' });
  expect(onSaved).toHaveBeenCalledWith(SUMMARY);
  expect(next).toHaveBeenCalledTimes(1);
});

test('every timing saves its own value', async () => {
  for (const sun of ['morning', 'midday', 'none', 'nowindow']) {
    lightAPI.setWindow.mockClear();
    await mount();
    click(`pick-${sun}`);
    await flush();
    expect(lightAPI.setWindow.mock.calls[0][0].sun).toBe(sun);
  }
});

test('the view and hemisphere choices are sent, and show which is chosen', async () => {
  await mount();
  expect(q('view-open').getAttribute('aria-pressed')).toBe('true');
  expect(q('hemi-north').getAttribute('aria-pressed')).toBe('true');
  click('view-tree');
  click('hemi-south');
  expect(q('view-tree').getAttribute('aria-pressed')).toBe('true');
  expect(q('hemi-south').getAttribute('aria-pressed')).toBe('true');
  click('pick-midday');
  await flush();
  expect(lightAPI.setWindow).toHaveBeenCalledWith({ sun: 'midday', view: 'tree', hemisphere: 'south' });
});

test('the compass saves the exact direction and no timing', async () => {
  await mount();
  click('pick-compass');
  ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'].forEach((d) => expect(q(`dir-${d}`)).not.toBeNull());
  click('dir-SE');
  await flush();
  expect(lightAPI.setWindow).toHaveBeenCalledWith({ direction: 'SE', view: 'open', hemisphere: 'north' });
});

test('not sure shows the shadow test and saves nothing, and checking again returns', async () => {
  await mount();
  click('pick-unsure');
  expect(q('pick-shadow-help').textContent.toLowerCase()).toContain('crisp');
  expect(lightAPI.setWindow).not.toHaveBeenCalled();
  click('pick-recheck');
  expect(q('pick-afternoon')).not.toBeNull();
});

test('later leaves a prompt and moves on without saving', async () => {
  const { next } = await mount();
  click('pick-later');
  await flush();
  expect(lightAPI.prompt).toHaveBeenCalledWith('later');
  expect(lightAPI.setWindow).not.toHaveBeenCalled();
  expect(next).toHaveBeenCalledTimes(1);
});

test('a failed save stays with an error and can be tried again', async () => {
  lightAPI.setWindow.mockRejectedValueOnce(new Error('network'));
  const { next } = await mount();
  click('pick-midday');
  await flush();
  expect(q('pick-error').textContent).toBe('Could not save that. Try again.');
  expect(next).not.toHaveBeenCalled();
  click('pick-midday');
  await flush();
  expect(next).toHaveBeenCalledTimes(1);
});

test('every choice is a labelled button at least 44px tall', async () => {
  await mount();
  ['pick-morning', 'pick-midday', 'pick-afternoon', 'pick-none', 'pick-unsure', 'pick-nowindow', 'pick-compass', 'pick-later',
    'view-open', 'view-tree', 'view-building', 'hemi-north', 'hemi-south'].forEach((id) => {
    expect(q(id).tagName).toBe('BUTTON');
    expect(q(id).textContent.trim().length).toBeGreaterThan(0);
    expect(q(id).className).toContain('min-h-[44px]');
  });
});
