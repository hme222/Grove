import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import GrovesPage from './GrovesPage';
import { groveAPI } from '../lib/api';
import { toast } from 'sonner';

jest.mock('../lib/api', () => ({
  groveAPI: { getAll: jest.fn(), discover: jest.fn(), join: jest.fn(), create: jest.fn() },
}));
jest.mock('sonner', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));
jest.mock('react-router-dom', () => ({ useNavigate: () => jest.fn() }), { virtual: true });
jest.mock('../components/PageHeader', () => ({
  PageHeader: ({ title }) => <h1>{title}</h1>,
  HeaderAction: ({ children, icon: _icon, ...p }) => <button type="button" {...p}>{children}</button>,
  EmptyState: ({ title }) => <p>{title}</p>,
}));
jest.mock('@/components/ui/dialog', () => ({ Dialog: () => null, DialogContent: () => null, DialogHeader: () => null, DialogTitle: () => null }), { virtual: true });

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container;
let root;
const qa = (id) => [...container.querySelectorAll(`[data-testid="${id}"]`)];
const flush = () => act(async () => { await Promise.resolve(); });

const DISCOVER = [
  { id: 'g1', name: 'Fern Friends', member_count: 12, description: 'A long description that the card clamps to two lines but the grove page shows in full.' },
  { id: 'g2', name: 'Succulent Society', member_count: 1, description: '' },
];

beforeEach(async () => {
  jest.clearAllMocks();
  groveAPI.getAll.mockResolvedValue({ data: [] });
  groveAPI.discover.mockResolvedValue({ data: DISCOVER });
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => { root.render(<GrovesPage />); });
  await flush();
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

test('every Join button names its grove', () => {
  expect(qa('grove-join-button').map((b) => b.getAttribute('aria-label'))).toEqual(['Join Fern Friends', 'Join Succulent Society']);
});

test('each Discover card links to the grove page and clamps the description', () => {
  const links = qa('grove-discover-link');
  expect(links.map((a) => a.getAttribute('href'))).toEqual(['/groves/g1', '/groves/g2']);
  const description = links[0].querySelector('p.line-clamp-2');
  expect(description.textContent).toContain('A long description');
});

test('a failed join says so on its own card with an alert, and does not touch the other card', async () => {
  groveAPI.join.mockRejectedValueOnce({ response: { data: { detail: 'This grove is full' } } });
  await act(async () => { qa('grove-join-button')[0].dispatchEvent(new MouseEvent('click', { bubbles: true })); });
  await flush();
  const cards = qa('grove-discover-card');
  const alert = cards[0].querySelector('[role="alert"]');
  expect(alert.textContent).toBe('This grove is full');
  expect(cards[1].querySelector('[role="alert"]')).toBeNull();
  expect(toast.error).toHaveBeenCalledWith('This grove is full');
  expect(qa('grove-join-button')[0].disabled).toBe(false);
});

test('a failed join with no detail still gives a sentence', async () => {
  groveAPI.join.mockRejectedValueOnce(new Error('offline'));
  await act(async () => { qa('grove-join-button')[1].dispatchEvent(new MouseEvent('click', { bubbles: true })); });
  await flush();
  expect(qa('grove-discover-card')[1].querySelector('[role="alert"]').textContent).toContain('couldn’t join');
});
