import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import LessonPage from './LessonPage';
import LessonsPage from './LessonsPage';
import { lessonAPI, plantAPI, careAPI } from '../lib/api';

jest.mock('../lib/api', () => ({
  lessonAPI: { queue: jest.fn(), complete: jest.fn() },
  plantAPI: { getAll: jest.fn() },
  careAPI: { createLog: jest.fn() },
}));

// Jest here cannot load react-router-dom v7, the `@/` alias, or the real card pages.
const mockNavigate = jest.fn();
let mockParams = {};
jest.mock('react-router-dom', () => ({ useNavigate: () => mockNavigate, useParams: () => mockParams }), { virtual: true });

jest.mock('../lessons/registry', () => ({
  LESSON_CARDS: {
    'soil-finger-test': [
      { header: 'Card 1 of 2', headline: 'Soil one', body: 'First.', cta: 'Next' },
      { header: 'Card 2 of 2', headline: 'Soil last', body: 'Your turn.', cta: 'Go' },
    ],
    'plant-er': [
      { header: 'Card 1 of 2', headline: 'ER one', body: 'First.', cta: 'Next' },
      { header: 'Card 2 of 2', headline: 'ER last', body: 'Your turn.', cta: 'Go' },
    ],
  },
}));

jest.mock('../components/FirstCareCelebration', () => ({
  __esModule: true,
  default: ({ open, onClose }) =>
    open ? require('react').createElement('button', { 'data-testid': 'celebration-close', onClick: onClose }, 'close') : null,
}));

jest.mock('../components/PageHeader', () => ({
  PageHeader: ({ title }) => require('react').createElement('h1', null, title),
}));

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container;
let root;

const q = (id) => container.querySelector(`[data-testid="${id}"]`);
const click = (el) => act(() => el.dispatchEvent(new MouseEvent('click', { bubbles: true })));
const flush = () => act(async () => {});
const mount = async (ui) => {
  await act(async () => {
    root.render(ui);
  });
  await flush();
};

const queueData = (over = {}) => ({
  data: {
    primary_track: 'rescue',
    queue: ['plant-er', 'soil-finger-test'],
    completed: [],
    library: ['soil-finger-test', 'plant-parent-reset', 'plant-er', 'habit-stacking', 'window-blueprint'],
    has_plant: true,
    ...over,
  },
});

