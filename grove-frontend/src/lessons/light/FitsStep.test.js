import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import FitsStep from './FitsStep';
import { lightAPI } from '../../lib/api';

jest.mock('../../lib/api', () => ({ lightAPI: { fits: jest.fn() } }));

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container;
let root;
const q = (id) => container.querySelector(`[data-testid="${id}"]`);
const flush = () => act(async () => {});
const mount = async (next = jest.fn()) => {
  await act(async () => {
    root.render(<FitsStep next={next} cta="Got it" />);
  });
  await flush();
  return next;
};

beforeEach(() => {
  jest.clearAllMocks();
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

test('plants are named with a kind line', async () => {
  lightAPI.fits.mockResolvedValue({
    data: {
      has_window: true, level: 'bright_direct', species: [],
      plants: [
        { id: 'p1', name: 'Pothos', suit: 'suits' },
        { id: 'p2', name: 'Jade', suit: 'prefers_brighter' },
        { id: 'p3', name: 'Fern', suit: 'prefers_dimmer' },
      ],
    },
  });
  await mount();
  const text = q('fits-plants').textContent;
  expect(text).toContain('Your Pothos suits this spot.');
  expect(text).toContain('Your Jade would like a sunnier spot.');
  expect(text).toContain('Your Fern would like a shadier spot.');
  expect(q('fits-species')).toBeNull();
});

test('with no plants it lists species as links to their pages', async () => {
  lightAPI.fits.mockResolvedValue({
    data: { has_window: true, level: 'low', plants: [], species: [{ id: 's1', slug: 'snake', common_name: 'Snake plant' }] },
  });
  await mount();
  const link = q('fits-species').querySelector('a');
  expect(link.textContent).toBe('Snake plant');
  expect(link.getAttribute('href')).toBe('/greenhouse/s1');
});

test('no window asks to pick first, and still moves on', async () => {
  lightAPI.fits.mockResolvedValue({ data: { has_window: false, level: null, plants: [], species: [] } });
  const next = await mount();
  expect(q('fits-none').textContent).toBe('Pick a window first and this will fill in.');
  act(() => q('step-next').dispatchEvent(new MouseEvent('click', { bubbles: true })));
  expect(next).toHaveBeenCalledTimes(1);
});

test('a failed load shows an error and still lets the person continue', async () => {
  lightAPI.fits.mockRejectedValue(new Error('network'));
  const next = await mount();
  expect(q('fits-error').getAttribute('role')).toBe('alert');
  act(() => q('step-next').dispatchEvent(new MouseEvent('click', { bubbles: true })));
  expect(next).toHaveBeenCalledTimes(1);
});

test('no numbers or scores appear', async () => {
  lightAPI.fits.mockResolvedValue({
    data: { has_window: true, level: 'medium', plants: [{ id: 'p1', name: 'Pothos', suit: 'suits' }], species: [{ id: 's1', slug: 'a', common_name: 'Aloe' }] },
  });
  await mount();
  expect(container.textContent).not.toMatch(/\d/);
});
