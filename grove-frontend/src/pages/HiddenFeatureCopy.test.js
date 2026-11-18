// Copy on pages a new owner reaches must not describe features that are switched off for v1 (community), and
// empty states must point at the step that actually fills them.
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import HelpPage from './HelpPage';
import NotificationsPage from './NotificationsPage';
import RoomPage from './RoomPage';
import { notificationAPI, roomAPI } from '../lib/api';

jest.mock('../lib/api', () => ({
  notificationAPI: { getAll: jest.fn() },
  roomAPI: { getRooms: jest.fn() },
  getFileUrl: (p) => p,
}));
jest.mock('sonner', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));
jest.mock('react-router-dom', () => ({ useNavigate: () => jest.fn() }), { virtual: true });
jest.mock('../components/PageHeader', () => ({
  PageHeader: ({ title }) => <h1>{title}</h1>,
  HeaderAction: ({ children }) => <button type="button">{children}</button>,
  EmptyState: ({ title, description, action }) => <div><h2>{title}</h2><p>{description}</p>{action}</div>,
}));
jest.mock('../components/PhotoGuideCards', () => () => null);
jest.mock('../components/PhotoBand', () => () => null);

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let container; let root;
beforeEach(() => {
  notificationAPI.getAll.mockResolvedValue({ data: { notifications: [], unread_count: 0 } });
  roomAPI.getRooms.mockResolvedValue({ data: [] });
  container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container); });
afterEach(() => { act(() => root.unmount()); container.remove(); });
const render = async (el) => { await act(async () => { root.render(el); }); await act(async () => {}); };

test('Help & tutorial leaves out the community section while community is off', async () => {
  await render(<HelpPage />);
  expect(container.querySelector('[data-testid="help-section-groves"]')).toBeNull();
  expect(container.querySelector('[data-testid="help-section-today"]')).not.toBeNull();
});

test('Help & tutorial says reminders can be raised to three a day, matching the settings', async () => {
  await render(<HelpPage />);
  const trigger = container.querySelector('[data-testid="help-section-reminders"] button');
  await act(async () => { trigger.click(); });
  expect(container.textContent).toContain('allow up to three a day');
});

test('the empty notification list does not promise grove activity while community is off', async () => {
  await render(<NotificationsPage />);
  const body = container.querySelector('[data-testid="notifications-empty-body"]');
  expect(body.textContent).toBe('We’ll let you know about care reminders.');
});

test('the empty Rooms page sends people to their plants, where a room is set', async () => {
  await render(<RoomPage />);
  const cta = container.querySelector('[data-testid="rooms-empty-cta"]');
  expect(cta.getAttribute('href')).toBe('/plants');
  expect(cta.textContent).toBe('Go to my plants');
  expect(container.textContent).toContain('Open a plant and tap Add room.');
});
