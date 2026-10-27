import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import EncyclopediaPage from './EncyclopediaPage';
import { encyclopediaAPI, guildAPI } from '../lib/api';

jest.mock('../lib/api', () => ({
  encyclopediaAPI: { getSpecies: jest.fn() },
  guildAPI: { list: jest.fn() },
}));
jest.mock('react-router-dom', () => ({ useNavigate: () => jest.fn() }), { virtual: true });
jest.mock('../components/PageHeader', () => ({ PageHeader: ({ title }) => <h1>{title}</h1> }));
jest.mock('../components/SectionTutorial', () => () => null);

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container;
let root;
const q = (id) => container.querySelector(`[data-testid="${id}"]`);
const flush = () => act(async () => { await Promise.resolve(); });

beforeEach(() => {
  jest.clearAllMocks();
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
  await flush();
  expect(q('greenhouse-guilds-loading')).toBeNull();
  expect(q('guilds-failed')).not.toBeNull();
});

test('species thumbnails go through PhotoBand, not a raw img', async () => {
  guildAPI.list.mockResolvedValue({ data: { guilds: [] } });
  await act(async () => { root.render(<EncyclopediaPage />); });
  await flush();
  const card = q('species-card');
  expect(card.querySelector('[data-testid="photo-band"]')).not.toBeNull();
});
