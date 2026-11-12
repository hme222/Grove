import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import LessonCompleteCelebration from './LessonCompleteCelebration';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const show = async (props) => {
  const onGo = jest.fn();
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => { root.render(<LessonCompleteCelebration open lesson={{ title: 'Plant ER' }} onGo={onGo} {...props} />); });
  return { onGo, done: () => { act(() => root.unmount()); container.remove(); } };
};
const el = (id) => document.querySelector(`[data-testid="${id}"]`);

test('names the lesson, and focus lands on the main button', async () => {
  const { done } = await show({ next: { id: 'habit-stacking', title: 'Habit stacking' } });
  expect(document.body.textContent).toContain('You finished Plant ER');
  expect(document.activeElement).toBe(el('lesson-complete-cta'));
  done();
});

test('offers the next lesson, with a way back to the list', async () => {
  const { onGo, done } = await show({ next: { id: 'habit-stacking', title: 'Habit stacking' } });
  expect(el('lesson-complete-cta').textContent).toBe('Next: Habit stacking');
  await act(async () => { el('lesson-complete-cta').click(); });
  expect(onGo).toHaveBeenCalledWith('/lessons/habit-stacking');
  await act(async () => { el('lesson-complete-list').click(); });
  expect(onGo).toHaveBeenLastCalledWith('/lessons');
  done();
});

test('a lesson with its own try-it step sends the main button there', async () => {
  const { onGo, done } = await show({ action: { to: '/care/today', cta: 'Open Today' }, next: { id: 'x', title: 'X' } });
  expect(el('lesson-complete-cta').textContent).toBe('Open Today');
  await act(async () => { el('lesson-complete-cta').click(); });
  expect(onGo).toHaveBeenCalledWith('/care/today');
  done();
});

test('with nothing next, the only button returns to the list', async () => {
  const { onGo, done } = await show({});
  expect(el('lesson-complete-cta').textContent).toBe('Back to lessons');
  expect(el('lesson-complete-list')).toBeNull();
  await act(async () => { el('lesson-complete-cta').click(); });
  expect(onGo).toHaveBeenCalledWith('/lessons');
  done();
});

test('Escape goes where the main button would', async () => {
  const { onGo, done } = await show({ next: { id: 'habit-stacking', title: 'Habit stacking' } });
  await act(async () => { el('lesson-complete').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); });
  expect(onGo).toHaveBeenCalledWith('/lessons/habit-stacking');
  done();
});

test('closed, it renders nothing', async () => {
  const { done } = await show({ open: false });
  expect(el('lesson-complete')).toBeNull();
  done();
});
