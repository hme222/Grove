import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import PipNoteCard from './PipNoteCard';
import { nookAPI, triviaAPI } from '../lib/api';

jest.mock('../lib/api', () => ({
  nookAPI: { state: jest.fn() },
  triviaAPI: { today: jest.fn() },
}));

let mockUser = null;
jest.mock('../contexts/AuthContext', () => ({ useAuth: () => ({ user: mockUser }) }));

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({ useNavigate: () => mockNavigate }), { virtual: true });

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const STATE = (over = {}) => ({
  unlocked: ['window', 'table', 'sill', 'floor'],
  pip: { form: 'seed', location: 'sill' },
  hero: null,
  shelf_plants: [],
  readiness: null,
  quiet: false,
  ...over,
});

const TRIVIA = { data: { dismissed: false, card: { headline: 'Roots like air', body: 'Pots with holes let roots breathe.' } } };

let container;
let root;

const q = (id) => container.querySelector(`[data-testid="${id}"]`);
const click = (el) => act(() => el.dispatchEvent(new MouseEvent('click', { bubbles: true })));
const mount = async (props) => {
  await act(async () => {
    root.render(<PipNoteCard {...props} />);
  });
  await act(async () => {});
};

beforeEach(() => {
  jest.clearAllMocks();
  mockUser = { nook_enabled: true };
  nookAPI.state.mockResolvedValue({ data: STATE() });
  triviaAPI.today.mockResolvedValue(TRIVIA);
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

test('shows nothing, and asks for nothing, when the nook is off', async () => {
  mockUser = { nook_enabled: false };
  await mount();
  expect(q('pip-note')).toBeNull();
  expect(nookAPI.state).not.toHaveBeenCalled();
  expect(triviaAPI.today).not.toHaveBeenCalled();
});

test('shows nothing when there is no user', async () => {
  mockUser = null;
  await mount();
  expect(q('pip-note')).toBeNull();
});

test("shows today's trivia card in Pip's slot", async () => {
  await mount();
  expect(q('pip-note').textContent).toContain("Pip’s note");
  expect(q('pip-note-headline').textContent).toBe('Roots like air');
  expect(q('pip-note-body').textContent).toBe('Pots with holes let roots breathe.');
});

test('a small picture of the nook opens it', async () => {
  await mount();
  expect(q('pip-note-thumb').querySelector('canvas').parentElement.style.width).toBe('128px');
  await click(q('pip-note-thumb'));
  expect(mockNavigate).toHaveBeenCalledWith('/nook');
});

test('while a plant needs attention Pip keeps quiet and the trivia waits', async () => {
  nookAPI.state.mockResolvedValue({ data: STATE({ quiet: true }) });
  await mount();
  expect(q('pip-note-body').textContent).toBe('Pip is here when you want a quiet look at your plants.');
  expect(q('pip-note-headline')).toBeNull();
});

test('a trivia card dismissed for the day falls back to a calm line', async () => {
  triviaAPI.today.mockResolvedValue({ data: { dismissed: true, card: TRIVIA.data.card } });
  await mount();
  expect(q('pip-note-headline')).toBeNull();
  expect(q('pip-note-body').textContent).toContain('Pip is here');
});

test('still shows a note when trivia cannot be loaded', async () => {
  triviaAPI.today.mockRejectedValue(new Error('network'));
  await mount();
  expect(q('pip-note-body').textContent).toContain('Pip is here');
});

test('still shows the note, without a picture, when the nook cannot be loaded', async () => {
  nookAPI.state.mockRejectedValue(new Error('network'));
  await mount();
  expect(q('pip-note-thumb')).toBeNull();
  expect(q('pip-note-headline').textContent).toBe('Roots like air');
});


test('embedded, it sits as a row in the From Pip group without its own card box', async () => {
  await mount({ embedded: true });
  const note = q('pip-note');
  expect(note.className).toContain('py-4');
  expect(note.className).not.toContain('border-hairline');
  expect(note.className).not.toContain('bg-[#EDE5D8]');
  expect(q('pip-note-thumb')).not.toBeNull();
});

test('on its own it keeps the card box', async () => {
  await mount();
  expect(q('pip-note').className).toContain('border-hairline');
});
