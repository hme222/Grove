import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import LessonPlayer from './LessonPlayer';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const CARDS = [
  { header: 'Card 1 of 2', headline: 'First headline', body: 'Body one with <strong>bold</strong>.', cta: 'Got it &mdash; next' },
  { header: 'Card 2 of 2', headline: 'North &amp; south', body: 'Body two.', cta: 'Finish' },
];

let container;
let root;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

const render = (props) => act(() => root.render(<LessonPlayer cards={CARDS} onExit={() => {}} {...props} />));
const q = (id) => container.querySelector(`[data-testid="${id}"]`);
const click = (id) => act(() => q(id).dispatchEvent(new MouseEvent('click', { bubbles: true })));

test('shows the first card with its progress', () => {
  render();
  expect(q('lesson-headline').textContent).toBe('First headline');
  expect(q('lesson-progress').textContent).toBe('Card 1 of 2');
  expect(q('lesson-back')).toBeNull();
});

test('renders simple HTML in card text as real markup', () => {
  render();
  expect(container.querySelector('strong').textContent).toBe('bold');
  expect(q('lesson-next').textContent).toContain('Got it — next');
});

test('next moves to the second card and back returns', () => {
  render();
  click('lesson-next');
  expect(q('lesson-headline').textContent).toBe('North & south');
  expect(q('lesson-progress').textContent).toBe('Card 2 of 2');
  click('lesson-back');
  expect(q('lesson-headline').textContent).toBe('First headline');
});

test('the last card shows the final card instead of a next button', () => {
  render({ renderFinalCard: () => <div data-testid="final-card">Your turn</div> });
  expect(q('final-card')).toBeNull();
  click('lesson-next');
  expect(q('final-card').textContent).toBe('Your turn');
  expect(q('lesson-next')).toBeNull();
});

test('without a final card the last card keeps a next button that stays on the last card', () => {
  render();
  click('lesson-next');
  click('lesson-next');
  expect(q('lesson-progress').textContent).toBe('Card 2 of 2');
});

test('moves focus to the new headline when the card changes', () => {
  render();
  click('lesson-next');
  expect(document.activeElement).toBe(q('lesson-headline'));
});

test('exit calls onExit', () => {
  const onExit = jest.fn();
  render({ onExit });
  click('lesson-exit');
  expect(onExit).toHaveBeenCalledTimes(1);
});

test('shows a host above the card when one is given, and nothing when not', () => {
  render({ host: <div data-testid="the-host">Pip</div> });
  expect(q('lesson-host').textContent).toBe('Pip');
  expect(q('lesson-host').nextElementSibling.querySelector('[data-testid="lesson-headline"]')).not.toBeNull();
  render({ host: null });
  expect(q('lesson-host')).toBeNull();
});
