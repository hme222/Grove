import React, { act } from 'react';
import { createRoot } from 'react-dom/client';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({ useNavigate: () => mockNavigate }), { virtual: true });
let mockUser = { id: 'u1', pip_introduced: true };
jest.mock('../../contexts/AuthContext', () => ({ useAuth: () => ({ user: mockUser, updateUser: jest.fn() }) }));
let mockArm = 'control';
jest.mock('../../lib/api', () => ({
  experimentAPI: { helpDiagnosisArm: () => Promise.resolve({ data: { arm: mockArm } }), event: () => Promise.resolve() },
  plantAPI: {},
  userAPI: {},
  nookAPI: { state: () => Promise.resolve({ data: {} }) },
}));
jest.mock('../PhotoCheck', () => ({ __esModule: true, default: () => <div data-testid="photo-check" /> }));

import { HelpSheetProvider, useHelpSheet } from './HelpSheet';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let api;
const Opener = () => { api = useHelpSheet(); return <button type="button" data-testid="opener" onClick={() => api.open()}>open</button>; };

const mount = async () => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => { root.render(<HelpSheetProvider><Opener /></HelpSheetProvider>); });
  return { container, done: () => { act(() => root.unmount()); container.remove(); } };
};
const el = (id) => document.querySelector(`[data-testid="${id}"]`);
const openIt = async (c) => { await act(async () => { c.querySelector('[data-testid="opener"]').focus(); api.open(); }); await act(async () => {}); };

beforeEach(() => { jest.clearAllMocks(); mockUser = { id: 'u1', pip_introduced: true }; mockArm = 'control'; });

test('closed until opened', async () => {
  const { done } = await mount();
  expect(el('help-sheet')).toBeNull();
  done();
});

test('opens over the screen with the title, the safety row first, and focus on the title', async () => {
  const { container, done } = await mount();
  await openIt(container);
  expect(el('help-sheet')).not.toBeNull();
  expect(document.body.textContent).toContain('What are you seeing?');
  const sheet = el('help-sheet');
  const urgent = el('help-sheet-urgent');
  const firstChip = el('symptom-list');
  expect(urgent.compareDocumentPosition(firstChip) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(sheet.contains(document.activeElement)).toBe(true);
  expect(document.activeElement.textContent).toBe('What are you seeing?');
  done();
});

test('the urgent row opens the safety note, and the note is not repeated at the bottom', async () => {
  const { container, done } = await mount();
  await openIt(container);
  expect(document.querySelectorAll('[data-testid="safety-note"]')).toHaveLength(0);
  await act(async () => { el('help-sheet-urgent').click(); });
  expect(document.querySelectorAll('[data-testid="safety-note"]')).toHaveLength(1);
  expect(el('help-sheet-urgent').getAttribute('aria-expanded')).toBe('true');
  expect(document.activeElement.id).toBe('safety-heading');
  done();
});

test('the photo check shows only for the photo_check arm', async () => {
  mockArm = 'photo_check';
  let m = await mount();
  await openIt(m.container);
  expect(el('photo-check')).not.toBeNull();
  m.done();
  mockArm = 'control';
  m = await mount();
  await openIt(m.container);
  expect(el('photo-check')).toBeNull();
  m.done();
});

test('Escape closes it', async () => {
  const { container, done } = await mount();
  await openIt(container);
  await act(async () => { el('help-sheet').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); });
  expect(el('help-sheet')).toBeNull();
  done();
});

test('a leaf stands in for Pip when he is off or has not said hello; with him on there is a canvas', async () => {
  mockUser = { id: 'u1', pip_introduced: true, pip_enabled: false };
  let m = await mount();
  await openIt(m.container);
  expect(el('help-sheet-mark').querySelector('canvas')).toBeNull();
  m.done();
  mockUser = { id: 'u1', pip_introduced: true };
  m = await mount();
  await openIt(m.container);
  expect(el('help-sheet-mark').querySelector('canvas')).not.toBeNull();
  m.done();
  mockUser = { id: 'u1' };
  m = await mount();
  await openIt(m.container);
  expect(el('help-sheet-mark').querySelector('canvas')).toBeNull();
  m.done();
});

test('Open the full page closes the sheet and goes to the page', async () => {
  const { container, done } = await mount();
  await openIt(container);
  await act(async () => { el('help-sheet-full-page').click(); });
  expect(mockNavigate).toHaveBeenCalledWith('/help-my-plant');
  expect(el('help-sheet')).toBeNull();
  done();
});

test('closing gives focus back to what opened it', async () => {
  const { container, done } = await mount();
  await openIt(container);
  expect(document.activeElement).not.toBe(container.querySelector('[data-testid="opener"]'));
  await act(async () => { el('help-sheet').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); });
  await act(async () => {});
  expect(document.activeElement).toBe(container.querySelector('[data-testid="opener"]'));
  done();
});
