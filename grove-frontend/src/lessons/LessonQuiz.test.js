import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
jest.mock('react-router-dom', () => ({ useNavigate: () => mockNavigate }), { virtual: true });
import LessonQuiz from './LessonQuiz';
import LessonFinalStep from './LessonFinalStep';
import { LESSON_QUIZZES, LESSON_ACTIONS } from './lessonQuizzes';
import { LESSON_CARDS } from './registry';

const mockNavigate = jest.fn();
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const QUESTIONS = [
  {
    id: 'one',
    prompt: 'First question?',
    options: [
      { id: 'a', label: 'Wrong one', why: 'This is why it is wrong.' },
      { id: 'b', label: 'Right one', correct: true, why: 'This is why it is right.' },
    ],
  },
  {
    id: 'two',
    prompt: 'Second question?',
    options: [
      { id: 'a', label: 'Right again', correct: true, why: 'Right for a reason.' },
      { id: 'b', label: 'Wrong again', why: 'Wrong for a reason.' },
    ],
  },
];

let container;
let root;
beforeEach(() => {
  mockNavigate.mockClear();
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

const q = (id) => container.querySelector(`[data-testid="${id}"]`);
const click = (id) => act(() => q(id).dispatchEvent(new MouseEvent('click', { bubbles: true })));

describe('LessonQuiz', () => {
  test('a right answer says why, marks it with a word, and offers the next question', () => {
    const onComplete = jest.fn();
    act(() => root.render(<LessonQuiz questions={QUESTIONS} onComplete={onComplete} />));
    expect(q('lesson-quiz-progress').textContent).toBe('Question 1 of 2');
    expect(q('lesson-quiz-next')).toBeNull();
    click('lesson-quiz-option-b');
    expect(q('lesson-quiz-feedback').textContent).toContain('Yes. This is why it is right.');
    expect(q('lesson-quiz-option-b').textContent).toContain('Correct');
    expect(document.activeElement).toBe(q('lesson-quiz-feedback'));
    click('lesson-quiz-next');
    expect(q('lesson-quiz-progress').textContent).toBe('Question 2 of 2');
    expect(document.activeElement).toBe(q('lesson-quiz-prompt'));
    expect(onComplete).not.toHaveBeenCalled();
  });

  test('a wrong answer says why in words, can be retried without limit, and does not advance', () => {
    act(() => root.render(<LessonQuiz questions={QUESTIONS} onComplete={() => {}} />));
    click('lesson-quiz-option-a');
    expect(q('lesson-quiz-feedback').textContent).toContain('Not quite. This is why it is wrong.');
    expect(q('lesson-quiz-option-a').textContent).toContain('Not quite');
    expect(q('lesson-quiz-feedback').getAttribute('aria-live')).toBe('polite');
    expect(q('lesson-quiz-next')).toBeNull();
    click('lesson-quiz-option-a');
    click('lesson-quiz-option-a');
    expect(q('lesson-quiz-progress').textContent).toBe('Question 1 of 2');
    click('lesson-quiz-option-b');
    expect(q('lesson-quiz-feedback').textContent).toContain('Yes.');
    expect(q('lesson-quiz-next')).not.toBeNull();
  });

  test('answering the last question right and finishing calls onComplete', () => {
    const onComplete = jest.fn();
    act(() => root.render(<LessonQuiz questions={QUESTIONS} onComplete={onComplete} />));
    click('lesson-quiz-option-b');
    click('lesson-quiz-next');
    click('lesson-quiz-option-b');
    click('lesson-quiz-option-a');
    expect(q('lesson-quiz-next').textContent).toBe('Finish quick check');
    click('lesson-quiz-next');
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});

describe('LessonFinalStep', () => {
  const render = (props) =>
    act(() => root.render(<LessonFinalStep lessonId="plant-parent-reset" hasPlant onDone={jest.fn()} onNotYet={jest.fn()} {...props} />));

  test('Mark lesson done only appears after the quiz is finished', () => {
    const onDone = jest.fn();
    render({ onDone });
    expect(q('mark-done-done')).toBeNull();
    LESSON_QUIZZES['plant-parent-reset'].forEach((question) => {
      const right = question.options.find((o) => o.correct);
      click(`lesson-quiz-option-${right.id}`);
      click('lesson-quiz-next');
    });
    expect(q('lesson-quiz')).toBeNull();
    click('mark-done-done');
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  test('a lesson with a natural action offers Try it on your plant, which goes there and saves the lesson', () => {
    const onDone = jest.fn();
    render({ lessonId: 'habit-stacking', onDone });
    LESSON_QUIZZES['habit-stacking'].forEach((question) => {
      click(`lesson-quiz-option-${question.options.find((o) => o.correct).id}`);
      click('lesson-quiz-next');
    });
    expect(q('try-it-step').textContent).toContain('Try it on your plant');
    expect(q('mark-done-done')).toBeNull();
    click('try-it-go');
    expect(onDone).toHaveBeenCalledWith('/care/today');
  });

  test('without a plant the action step offers Add a plant and saves nothing', () => {
    const onDone = jest.fn();
    render({ lessonId: 'plant-er', hasPlant: false, onDone });
    LESSON_QUIZZES['plant-er'].forEach((question) => {
      click(`lesson-quiz-option-${question.options.find((o) => o.correct).id}`);
      click('lesson-quiz-next');
    });
    click('try-it-add-plant');
    expect(mockNavigate).toHaveBeenCalledWith('/add-plant');
    expect(onDone).not.toHaveBeenCalled();
  });
});

describe('the lesson quizzes', () => {
  test('each reading lesson has 3 questions with exactly one correct answer, and the soil test has none', () => {
    expect(Object.keys(LESSON_QUIZZES).sort()).toEqual(['habit-stacking', 'plant-er', 'plant-parent-reset', 'window-blueprint']);
    Object.values(LESSON_QUIZZES).forEach((questions) => {
      expect(questions).toHaveLength(3);
      questions.forEach((question) => {
        expect(question.options.filter((o) => o.correct)).toHaveLength(1);
        question.options.forEach((o) => expect(o.why.length).toBeGreaterThan(10));
      });
    });
    expect(LESSON_QUIZZES['soil-finger-test']).toBeUndefined();
    Object.keys(LESSON_ACTIONS).forEach((id) => expect(LESSON_QUIZZES[id]).toBeDefined());
  });

  test('no lesson card teaches reading a book as the light test or says always', () => {
    const text = Object.values(LESSON_CARDS).flat().map((c) => c.body).join(' ');
    expect(text).not.toMatch(/read a (physical )?book here|comfortably read a book|without turning on a light/i);
    expect(text).not.toMatch(/<strong>Always<\/strong> use a pot/);
  });

  test('the desert succulent question says desert, and every quiz still has one right answer', () => {
    const q = LESSON_QUIZZES['habit-stacking'].find((item) => item.id === 'succulent');
    expect(q.prompt).toContain('desert succulent, an aloe');
    expect(q.options.filter((o) => o.correct)).toHaveLength(1);
    expect(q.options.find((o) => o.correct).label).toBe('When the whole pot is dry.');
    const light = LESSON_QUIZZES['plant-parent-reset'].find((item) => item.id === 'light');
    expect(light.options.find((o) => o.correct).label).toMatch(/within about 3 feet \(1 meter\)/);
    const droop = LESSON_QUIZZES['plant-er'].find((item) => item.id === 'wet-droop');
    expect(droop.options.find((o) => o.id === 'c').why).toMatch(/mushy or smell sour/);
  });

  test('cards that name plants toxic to pets say so, and no card calls every succulent a whole-pot-dry plant', () => {
    const cards = LESSON_CARDS;
    const joined = (id) => cards[id].map((c) => c.body).join(' ');
    expect(joined('habit-stacking')).toMatch(/Monstera is toxic to cats and dogs/);
    Object.keys(cards).forEach((id) => {
      expect(joined(id)).not.toMatch(/(?<!Desert )[Ss]ucculents and cacti want the whole pot dry/);
    });
    expect(joined('plant-er')).not.toMatch(/kill plants faster|within days/);
  });

  test('every light lesson card that names a direction carries the hemisphere note', () => {
    // The window lessons ask which hemisphere the person is in, on the window pick card, and swap
    // north and south from there, so a card naming a direction in plain text must say so too.
    const note = 'Window directions assume the northern hemisphere; in the southern hemisphere swap north and south.';
    [...LESSON_CARDS['light-basics'], ...LESSON_CARDS['window-map']]
      .filter((c) => /\b(north|south|east|west)\b|which direction/i.test(c.body))
      .forEach((c) => expect(c.body).toContain(note));
  });
});