beforeEach(() => {
  jest.clearAllMocks();
  mockParams = {};
  lessonAPI.queue.mockResolvedValue(queueData());
  lessonAPI.complete.mockResolvedValue(queueData());
  plantAPI.getAll.mockResolvedValue({ data: { plants: [{ id: 'p1', common_name: 'Pothos' }] } });
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

const toLastCard = async () => {
  await click(q('lesson-next'));
};

describe('LessonPage', () => {
  test('an unknown lesson says so and links back to the lessons list', async () => {
    mockParams = { lessonId: 'not-a-lesson' };
    await mount(<LessonPage />);
    expect(container.textContent).toContain("That lesson isn't here");
    await click(container.querySelector('button'));
    expect(mockNavigate).toHaveBeenCalledWith('/lessons');
  });

  test('a lesson without a soil test ends in mark done, which saves and returns to the list', async () => {
    mockParams = { lessonId: 'plant-er' };
    await mount(<LessonPage />);
    expect(q('lesson-headline').textContent).toBe('ER one');
    await toLastCard();
    expect(q('mark-done-step')).not.toBeNull();
    await click(q('mark-done-done'));
    await flush();
    expect(lessonAPI.complete).toHaveBeenCalledWith('plant-er');
    expect(mockNavigate).toHaveBeenCalledWith('/lessons');
  });

  test('"Not yet" returns to the list without saving', async () => {
    mockParams = { lessonId: 'plant-er' };
    await mount(<LessonPage />);
    await toLastCard();
    await click(q('mark-done-not-yet'));
    expect(lessonAPI.complete).not.toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/lessons');
  });

  test('a failed save shows an error and does not leave the lesson', async () => {
    lessonAPI.complete.mockRejectedValue(new Error('network'));
    mockParams = { lessonId: 'plant-er' };
    await mount(<LessonPage />);
    await toLastCard();
    await click(q('mark-done-done'));
    await flush();
    expect(q('lesson-error').textContent).toBe('Could not save your progress. Try again.');
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test('the soil lesson ends in a real soil test and finishes without a celebration after a first log', async () => {
    careAPI.createLog.mockResolvedValue({ data: { _meta: { soil_coaching: 'Fine.', first_care_pending: false } } });
    mockParams = { lessonId: 'soil-finger-test' };
    await mount(<LessonPage />);
    await toLastCard();
    expect(q('soil-step')).not.toBeNull();
    await click(q('soil-outcome-dry'));
    await click(q('soil-step-submit'));
    await flush();
    await click(q('soil-step-continue'));
    await flush();
    expect(lessonAPI.complete).toHaveBeenCalledWith('soil-finger-test');
    expect(mockNavigate).toHaveBeenCalledWith('/lessons');
  });

  test('on a first ever care log the celebration plays first, and the lesson finishes when it closes', async () => {
    careAPI.createLog.mockResolvedValue({ data: { _meta: { soil_coaching: 'Fine.', first_care_pending: true } } });
    mockParams = { lessonId: 'soil-finger-test' };
    await mount(<LessonPage />);
    await toLastCard();
    await click(q('soil-outcome-damp'));
    await click(q('soil-step-submit'));
    await flush();
    await click(q('soil-step-continue'));
    await flush();
    expect(q('celebration-close')).not.toBeNull();
    expect(lessonAPI.complete).not.toHaveBeenCalled();
    await click(q('celebration-close'));
    await flush();
    expect(lessonAPI.complete).toHaveBeenCalledWith('soil-finger-test');
    expect(mockNavigate).toHaveBeenCalledWith('/lessons');
  });

  test('with no plant the soil lesson logs nothing and never completes', async () => {
    lessonAPI.queue.mockResolvedValue(queueData({ has_plant: false }));
    mockParams = { lessonId: 'soil-finger-test' };
    await mount(<LessonPage />);
    await toLastCard();
    expect(q('soil-step-no-plant').textContent).toContain('Save this for your first plant');
    expect(careAPI.createLog).not.toHaveBeenCalled();
    expect(lessonAPI.complete).not.toHaveBeenCalled();
  });

  test('if the queue cannot be loaded the soil lesson is treated as having no plant', async () => {
    lessonAPI.queue.mockRejectedValue(new Error('network'));
    mockParams = { lessonId: 'soil-finger-test' };
    await mount(<LessonPage />);
    await toLastCard();
    expect(q('soil-step-no-plant')).not.toBeNull();
  });
});

describe('LessonsPage', () => {
  test('shows the next lesson, what comes after it, and all five lessons', async () => {
    await mount(<LessonsPage />);
    expect(q('lessons-up-next').textContent).toContain('Plant ER');
    expect(q('lessons-then').textContent).toBe('After that: Soil Finger-Test');
    expect(container.querySelectorAll('[data-testid^="lesson-row-"]').length).toBe(5);
  });

  test('start opens the next lesson', async () => {
    await mount(<LessonsPage />);
    await click(q('lessons-start'));
    expect(mockNavigate).toHaveBeenCalledWith('/lessons/plant-er');
  });

  test('a row opens its lesson, and finished lessons say Done', async () => {
    lessonAPI.queue.mockResolvedValue(queueData({ queue: ['soil-finger-test'], completed: ['plant-er'] }));
    await mount(<LessonsPage />);
    expect(q('lesson-row-plant-er').textContent).toContain('Done');
    expect(q('lesson-row-soil-finger-test').textContent).not.toContain('Done');
    expect(q('lessons-then')).toBeNull();
    await click(q('lesson-row-habit-stacking'));
    expect(mockNavigate).toHaveBeenCalledWith('/lessons/habit-stacking');
  });

  test('when everything is finished it says so and still lists the library', async () => {
    lessonAPI.queue.mockResolvedValue(queueData({ queue: [], completed: ['plant-er', 'soil-finger-test'] }));
    await mount(<LessonsPage />);
    expect(q('lessons-all-done')).not.toBeNull();
    expect(q('lessons-up-next')).toBeNull();
    expect(container.querySelectorAll('[data-testid^="lesson-row-"]').length).toBe(5);
  });

  test('if lessons cannot be loaded it says so and still lists the five lessons', async () => {
    lessonAPI.queue.mockRejectedValue(new Error('network'));
    await mount(<LessonsPage />);
    expect(container.querySelector('[role="alert"]').textContent).toContain('Could not load your lessons');
    expect(container.querySelectorAll('[data-testid^="lesson-row-"]').length).toBe(5);
  });
});
