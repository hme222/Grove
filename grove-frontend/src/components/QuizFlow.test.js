import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import QuizFlow from './QuizFlow';
import { lessonAPI } from '../lib/api';
import { QUIZ_OPTIONS } from '../lessons/lessonMeta';

jest.mock('../lib/api', () => ({
  lessonAPI: { submitQuiz: jest.fn() },
}));

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const PAYLOAD = { primary_track: 'steady_sprout', queue: ['habit-stacking', 'soil-finger-test'] };

let container;
let root;

const q = (id) => container.querySelector(`[data-testid="${id}"]`);
const click = (el) => act(() => el.dispatchEvent(new MouseEvent('click', { bubbles: true })));
const flush = () => act(async () => {});

const mount = async (props = {}) => {
  const onDone = props.onDone || jest.fn();
  await act(async () => {
    root.render(<QuizFlow onDone={onDone} />);
  });
  return onDone;
};

beforeEach(() => {
  jest.clearAllMocks();
  lessonAPI.submitQuiz.mockResolvedValue({ data: PAYLOAD });
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

test('shows every option, none picked, with a way to skip', async () => {
  await mount();
  QUIZ_OPTIONS.forEach((option) => {
    const el = q(`quiz-option-${option.id}`);
    expect(el.textContent).toBe(option.label);
    expect(el.getAttribute('aria-checked')).toBe('false');
  });
  expect(q('quiz-skip')).not.toBeNull();
});

test('starting with nothing picked asks for a pick and sends nothing', async () => {
  const onDone = await mount();
  await click(q('quiz-start'));
  expect(q('quiz-error').textContent).toBe('Pick at least one, or skip for now.');
  expect(lessonAPI.submitQuiz).not.toHaveBeenCalled();
  expect(onDone).not.toHaveBeenCalled();
});

test('sends the picked answers in the order they were picked and reports the result', async () => {
  const onDone = await mount();
  await click(q('quiz-option-forget'));
  await click(q('quiz-option-overwater'));
  expect(q('quiz-option-forget').getAttribute('aria-checked')).toBe('true');
  await click(q('quiz-start'));
  await flush();
  expect(lessonAPI.submitQuiz).toHaveBeenCalledWith(['forget', 'overwater']);
  expect(onDone).toHaveBeenCalledWith(PAYLOAD);
});

test('tapping a picked option again unpicks it', async () => {
  await mount();
  await click(q('quiz-option-forget'));
  await click(q('quiz-option-overwater'));
  await click(q('quiz-option-forget'));
  expect(q('quiz-option-forget').getAttribute('aria-checked')).toBe('false');
  await click(q('quiz-start'));
  await flush();
  expect(lessonAPI.submitQuiz).toHaveBeenCalledWith(['overwater']);
});

test('skipping sends an empty list', async () => {
  const onDone = await mount();
  await click(q('quiz-skip'));
  await flush();
  expect(lessonAPI.submitQuiz).toHaveBeenCalledWith([]);
  expect(onDone).toHaveBeenCalledWith(PAYLOAD);
});

test('a failed save shows an error, keeps the picks, and can be retried', async () => {
  lessonAPI.submitQuiz.mockRejectedValueOnce(new Error('network'));
  const onDone = await mount();
  await click(q('quiz-option-forget'));
  await click(q('quiz-start'));
  await flush();
  expect(q('quiz-error').textContent).toBe('Couldn\u2019t save that. Try again.');
  expect(onDone).not.toHaveBeenCalled();
  expect(q('quiz-option-forget').getAttribute('aria-checked')).toBe('true');
  expect(q('quiz-start').getAttribute('aria-busy')).toBe('false');
  await click(q('quiz-start'));
  await flush();
  expect(onDone).toHaveBeenCalledWith(PAYLOAD);
});

test('the error clears on the next successful try', async () => {
  const onDone = await mount();
  await click(q('quiz-start'));
  expect(q('quiz-error')).not.toBeNull();
  await click(q('quiz-option-forget'));
  await click(q('quiz-start'));
  await flush();
  expect(q('quiz-error')).toBeNull();
  expect(onDone).toHaveBeenCalled();
});

const doubleClick = (el) =>
  act(async () => {
    el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });

test('a double tap on start sends the quiz once and finishes once', async () => {
  const onDone = await mount();
  await click(q('quiz-option-forget'));
  await doubleClick(q('quiz-start'));
  await flush();
  expect(lessonAPI.submitQuiz).toHaveBeenCalledTimes(1);
  expect(onDone).toHaveBeenCalledTimes(1);
});

test('a double tap on skip sends once', async () => {
  const onDone = await mount();
  await doubleClick(q('quiz-skip'));
  await flush();
  expect(lessonAPI.submitQuiz).toHaveBeenCalledTimes(1);
  expect(onDone).toHaveBeenCalledTimes(1);
});

test('is a labeled modal dialog that takes focus and sits above the bottom nav', async () => {
  await mount();
  const dialog = q('quiz-flow');
  const heading = container.querySelector('h1');
  expect(dialog.getAttribute('role')).toBe('dialog');
  expect(dialog.getAttribute('aria-modal')).toBe('true');
  expect(heading.id).not.toBe('');
  expect(dialog.getAttribute('aria-labelledby')).toBe(heading.id);
  expect(document.activeElement).toBe(heading);
  expect(dialog.className).toContain('z-celebration');
});
