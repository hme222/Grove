import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import ShadowTestStep from './ShadowTestStep';
import { lightAPI } from '../../lib/api';

jest.mock('../../lib/api', () => ({ lightAPI: { setReading: jest.fn(), prompt: jest.fn() } }));

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container;
let root;
const q = (id) => container.querySelector(`[data-testid="${id}"]`);
const click = (el) => act(() => el.dispatchEvent(new MouseEvent('click', { bubbles: true })));
const flush = () => act(async () => {});
const mount = async (props) => {
  const next = jest.fn();
  const onSaved = jest.fn();
  const onLater = jest.fn();
  await act(async () => {
    root.render(<ShadowTestStep next={next} onSaved={onSaved} onLater={onLater} {...props} />);
  });
  return { next, onSaved, onLater };
};

beforeEach(() => {
  jest.clearAllMocks();
  lightAPI.setReading.mockResolvedValue({ data: {} });
  lightAPI.prompt.mockResolvedValue({ data: {} });
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

test('choosing a reading saves it once and moves on', async () => {
  const { next, onSaved } = await mount();
  click(q('shadow-crisp'));
  click(q('shadow-crisp'));
  await flush();
  expect(lightAPI.setReading).toHaveBeenCalledTimes(1);
  expect(lightAPI.setReading).toHaveBeenCalledWith('crisp');
  expect(onSaved).toHaveBeenCalledWith('crisp');
  expect(next).toHaveBeenCalledTimes(1);
});

test('each reading saves its own value', async () => {
  for (const reading of ['soft', 'faint']) {
    lightAPI.setReading.mockClear();
    await mount();
    click(q(`shadow-${reading}`));
    await flush();
    expect(lightAPI.setReading).toHaveBeenCalledWith(reading);
  }
});

test('later leaves a prompt and moves on without saving a reading', async () => {
  const { next } = await mount();
  click(q('shadow-later'));
  await flush();
  expect(lightAPI.prompt).toHaveBeenCalledWith('later');
  expect(lightAPI.setReading).not.toHaveBeenCalled();
  expect(next).toHaveBeenCalledTimes(1);
});

test('a failed save shows an error, stays on the card, and can be tried again', async () => {
  lightAPI.setReading.mockRejectedValueOnce(new Error('network'));
  const { next } = await mount();
  click(q('shadow-soft'));
  await flush();
  expect(q('shadow-error').textContent).toBe('Could not save that. Try again.');
  expect(q('shadow-error').getAttribute('role')).toBe('alert');
  expect(next).not.toHaveBeenCalled();
  click(q('shadow-soft'));
  await flush();
  expect(next).toHaveBeenCalledTimes(1);
});

test('a failed later still lets the person move on', async () => {
  lightAPI.prompt.mockRejectedValue(new Error('network'));
  const { next } = await mount();
  click(q('shadow-later'));
  await flush();
  expect(next).toHaveBeenCalledTimes(1);
});

test('every choice is a labeled button at least 44px tall', async () => {
  await mount();
  ['shadow-crisp', 'shadow-soft', 'shadow-faint', 'shadow-later'].forEach((id) => {
    expect(q(id).tagName).toBe('BUTTON');
    expect(q(id).textContent.trim().length).toBeGreaterThan(0);
    expect(q(id).className).toContain('min-h-touch');
  });
});


test('later tells the page the prompt is pending, but only when it was saved', async () => {
  const { onLater } = await mount();
  click(q('shadow-later'));
  await flush();
  expect(onLater).toHaveBeenCalledTimes(1);
  lightAPI.prompt.mockRejectedValue(new Error('network'));
  const second = await mount();
  click(q('shadow-later'));
  await flush();
  expect(second.onLater).not.toHaveBeenCalled();
});
