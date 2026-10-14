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

test('long-time users with no saved track see nothing and cause no request', async () => {
  mockUser = { primary_track: undefined };
  await mount();
  expect(q('next-lesson-card')).toBeNull();
  expect(lessonAPI.queue).not.toHaveBeenCalled();
});

test('no user shows nothing', async () => {
  mockUser = null;
  await mount();
  expect(q('next-lesson-card')).toBeNull();
});

test('an empty queue shows nothing', async () => {
  lessonAPI.queue.mockResolvedValue({ data: { queue: [] } });
  await mount();
  expect(q('next-lesson-card')).toBeNull();
});

test('a lesson id the app does not know shows nothing', async () => {
  lessonAPI.queue.mockResolvedValue({ data: { queue: ['made-up'] } });
  await mount();
  expect(q('next-lesson-card')).toBeNull();
});

test('a failed request shows nothing and does not throw', async () => {
  lessonAPI.queue.mockRejectedValue(new Error('network'));
  await mount();
  expect(q('next-lesson-card')).toBeNull();
});
