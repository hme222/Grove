import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
jest.mock('react-router-dom', () => ({ useNavigate: () => jest.fn() }), { virtual: true });
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

test('a lesson with sources lists each one with what it supports, and says what has no source', () => {
  render({
    sources: {
      sources: [{ publisher: 'RHS', title: 'How plants absorb water', url: 'https://example.org/a', supports: 'Feel the soil first.' }],
      gaps: ['No page was found for drafts.'],
    },
  });
  const panel = q('lesson-sources');
  expect(panel.textContent).toContain('RHS: How plants absorb water');
  expect(panel.textContent).toContain('Feel the soil first.');
  expect(panel.textContent).toContain('No page was found for drafts.');
  expect(panel.querySelector('a').getAttribute('target')).toBe('_blank');
});

test('a lesson with no sources shows no panel', () => {
  render({});
  expect(q('lesson-sources')).toBeNull();
});

test('shows a host above the card when one is given, and nothing when not', () => {
  render({ host: <div data-testid="the-host">Pip</div> });
  expect(q('lesson-host').textContent).toBe('Pip');
  expect(q('lesson-host').nextElementSibling.querySelector('[data-testid="lesson-headline"]')).not.toBeNull();
  render({ host: null });
  expect(q('lesson-host')).toBeNull();
});

const THREE = [...CARDS, { header: 'Card 3 of 3', headline: 'Third', body: 'Body three.', cta: 'Done' }];

test('initialIndex opens that card and is clamped to the cards there are', () => {
  render({ cards: THREE, initialIndex: 2 });
  expect(q('lesson-progress').textContent).toBe('Card 3 of 3');
  render({ cards: THREE, initialIndex: 99 });
  expect(q('lesson-progress').textContent).toBe('Card 3 of 3');
});

test('a bad initialIndex opens the first card', () => {
  [-4, undefined, NaN, 'x'].forEach((value) => {
    root.unmount();
    root = createRoot(container);
    render({ cards: THREE, initialIndex: value });
    expect(q('lesson-progress').textContent).toBe('Card 1 of 3');
  });
});

test('onAdvance hears the new card number on next and back, and not when nothing moves', () => {
  const onAdvance = jest.fn();
  render({ cards: THREE, onAdvance });
  click('lesson-next');
  click('lesson-next');
  click('lesson-back');
  expect(onAdvance.mock.calls).toEqual([[1], [2], [1]]);
  onAdvance.mockClear();
  root.unmount();
  root = createRoot(container);
  render({ cards: CARDS, onAdvance, initialIndex: 1 });
  click('lesson-next');
  expect(onAdvance).not.toHaveBeenCalled();
});

test('a rendered card replaces the next button and can move the lesson on', () => {
  const seen = [];
  const renderCard = (card, helpers) => {
    seen.push({ index: helpers.index, isLast: helpers.isLast });
    return card.headline === 'First headline' ? (
      <button type="button" data-testid="step-go" onClick={helpers.next}>step</button>
    ) : null;
  };
  render({ cards: THREE, renderCard });
  expect(q('lesson-next')).toBeNull();
  expect(q('step-go')).not.toBeNull();
  click('step-go');
  expect(q('lesson-headline').textContent).toBe('North & south');
  expect(q('lesson-next')).not.toBeNull();
  expect(q('lesson-back')).not.toBeNull();
  expect(seen[0]).toEqual({ index: 0, isLast: false });
});

test('a rendered card keeps the back button from card two on', () => {
  const renderCard = (card, helpers) =>
    helpers.index === 1 ? <button type="button" data-testid="step-go" onClick={helpers.back}>back</button> : null;
  render({ cards: THREE, renderCard });
  click('lesson-next');
  expect(q('step-go')).not.toBeNull();
  expect(q('lesson-back')).not.toBeNull();
  expect(q('lesson-next')).toBeNull();
});

test('a rendered last card wins over the final-card hook, and a null result falls back to it', () => {
  render({ cards: THREE, initialIndex: 2, renderCard: () => <div data-testid="step-last">custom</div>, renderFinalCard: () => <div data-testid="final-card">final</div> });
  expect(q('step-last')).not.toBeNull();
  expect(q('final-card')).toBeNull();
  root.unmount();
  root = createRoot(container);
  render({ cards: THREE, initialIndex: 2, renderCard: () => null, renderFinalCard: () => <div data-testid="final-card">final</div> });
  expect(q('final-card')).not.toBeNull();
});
