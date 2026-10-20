import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import NextLessonCard from './NextLessonCard';
import { lessonAPI } from '../lib/api';

jest.mock('../lib/api', () => ({ lessonAPI: { queue: jest.fn() } }));

let mockUser = null;
jest.mock('../contexts/AuthContext', () => ({ useAuth: () => ({ user: mockUser }) }));

// Jest here cannot load react-router-dom v7.
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({ useNavigate: () => mockNavigate }), { virtual: true });

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container;
let root;

const q = (id) => container.querySelector(`[data-testid="${id}"]`);
const click = (el) => act(() => el.dispatchEvent(new MouseEvent('click', { bubbles: true })));
const mount = async () => {
  await act(async () => {
    root.render(<NextLessonCard />);
  });
  await act(async () => {});
};

beforeEach(() => {
  jest.clearAllMocks();
  mockUser = { primary_track: 'rescue' };
  lessonAPI.queue.mockResolvedValue({ data: { queue: ['plant-er', 'soil-finger-test'] } });
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

test('shows the next lesson and opens it', async () => {
  await mount();
  expect(q('next-lesson-card').textContent).toContain('Your next lesson');
  expect(q('next-lesson-card').textContent).toContain('Plant ER');
  await click(q('next-lesson-start'));
  expect(mockNavigate).toHaveBeenCalledWith('/lessons/plant-er');
});

test('the next lesson card also links to all lessons', async () => {
  await mount();
  await click(q('next-lesson-all'));
  expect(mockNavigate).toHaveBeenCalledWith('/lessons');
  expect(q('lessons-link')).toBeNull();
});

test('long-time users with no saved track get a quiet link to the lessons and no request', async () => {
  mockUser = { primary_track: undefined };
  await mount();
  expect(q('next-lesson-card')).toBeNull();
  expect(lessonAPI.queue).not.toHaveBeenCalled();
  await click(q('lessons-link'));
  expect(mockNavigate).toHaveBeenCalledWith('/lessons');
});

test('no user shows nothing', async () => {
  mockUser = null;
  await mount();
  expect(q('next-lesson-card')).toBeNull();
  expect(q('lessons-link')).toBeNull();
});

test('nothing flashes while the queue is loading', async () => {
  lessonAPI.queue.mockReturnValue(new Promise(() => {}));
  await mount();
  expect(q('next-lesson-card')).toBeNull();
  expect(q('lessons-link')).toBeNull();
});

test.each([
  ['an empty queue', () => lessonAPI.queue.mockResolvedValue({ data: { queue: [] } })],
  ['a lesson id the app does not know', () => lessonAPI.queue.mockResolvedValue({ data: { queue: ['made-up'] } })],
  ['a failed request', () => lessonAPI.queue.mockRejectedValue(new Error('network'))],
])('%s falls back to the quiet lessons link', async (_name, arrange) => {
  arrange();
  await mount();
  expect(q('next-lesson-card')).toBeNull();
  expect(q('lessons-link')).not.toBeNull();
});

test('with an empty queue it offers the suggested next light lesson', async () => {
  lessonAPI.queue.mockResolvedValue({ data: { queue: [], up_next: 'window-map' } });
  await mount();
  expect(q('next-lesson-card').textContent).toContain('Your window');
  await click(q('next-lesson-start'));
  expect(mockNavigate).toHaveBeenCalledWith('/lessons/window-map');
});

test('the queue wins over the suggestion', async () => {
  lessonAPI.queue.mockResolvedValue({ data: { queue: ['plant-er'], up_next: 'window-map' } });
  await mount();
  expect(q('next-lesson-card').textContent).toContain('Plant ER');
});

test('with neither it shows the quiet link to the lessons', async () => {
  lessonAPI.queue.mockResolvedValue({ data: { queue: [], up_next: null } });
  await mount();
  expect(q('lessons-link')).not.toBeNull();
});
