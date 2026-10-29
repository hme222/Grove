import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
jest.mock('react-router-dom', () => ({
  useLocation: () => ({ pathname: '/plants' }),
  useNavigate: () => jest.fn(),
  Link: ({ children, ...p }) => <a {...p}>{children}</a>,
}), { virtual: true });

import PlantCard from './PlantCard';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const plant = { id: 'p1', common_name: 'Monty', status: 'healthy', created_at: '2026-01-01T00:00:00Z' };
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
const show = (props) => act(async () => root.render(<PlantCard plant={plant} onSelect={() => {}} selectionMode {...props} />));
const tile = () => container.querySelector('[data-testid="collection-grid-plant-tile"]');

test('in Select mode a tile says whether it is chosen', async () => {
  await show({ selected: false });
  expect(tile().getAttribute('aria-pressed')).toBe('false');
  await show({ selected: true });
  expect(tile().getAttribute('aria-pressed')).toBe('true');
});
