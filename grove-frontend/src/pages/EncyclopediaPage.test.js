import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import EncyclopediaPage from './EncyclopediaPage';
import { encyclopediaAPI, guildAPI, lessonAPI } from '../lib/api';

jest.mock('../lib/features', () => ({ GUILDS_ENABLED: true }));
jest.mock('../lib/api', () => ({
  encyclopediaAPI: { getSpecies: jest.fn() },
  guildAPI: { list: jest.fn() },
  lessonAPI: { queue: jest.fn() },
}));
jest.mock('react-router-dom', () => ({ useNavigate: () => jest.fn() }), { virtual: true });
// The Lessons segment shows lesson rows; their data comes from the lesson catalog.
jest.mock('../components/PageHeader', () => ({ PageHeader: ({ title }) => <h1>{title}</h1> }));
jest.mock('../components/SectionTutorial', () => () => null);

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container;
let root;
const q = (id) => container.querySelector(`[data-testid="${id}"]`);
const openGuide = () => act(() => q('learn-tab-guide').dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0 })));
const flush = () => act(async () => { await Promise.resolve(); });

beforeEach(() => {
  jest.clearAllMocks();
  window.sessionStorage.clear();
  lessonAPI.queue.mockResolvedValue({ data: { queue: ['plant-er', 'soil-finger-test', 'habit-stacking'] } });
  encyclopediaAPI.getSpecies.mockResolvedValue({ data: { species: [{ id: 's1', common_name: 'Pothos', latin_name: 'Epipremnum', family: 'Araceae', botanical_illustration_thumb: 'https://example.org/p.jpg' }], total: 1 } });
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

test('the guilds row holds its place with a skeleton while the guilds load, then swaps in', async () => {
  let resolve;
  guildAPI.list.mockReturnValue(new Promise((r) => { resolve = r; }));
  await act(async () => { root.render(<EncyclopediaPage />); });
  await openGuide();
  expect(q('greenhouse-guilds-loading')).not.toBeNull();
  expect(q('greenhouse-guilds-row')).toBeNull();
  await act(async () => { resolve({ data: { guilds: [{ id: 'a', slug: 'a', name: 'Shade lovers', species_count: 3 }] } }); });
  await flush();
  expect(q('greenhouse-guilds-loading')).toBeNull();
  expect(q('greenhouse-guilds-row')).not.toBeNull();
  expect(q('guild-card-a').querySelector('h3').className).toContain('h-10');
});

test('a failed guild list drops the skeleton and says so', async () => {
  guildAPI.list.mockRejectedValue(new Error('offline'));
  await act(async () => { root.render(<EncyclopediaPage />); });
  await openGuide();
  await flush();
  expect(q('greenhouse-guilds-loading')).toBeNull();
  expect(q('guilds-failed')).not.toBeNull();
});

test('species thumbnails go through PhotoBand, not a raw img', async () => {
  guildAPI.list.mockResolvedValue({ data: { guilds: [] } });
  await act(async () => { root.render(<EncyclopediaPage />); });
  await openGuide();
  await flush();
  const card = q('species-card');
  expect(card.querySelector('[data-testid="photo-band"]')).not.toBeNull();
});

test('the guide names its pet-safety source once when any listed species carries a sourced label', async () => {
  guildAPI.list.mockResolvedValue({ data: { guilds: [] } });
  encyclopediaAPI.getSpecies.mockResolvedValue({ data: { species: [{ id: 's1', common_name: 'Pothos', latin_name: 'Epipremnum', family: 'Araceae', toxicity: 'toxic' }], total: 1 } });
  await act(async () => { root.render(<EncyclopediaPage />); });
  await openGuide();
  await flush();
  expect(q('guide-safety-source').textContent).toMatch(/ASPCA/);
});

test('no source line when no listed species has a sourced pet-safety label', async () => {
  guildAPI.list.mockResolvedValue({ data: { guilds: [] } });
  await act(async () => { root.render(<EncyclopediaPage />); });
  await openGuide();
  await flush();
  expect(q('guide-safety-source')).toBeNull();
});

test('opens on Lessons: the lessons card and the next two lessons, no species list', async () => {
  guildAPI.list.mockResolvedValue({ data: { guilds: [] } });
  await act(async () => { root.render(<EncyclopediaPage />); });
  await flush();
  expect(q('learn-lessons-card')).not.toBeNull();
  expect(q('learn-lesson-plant-er').textContent).toContain('Up next');
  expect(q('learn-lesson-soil-finger-test').textContent).toContain('After that');
  expect(q('learn-lesson-habit-stacking')).toBeNull();
  expect(q('species-card')).toBeNull();
});

test('the Plant guide segment asks for three species at a time and pages with a count', async () => {
  guildAPI.list.mockResolvedValue({ data: { guilds: [] } });
  encyclopediaAPI.getSpecies.mockResolvedValue({
    data: { species: [1, 2, 3].map((n) => ({ id: `s${n}`, common_name: `Plant ${n}`, latin_name: 'Latin', family: 'Fam' })), total: 40 },
  });
  await act(async () => { root.render(<EncyclopediaPage />); });
  await openGuide();
  await flush();
  expect(encyclopediaAPI.getSpecies).toHaveBeenCalledWith({ q: '', page: 1, limit: 3 });
  expect(q('guide-pager-count').textContent).toBe('1 to 3 of 40');
  expect(q('guide-pager-prev').disabled).toBe(true);
  await act(async () => { q('guide-pager-next').click(); });
  expect(encyclopediaAPI.getSpecies).toHaveBeenLastCalledWith({ q: '', page: 2, limit: 3 });
});

test('the chosen segment is remembered for the visit', async () => {
  guildAPI.list.mockResolvedValue({ data: { guilds: [] } });
  await act(async () => { root.render(<EncyclopediaPage />); });
  await openGuide();
  await flush();
  expect(window.sessionStorage.getItem('grove-learn-tab')).toBe('guide');
});
