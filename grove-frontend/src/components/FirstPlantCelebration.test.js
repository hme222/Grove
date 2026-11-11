import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
// Jest here cannot load react-router-dom v7, so the router is stubbed: the location is whatever the test sets.
const mockNavigate = jest.fn();
let mockLocation = { pathname: '/plants', state: null };
jest.mock('react-router-dom', () => ({ useNavigate: () => mockNavigate, useLocation: () => mockLocation }), { virtual: true });

import FirstPlantCelebration, { firstPlantState, groveIsEmpty } from './FirstPlantCelebration';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const show = async (state) => {
  mockNavigate.mockClear();
  mockLocation = { pathname: '/plants', state };
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => { root.render(<FirstPlantCelebration />); });
  return { done: () => { act(() => root.unmount()); container.remove(); } };
};

const card = () => document.querySelector('[data-testid="first-plant-celebration"]');

test('shows nothing without the first-plant state', async () => {
  const { done } = await show(null);
  expect(card()).toBeNull();
  done();
});

test('says it is the first plant and names it, and focus lands on the main action', async () => {
  const { done } = await show(firstPlantState({ id: 'p1', nickname: 'Monty', common_name: 'Monstera' }));
  expect(card()).not.toBeNull();
  expect(document.body.textContent).toContain('You added your first plant!');
  expect(document.querySelector('[data-testid="first-plant-celebration-text"]').textContent).toContain('Monty');
  expect(document.activeElement).toBe(document.querySelector('[data-testid="first-plant-celebration-cta"]'));
  done();
});

test('See my plants closes it and clears the state so it does not replay', async () => {
  const { done } = await show(firstPlantState({ id: 'p1', common_name: 'Pothos' }));
  await act(async () => { document.querySelector('[data-testid="first-plant-celebration-close"]').click(); });
  expect(mockNavigate).toHaveBeenCalledWith('/plants', { replace: true, state: null });
  done();
});

test('Meet goes to the plant', async () => {
  const { done } = await show(firstPlantState({ id: 'p1', common_name: 'Pothos' }));
  await act(async () => { document.querySelector('[data-testid="first-plant-celebration-cta"]').click(); });
  expect(mockNavigate).toHaveBeenCalledWith('/plants/p1', { state: { name: 'Pothos' } });
  done();
});

test('the grove counts as empty only when the list says so, and a failed check is not first', async () => {
  expect(await groveIsEmpty({ getAll: async () => ({ data: { plants: [], total: 0 } }) })).toBe(true);
  expect(await groveIsEmpty({ getAll: async () => ({ data: [] }) })).toBe(true);
  expect(await groveIsEmpty({ getAll: async () => ({ data: { plants: [{ id: 'a' }], total: 1 } }) })).toBe(false);
  expect(await groveIsEmpty({ getAll: async () => { throw new Error('offline'); } })).toBe(false);
});
