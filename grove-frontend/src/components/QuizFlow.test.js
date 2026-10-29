import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import QuizFlow from './QuizFlow';
import { lessonAPI } from '@/lib/api';
import { PLAN_QUESTIONS } from '../constants/onboardingQuiz';

jest.mock('@/lib/api', () => ({
  lessonAPI: { submitQuiz: jest.fn(), submitPlan: jest.fn() },
}));
jest.mock('react-router-dom', () => ({ useNavigate: () => jest.fn() }), { virtual: true });
jest.mock('@/components/PhotoBand', () => ({ __esModule: true, default: () => null, photoSrc: (s) => s }));

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const PAYLOAD = { primary_track: 'steady_sprout', queue: ['habit-stacking', 'soil-finger-test'] };

let container;
let root;

const q = (id) => container.querySelector(`[data-testid="${id}"]`);
const click = (el) => act(() => el.dispatchEvent(new MouseEvent('click', { bubbles: true })));
const flush = () => act(async () => { await new Promise((r) => setTimeout(r, 0)); });

const mount = async () => {
  const onDone = jest.fn();
  await act(async () => { root.render(<QuizFlow onDone={onDone} />); });
  return onDone;
};

beforeEach(() => {
  jest.clearAllMocks();
  lessonAPI.submitQuiz.mockResolvedValue({ data: {} });
  lessonAPI.submitPlan.mockResolvedValue({ data: PAYLOAD });
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

test('is a labeled modal dialog above the bottom nav, with no sign-up step counter', async () => {
  await mount();
  const dialog = q('quiz-flow');
  expect(dialog.getAttribute('role')).toBe('dialog');
  expect(dialog.getAttribute('aria-modal')).toBe('true');
  expect(dialog.className).toContain('z-celebration');
  expect(q('onboarding-progress')).toBeNull();
  expect(q('quiz-intro-skip')).not.toBeNull();
});

test('asks the same four questions as first run, with no step counter', async () => {
  await mount();
  await click(q('quiz-intro-start'));
  expect(q('question-count').textContent).toBe('Question 1 of 4');
  expect(q('onboarding-progress')).toBeNull();
  expect(container.textContent).toContain(PLAN_QUESTIONS[0].heading);
});

test('skipping the intro saves an empty quiz without waiting and reports skipped', async () => {
  const onDone = await mount();
  await click(q('quiz-intro-skip'));
  expect(lessonAPI.submitQuiz).toHaveBeenCalledWith([]);
  expect(onDone).toHaveBeenCalledWith({ skipped: true });
});

test('skipping still closes when the save fails', async () => {
  lessonAPI.submitQuiz.mockRejectedValueOnce(new Error('network'));
  const onDone = await mount();
  await click(q('quiz-intro-skip'));
  await flush();
  expect(onDone).toHaveBeenCalledTimes(1);
});

test('answering builds the plan and hands the result back', async () => {
  const onDone = await mount();
  await click(q('quiz-intro-start'));
  await click(q(`option-q1-${PLAN_QUESTIONS[0].options[0].id}`));
  await click(q('question-next'));
  for (let i = 0; i < 3; i += 1) await click(q('question-skip'));
  await flush();
  expect(lessonAPI.submitPlan).toHaveBeenCalledWith({ q1: PLAN_QUESTIONS[0].options[0].id });
  await act(async () => { await new Promise((r) => setTimeout(r, 2500)); });
  expect(onDone).toHaveBeenCalledWith(PAYLOAD);
});

test('Back from the first question returns to the intro', async () => {
  await mount();
  await click(q('quiz-intro-start'));
  await click(q('onboarding-back'));
  expect(q('quiz-intro-start')).not.toBeNull();
});
