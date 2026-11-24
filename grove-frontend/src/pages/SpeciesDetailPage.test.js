import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import SpeciesDetailPage from './SpeciesDetailPage';
import { encyclopediaAPI, wantsAPI } from '../lib/api';

// Jest here cannot load react-router-dom v7.
jest.mock('react-router-dom', () => ({ useParams: () => ({ speciesId: 'sp1' }), useLocation: () => ({ state: null }), useNavigate: () => jest.fn() }), { virtual: true });
jest.mock('../components/AppLink', () => ({ __esModule: true, default: ({ children, to, ...rest }) => <a href={String(to)} {...rest}>{children}</a> }));
jest.mock('../components/PageHeader', () => ({ PageHeader: ({ title }) => <h1>{title}</h1> }));
jest.mock('../components/SectionTutorial', () => ({ __esModule: true, default: () => <div data-testid="tutorial" /> }));
jest.mock('./NotFoundPage', () => ({ __esModule: true, default: () => <div /> }));
jest.mock('../lib/api', () => ({
  encyclopediaAPI: { getSpeciesDetail: jest.fn(), getPerformance: jest.fn(), getNarrative: jest.fn() },
  wantsAPI: { list: jest.fn(), add: jest.fn(), remove: jest.fn() },
}));
jest.mock('sonner', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

global.IS_REACT_ACT_ENVIRONMENT = true;

const SPECIES = {
  id: 'sp1', common_name: 'Monstera', latin_name: 'Monstera deliciosa', family: 'Araceae', toxicity: 'toxic',
  default_watering_days: 7, default_grow_medium: 'soil', light_ideal: 'bright_indirect', care_summary: 'Bright indirect light.',
  native_range: 'Southern Mexico', citations: [{ label: 'RHS', url: 'https://example.com' }],
};

let el;
let root;
const q = (id) => el.querySelector(`[data-testid="${id}"]`);
const flush = () => act(async () => { await new Promise((r) => setTimeout(r, 0)); });

beforeEach(async () => {
  encyclopediaAPI.getSpeciesDetail.mockResolvedValue({ data: SPECIES });
  encyclopediaAPI.getPerformance.mockRejectedValue(new Error('none'));
  encyclopediaAPI.getNarrative.mockRejectedValue(new Error('none'));
  wantsAPI.list.mockResolvedValue({ data: { wants: [] } });
  el = document.createElement('div');
  document.body.appendChild(el);
  root = createRoot(el);
  await act(async () => { root.render(<SpeciesDetailPage />); });
  await flush();
});
afterEach(() => { act(() => root.unmount()); el.remove(); });

test('shows four fact tiles and opens Light first', () => {
  ['light', 'water', 'soil', 'pets'].forEach((id) => expect(q(`species-fact-tile-${id}`)).not.toBeNull());
  expect(q('species-fact-tile-light').getAttribute('aria-expanded')).toBe('true');
  expect(q('species-fact-panel').textContent).toContain('Bright indirect');
});

test('tapping a tile opens its text below on the same page, one at a time', async () => {
  await act(async () => { q('species-fact-tile-pets').click(); });
  expect(q('species-fact-tile-pets').getAttribute('aria-expanded')).toBe('true');
  expect(q('species-fact-tile-light').getAttribute('aria-expanded')).toBe('false');
  expect(q('species-fact-panel').textContent).toContain('Toxic to cats and dogs');
  expect(q('species-poison-help')).not.toBeNull();
  await act(async () => { q('species-fact-tile-soil').click(); });
  expect(q('species-origin-card').textContent).toContain('Southern Mexico');
});

test('keeps the add action and the sources reachable', () => {
  expect(q('species-add-plant')).not.toBeNull();
  expect(q('species-more')).not.toBeNull();
  expect(q('species-citations').textContent).toContain('RHS');
});
