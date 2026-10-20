import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import LessonPage from './LessonPage';
import LessonsPage from './LessonsPage';
import { lessonAPI, plantAPI, careAPI, nookAPI, lightAPI } from '../lib/api';

jest.mock('../lib/api', () => ({
  lessonAPI: { queue: jest.fn(), complete: jest.fn() },
  plantAPI: { getAll: jest.fn() },
  careAPI: { createLog: jest.fn() },
  nookAPI: { state: jest.fn() },
  lightAPI: { progress: jest.fn() },
}));

// Jest here cannot load react-router-dom v7, the `@/` alias, or the real card pages.
const mockNavigate = jest.fn();
let mockParams = {};
jest.mock('react-router-dom', () => ({ useNavigate: () => mockNavigate, useParams: () => mockParams }), { virtual: true });

let mockUser = { nook_enabled: false, tutorials_seen: [] };
const mockUpdateUser = jest.fn();
jest.mock('../contexts/AuthContext', () => ({ useAuth: () => ({ user: mockUser, updateUser: mockUpdateUser }) }));

jest.mock('../lessons/registry', () => ({
  LESSON_CARDS: {
    'soil-finger-test': [
      { header: 'Card 1 of 2', headline: 'Soil one', body: 'First.', cta: 'Next' },
      { header: 'Card 2 of 2', headline: 'Soil last', body: 'Your turn.', cta: 'Go' },
    ],
    'window-map': [{ header: 'Card 1 of 1', headline: 'Closing', body: 'Last.', interactive: 'closing' }],
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
    progress: {},
    library: ['soil-finger-test', 'plant-parent-reset', 'plant-er', 'habit-stacking', 'light-basics', 'window-map'],
    has_plant: true,
    ...over,
  },
});

beforeEach(() => {
  jest.clearAllMocks();
  mockParams = {};
  mockUser = { nook_enabled: false, tutorials_seen: [] };
  nookAPI.state.mockResolvedValue({ data: { pip: { form: 'leafy' } } });
  lessonAPI.queue.mockResolvedValue(queueData());
  lessonAPI.complete.mockResolvedValue(queueData());
  lightAPI.progress.mockResolvedValue({ data: {} });
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

describe('the light lesson ending', () => {
  test('the closing card ends in the usual finish control, which saves and returns', async () => {
    mockParams = { lessonId: 'window-map' };
    await mount(<LessonPage />);
    expect(q('closing-step')).not.toBeNull();
    await click(q('mark-done-done'));
    await flush();
    expect(lessonAPI.complete).toHaveBeenCalledWith('window-map');
    expect(mockNavigate).toHaveBeenCalledWith('/lessons');
  });

  test('a failed finish on the closing card shows the error and stays', async () => {
    lessonAPI.complete.mockRejectedValue(new Error('network'));
    mockParams = { lessonId: 'window-map' };
    await mount(<LessonPage />);
    await click(q('mark-done-done'));
    await flush();
    expect(q('lesson-error').textContent).toBe('Could not save your progress. Try again.');
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});

describe('LessonPage resume and progress', () => {
  test('a lesson resumes on the saved card', async () => {
    lessonAPI.queue.mockResolvedValue(queueData({ progress: { 'plant-er': 1 } }));
    mockParams = { lessonId: 'plant-er' };
    await mount(<LessonPage />);
    expect(q('lesson-headline').textContent).toBe('ER last');
  });

  test('a finished lesson starts again from the first card', async () => {
    lessonAPI.queue.mockResolvedValue(queueData({ progress: { 'plant-er': 1 }, completed: ['plant-er'] }));
    mockParams = { lessonId: 'plant-er' };
    await mount(<LessonPage />);
    expect(q('lesson-headline').textContent).toBe('ER one');
  });

  test('advancing saves progress, and a failure does not block the next card', async () => {
    lightAPI.progress.mockRejectedValue(new Error('network'));
    mockParams = { lessonId: 'plant-er' };
    await mount(<LessonPage />);
    await click(q('lesson-next'));
    await flush();
    expect(lightAPI.progress).toHaveBeenCalledWith('plant-er', 1);
    expect(q('lesson-headline').textContent).toBe('ER last');
  });

  test('progress is kept on the signed-in user too', async () => {
    mockUser = { nook_enabled: false, tutorials_seen: [], lesson_progress: { 'soil-finger-test': 1 } };
    mockParams = { lessonId: 'plant-er' };
    await mount(<LessonPage />);
    await click(q('lesson-next'));
    expect(mockUpdateUser).toHaveBeenCalledWith({ lesson_progress: { 'soil-finger-test': 1, 'plant-er': 1 } });
  });

  test('the lesson still opens on the first card if the queue cannot be loaded', async () => {
    lessonAPI.queue.mockRejectedValue(new Error('network'));
    mockParams = { lessonId: 'plant-er' };
    await mount(<LessonPage />);
    expect(q('lesson-headline').textContent).toBe('ER one');
  });
});

describe('LessonsPage', () => {
  test('shows the next lesson, what comes after it, and all six lessons', async () => {
    await mount(<LessonsPage />);
    expect(q('lessons-up-next').textContent).toContain('Plant ER');
    expect(q('lessons-then').textContent).toBe('After that: Soil Finger-Test');
    expect(container.querySelectorAll('[data-testid^="lesson-row-"]').length).toBe(6);
  });

  test('the library marks the suggested next light lesson', async () => {
    lessonAPI.queue.mockResolvedValue(queueData({ completed: ['light-basics'], up_next: 'window-map' }));
    await mount(<LessonsPage />);
    expect(q('lesson-row-window-map').textContent).toContain('Up next');
    expect(q('lesson-row-habit-stacking').textContent).not.toContain('Up next');
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
    expect(container.querySelectorAll('[data-testid^="lesson-row-"]').length).toBe(6);
  });

  test('if lessons cannot be loaded it says so and still lists the six lessons', async () => {
    lessonAPI.queue.mockRejectedValue(new Error('network'));
    await mount(<LessonsPage />);
    expect(container.querySelector('[role="alert"]').textContent).toContain('Could not load your lessons');
    expect(container.querySelectorAll('[data-testid^="lesson-row-"]').length).toBe(6);
  });
});

describe('LessonPage and the nook', () => {
  test('Pip hosts the lesson for people who turned the nook on', async () => {
    mockUser = { nook_enabled: true, tutorials_seen: [] };
    mockParams = { lessonId: 'plant-er' };
    await mount(<LessonPage />);
    expect(q('lesson-host').querySelector('canvas').getAttribute('aria-label')).toBe('Pip');
    expect(nookAPI.state).toHaveBeenCalled();
  });

  test('there is no host, and no request for the nook, without it', async () => {
    mockParams = { lessonId: 'plant-er' };
    await mount(<LessonPage />);
    expect(q('lesson-host')).toBeNull();
    expect(nookAPI.state).not.toHaveBeenCalled();
  });

  test('finishing a lesson tells the signed-in user, so the nook offer can follow', async () => {
    mockUser = { nook_enabled: false, tutorials_seen: ['collection'] };
    mockParams = { lessonId: 'plant-er' };
    await mount(<LessonPage />);
    await click(q('lesson-next'));
    await click(q('mark-done-done'));
    await flush();
    expect(mockUpdateUser).toHaveBeenCalledWith({ tutorials_seen: ['collection', 'lesson:plant-er'] });
  });

  test('a lesson already recorded is not added twice', async () => {
    mockUser = { nook_enabled: false, tutorials_seen: ['lesson:plant-er'] };
    mockParams = { lessonId: 'plant-er' };
    await mount(<LessonPage />);
    await click(q('lesson-next'));
    await click(q('mark-done-done'));
    await flush();
    expect(mockUpdateUser.mock.calls.filter(([change]) => 'tutorials_seen' in change)).toHaveLength(0);
  });

  test('when the first-care celebration closes the user is marked as celebrated', async () => {
    careAPI.createLog.mockResolvedValue({ data: { _meta: { soil_coaching: 'Fine.', first_care_pending: true } } });
    mockParams = { lessonId: 'soil-finger-test' };
    await mount(<LessonPage />);
    await click(q('lesson-next'));
    await flush();
    await click(q('soil-outcome-damp'));
    await click(q('soil-step-submit'));
    await flush();
    await click(q('soil-step-continue'));
    await flush();
    await click(q('celebration-close'));
    await flush();
    expect(mockUpdateUser).toHaveBeenCalledWith({ first_care_celebrated: true });
  });
});
