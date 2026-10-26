import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import CollectionPage from './CollectionPage';
import { plantAPI, bouquetAPI } from '../lib/api';

jest.mock('../lib/api', () => ({
  plantAPI: { getAll: jest.fn() },
  bouquetAPI: { getAll: jest.fn() },
  careAPI: { bulkLog: jest.fn() },
  getFileUrl: (p) => p,
}));
jest.mock('sonner', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

// Jest here cannot load react-router-dom v7 or the `@/` alias, so both are stubbed.
const mockNavigate = jest.fn();
let mockParams = new URLSearchParams();
const mockSetParams = jest.fn();
jest.mock(
  'react-router-dom',
  () => ({ useNavigate: () => mockNavigate, useSearchParams: () => [mockParams, mockSetParams] }),
  { virtual: true }
);
jest.mock('@/constants/emptyStates', () => ({ EMPTY_STATES: { collection_zero_plants: {} } }), { virtual: true });
jest.mock(
  '@/components/ui/dialog',
  () => ({ Dialog: () => null, DialogContent: () => null, DialogHeader: () => null, DialogTitle: () => null }),
  { virtual: true }
);
jest.mock('../components/PlantCard', () => ({ plant }) => <div data-testid="plant-card">{plant.common_name}</div>);
jest.mock('../components/PlantImage', () => () => null);
jest.mock('../components/PageHeader', () => ({
  PageHeader: ({ rightContent }) => (
    <header>
      {rightContent}
    </header>
  ),
  HeaderAction: ({ children, icon: _icon, pressed: _pressed, ...p }) => <button type="button" {...p}>{children}</button>,
}));
jest.mock('../components/EmptyState', () => ({ EmptyState: () => <div data-testid="empty-state" /> }));
jest.mock('../components/FirstSessionBanner', () => () => null);
jest.mock('../components/SectionTutorial', () => () => null);

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container;
let root;
const q = (id) => container.querySelector(`[data-testid="${id}"]`);
const qa = (id) => container.querySelectorAll(`[data-testid="${id}"]`);

let mountCount = 0;
// A fresh key remounts the page, the way a navigation to the new URL would.
const mount = async () => {
  mountCount += 1;
  await act(async () => { root.render(<CollectionPage key={mountCount} />); });
};

beforeEach(() => {
  jest.clearAllMocks();
  mockParams = new URLSearchParams();
  // CRA resets mock implementations before each test, so set it here.
  mockSetParams.mockImplementation((next) => { mockParams = new URLSearchParams(next); });
  plantAPI.getAll.mockResolvedValue({ data: { plants: [{ id: 'p1', common_name: 'Pothos' }, { id: 'p2', common_name: 'Monstera' }] } });
  bouquetAPI.getAll.mockResolvedValue({ data: [{ id: 'b1', name: 'Tulips' }] });
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

test('the plant grid shows plants only and counts plants only', async () => {
  await mount();
  expect(qa('plant-card')).toHaveLength(2);
  expect(qa('collection-grid-bouquet-tile')).toHaveLength(0);
  expect(q('collection-view-plants').textContent).toBe('Plants2');
  expect(q('collection-view-bouquets').textContent).toBe('Bouquets1');
  expect(q('collection-view-plants').getAttribute('aria-pressed')).toBe('true');
});

test('the Bouquets segment shows bouquets and is linkable', async () => {
  await mount();
  await act(async () => { q('collection-view-bouquets').click(); });
  expect(mockSetParams).toHaveBeenCalledWith({ view: 'bouquets' });
  await mount();
  expect(qa('collection-grid-bouquet-tile')).toHaveLength(1);
  expect(qa('plant-card')).toHaveLength(0);
  expect(q('collection-view-bouquets').getAttribute('aria-pressed')).toBe('true');
  expect(q('collection-select-button')).toBeNull();
  await act(async () => { q('collection-grid-bouquet-tile').click(); });
  expect(mockNavigate).toHaveBeenCalledWith('/bouquets/b1', { state: { name: 'Tulips' } });
});

test('people with no bouquets never see the switch', async () => {
  bouquetAPI.getAll.mockResolvedValue({ data: [] });
  await mount();
  expect(q('collection-view-switch')).toBeNull();
  expect(qa('plant-card')).toHaveLength(2);
});

test('a room filter shows that room’s plants without crashing', async () => {
  plantAPI.getAll.mockResolvedValue({ data: { plants: [{ id: 'p1', common_name: 'Pothos', room: 'Kitchen' }, { id: 'p2', common_name: 'Monstera' }] } });
  mockParams = new URLSearchParams({ room: 'Kitchen' });
  await mount();
  expect(qa('plant-card')).toHaveLength(1);
  expect(q('collection-view-switch')).toBeNull();
});
