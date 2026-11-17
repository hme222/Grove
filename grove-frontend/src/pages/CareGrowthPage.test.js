import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import CareGrowthPage from './CareGrowthPage';
import { statsAPI } from '../lib/api';

jest.mock('../lib/api', () => ({
  statsAPI: { getStats: jest.fn(), getCareHours: jest.fn() },
}));
jest.mock('../components/PageHeader', () => ({
  PageHeader: ({ children }) => <header>{children}</header>,
}));
jest.mock('../components/CareTabs', () => ({ CareTabs: () => null }));
jest.mock('../components/LoadError', () => ({ LoadErrorPage: () => <div>error</div> }));
jest.mock('../components/Loading', () => () => <div>loading</div>);

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container;
let root;

async function renderWith(stats) {
  statsAPI.getStats.mockResolvedValue({ data: stats });
  statsAPI.getCareHours.mockResolvedValue({ data: {} });
  await act(async () => {
    root.render(<CareGrowthPage />);
  });
}

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  jest.clearAllMocks();
});

const steady = { total_plants: 3, plants_needing_water: 0, total_care_logs: 6, estimated_care_hours: 2, check_ins: { this_week: 1, weekly_goal: 3 } };

test('basic tiles include a fourth check-ins tile', async () => {
  await renderWith(steady);
  const tiles = container.querySelector('[data-testid="growth-basic-tiles"]');
  expect(tiles.children).toHaveLength(4);
  expect(tiles.children[3].textContent).toContain('Check-ins this week');
  expect(tiles.children[3].textContent).toContain('1 of 3');
});

test('counts of one read as one: 1 Plant, 1 Care log, 1 Hour of care', async () => {
  await renderWith({ ...steady, total_plants: 1, total_care_logs: 1, estimated_care_hours: 1 });
  const text = container.querySelector('[data-testid="growth-basic-tiles"]').textContent;
  expect(text).toContain('1Plant');
  expect(text).toContain('1Care log');
  expect(text).not.toContain('Care logs');
  expect(text).toContain('1Hour of care');
});

test('with no care time yet there is no hours tile, and the last tile spans the row', async () => {
  await renderWith({ ...steady, estimated_care_hours: 0 });
  const tiles = container.querySelector('[data-testid="growth-basic-tiles"]');
  expect(tiles.children).toHaveLength(3);
  expect(tiles.textContent).not.toMatch(/0h|Hours?/);
  expect(tiles.children[2].className).toContain('col-span-2');
});

test('check-ins tile says Not available when data is missing', async () => {
  await renderWith({ ...steady, check_ins: undefined });
  const tiles = container.querySelector('[data-testid="growth-basic-tiles"]');
  expect(tiles.children[3].textContent).toContain('Not available');
});

test('personality card shows the title and line', async () => {
  await renderWith(steady);
  const card = container.querySelector('[data-testid="personality-card"]');
  expect(card.textContent).toContain('Plant personality');
  expect(card.textContent).toContain('The Steady Hand');
});

test('personality card with no plants shows the line only', async () => {
  await renderWith({ total_plants: 0, total_care_logs: 0, plants_needing_water: 0 });
  const card = container.querySelector('[data-testid="personality-card"]');
  expect(card.textContent).toContain("Add a plant and we'll start figuring out your plant personality.");
  expect(card.querySelector('.font-plant:not(h3)')).toBeNull();
});

test('personality card has no buttons', async () => {
  await renderWith(steady);
  const card = container.querySelector('[data-testid="personality-card"]');
  expect(card.querySelector('button')).toBeNull();
});
