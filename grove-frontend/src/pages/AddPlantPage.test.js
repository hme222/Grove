import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import AddPlantPage from './AddPlantPage';
import { speciesAPI } from '../lib/api';

jest.mock('react-router-dom', () => ({ useNavigate: () => jest.fn() }), { virtual: true });
jest.mock('../contexts/AuthContext', () => ({ useAuth: () => ({ user: { prefer_manual_plant_entry: true } }) }));
jest.mock('../lib/api', () => ({
  speciesAPI: { search: jest.fn() },
  plantAPI: { getAll: jest.fn(() => Promise.resolve({ data: { plants: [] } })), create: jest.fn() },
  encyclopediaAPI: { getSpeciesDetail: jest.fn() },
}));
jest.mock('../components/PageHeader', () => ({ PageHeader: ({ title }) => <h1>{title}</h1> }));
jest.mock('./PlantIdentifyScreen', () => ({ __esModule: true, default: () => null }));
jest.mock('sonner', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let container; let root;
const q = (id) => container.querySelector(`[data-testid="${id}"]`);
const spider = { id: 'sp_spider', common_name: 'Spider plant', latin_name: 'Chlorophytum comosum', toxicity: 'non_toxic', default_watering_days: 7 };
const unknownOnly = { id: 'sp_x', common_name: 'Mystery fern', latin_name: 'Fernus', toxicity: null, default_watering_days: 7 };

const typeSearch = async (value) => {
  const input = q('species-search-input');
  await act(async () => {
    Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
};
const settle = async () => { await act(async () => { jest.advanceTimersByTime(300); }); await act(async () => {}); };

beforeEach(() => {
  jest.useFakeTimers();
  speciesAPI.search.mockReset().mockImplementation(async (query) => ({ data: query.includes('spider') ? [spider] : query ? [] : [spider] }));
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => { act(() => root.unmount()); container.remove(); jest.useRealTimers(); });

const mount = async () => { await act(async () => { root.render(<AddPlantPage />); }); await settle(); };

test('a search with no match says so in a status region and points to a custom plant', async () => {
  await mount();
  await typeSearch('zzzqq');
  await settle();
  const status = q('species-search-status');
  expect(status.getAttribute('role')).toBe('status');
  expect(q('species-no-match').textContent).toContain('No match for “zzzqq”');
  expect(q('species-no-match').textContent).toContain('add a custom plant');
});

test('no-match never shows before the search for the new text has finished', async () => {
  await mount();
  await typeSearch('zzzqq');
  expect(q('species-no-match')).toBeNull();
});

test('a search with results announces the count and hides the no-match line', async () => {
  await mount();
  await typeSearch('spider');
  await settle();
  expect(q('species-no-match')).toBeNull();
  expect(q('species-search-status').textContent).toBe('1 plant found');
});

test('sourced pet-safety results name the ASPCA list as the source', async () => {
  await mount();
  await typeSearch('spider');
  await settle();
  const source = q('species-safety-source');
  expect(source.textContent).toContain('ASPCA’s toxic and non-toxic plant list');
  expect(source.querySelector('a').getAttribute('href')).toContain('aspca.org');
});

test('with no sourced pet-safety result, there is no source line', async () => {
  speciesAPI.search.mockResolvedValue({ data: [unknownOnly] });
  await mount();
  await typeSearch('fern');
  await settle();
  expect(q('species-safety-source')).toBeNull();
});

test('Or add custom plant moves focus to the plant name field', async () => {
  await mount();
  const custom = [...container.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Or add custom plant');
  await act(async () => { custom.click(); });
  expect(document.activeElement === q('plant-name-input')).toBe(true);
});

test('Picking a species moves focus to the nickname field, and Change brings it back to the search', async () => {
  await mount();
  await typeSearch('spider');
  await settle();
  await act(async () => { q('species-option').click(); });
  expect(document.activeElement === q('plant-nickname-input')).toBe(true);
  const change = [...container.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Change');
  await act(async () => { change.click(); });
  expect(document.activeElement === q('species-search-input')).toBe(true);
});

test('a long list of matches shows six in the page and says how to narrow the rest, with no scrolling box', async () => {
  const many = Array.from({ length: 9 }, (_, i) => ({ ...spider, id: `sp-${i}`, common_name: `Fern ${i}` }));
  speciesAPI.search.mockResolvedValue({ data: many });
  await mount();
  await typeSearch('fern');
  await settle();
  expect(container.querySelectorAll('[data-testid="species-option"]')).toHaveLength(6);
  expect(q('species-more').textContent).toBe('Showing 6 of 9. Type more of the name to narrow it down.');
  expect(container.querySelector('.overflow-y-auto')).toBeNull();
});

test('six or fewer matches show no "showing" line', async () => {
  const few = Array.from({ length: 6 }, (_, i) => ({ ...spider, id: `sp-${i}`, common_name: `Fern ${i}` }));
  speciesAPI.search.mockResolvedValue({ data: few });
  await mount();
  await typeSearch('fern');
  await settle();
  expect(container.querySelectorAll('[data-testid="species-option"]')).toHaveLength(6);
  expect(q('species-more')).toBeNull();
});
