import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import NookOfferCard from './NookOfferCard';
import { nookAPI } from '../lib/api';

jest.mock('../lib/api', () => ({ nookAPI: { settings: jest.fn() } }));

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const SAVED = { nook_enabled: true, nook_offered_at: '2026-10-14T10:00:00Z', nook_hero_plant_id: null };

let container;
let root;

const q = (id) => container.querySelector(`[data-testid="${id}"]`);
const click = (el) => act(() => el.dispatchEvent(new MouseEvent('click', { bubbles: true })));
const flush = () => act(async () => {});
const mount = async () => {
  const onDone = jest.fn();
  await act(async () => {
    root.render(<NookOfferCard onDone={onDone} />);
  });
  return onDone;
};

beforeEach(() => {
  jest.clearAllMocks();
  nookAPI.settings.mockResolvedValue({ data: SAVED });
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

test('is a labeled dialog that takes focus and sits below the first-care celebration', async () => {
  await mount();
  const dialog = q('nook-offer');
  const heading = container.querySelector('h1');
  expect(dialog.getAttribute('role')).toBe('dialog');
  expect(dialog.getAttribute('aria-modal')).toBe('true');
  expect(dialog.getAttribute('aria-labelledby')).toBe(heading.id);
  expect(document.activeElement).toBe(heading);
  expect(dialog.className).toContain('z-intro');
});

test('says what the nook is and that it is optional and never scores plants', async () => {
  await mount();
  expect(container.textContent).toContain('Optional: a small pixel nook that grows as you learn.');
  expect(container.textContent).toContain('It never scores your plants.');
  expect(container.textContent).toContain('You can change this any time in your profile.');
  expect(container.querySelector('canvas')).not.toBeNull();
});

test('yes turns the nook on and reports what was saved', async () => {
  const onDone = await mount();
  await click(q('nook-offer-yes'));
  await flush();
  expect(nookAPI.settings).toHaveBeenCalledWith({ enabled: true });
  expect(onDone).toHaveBeenCalledWith(SAVED);
});

test('not now is saved as an answer too, so the offer is never repeated', async () => {
  const onDone = await mount();
  await click(q('nook-offer-no'));
  await flush();
  expect(nookAPI.settings).toHaveBeenCalledWith({ enabled: false });
  expect(onDone).toHaveBeenCalledTimes(1);
});

test('a double tap saves once', async () => {
  const onDone = await mount();
  await act(async () => {
    const button = q('nook-offer-yes');
    button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
  await flush();
  expect(nookAPI.settings).toHaveBeenCalledTimes(1);
  expect(onDone).toHaveBeenCalledTimes(1);
});

test('a failed save shows a plain error and can be tried again', async () => {
  nookAPI.settings.mockRejectedValueOnce(new Error('network'));
  const onDone = await mount();
  await click(q('nook-offer-yes'));
  await flush();
  expect(q('nook-offer-error').textContent).toBe('Could not save that. Try again.');
  expect(onDone).not.toHaveBeenCalled();
  await click(q('nook-offer-yes'));
  await flush();
  expect(onDone).toHaveBeenCalledWith(SAVED);
});
