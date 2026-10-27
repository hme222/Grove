import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import FeedPage from './FeedPage';
import { feedAPI, plantAPI, userAPI } from '../lib/api';
import { toast } from 'sonner';

jest.mock('../lib/api', () => ({
  feedAPI: { getFeed: jest.fn(), createPost: jest.fn(), addReaction: jest.fn(), removeReaction: jest.fn(), getComments: jest.fn(), createComment: jest.fn() },
  plantAPI: { getAll: jest.fn() },
  userAPI: { getUnlocks: jest.fn() },
  getFileUrl: (p) => p,
}));
jest.mock('sonner', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));
jest.mock('react-router-dom', () => ({ useNavigate: () => jest.fn(), Link: ({ children, to, ...p }) => <a href={to} {...p}>{children}</a> }), { virtual: true });
jest.mock('@/constants/emptyStates', () => ({
  EMPTY_STATES: { feed_empty: { heading: 'Nothing shared yet', body: 'Anyone can browse the community.', cta: null } },
}), { virtual: true });
jest.mock('../components/PageHeader', () => ({
  PageHeader: ({ title }) => <h1>{title}</h1>,
  HeaderAction: ({ children, icon: _icon, pressed: _pressed, ...p }) => <button type="button" {...p}>{children}</button>,
}));
jest.mock('../components/AppLink', () => ({ AppLink: ({ children, to, ...p }) => <a href={to} {...p}>{children}</a> }));
jest.mock('../components/EmptyState', () => ({ EmptyState: ({ config }) => <div data-testid="empty-state">{config.heading}</div> }));
jest.mock('../components/SectionTutorial', () => () => null);
jest.mock('../components/VerifiedProBadge', () => () => null);
jest.mock('../lib/useDialogA11y', () => () => undefined);

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const POST = { id: 'x1', post_type: 'plant_update', caption: 'New leaf', username: 'maya', created_at: new Date().toISOString(), reactions: { leaf: 1, light: 0, cutting: 0 }, user_reactions: [] };

let container;
let root;
const q = (id) => container.querySelector(`[data-testid="${id}"]`);
const mount = async (unlocks) => {
  userAPI.getUnlocks.mockResolvedValue({ data: unlocks });
  await act(async () => { root.render(<FeedPage />); });
};

beforeEach(() => {
  jest.clearAllMocks();
  feedAPI.getFeed.mockResolvedValue({ data: { posts: [POST] } });
  plantAPI.getAll.mockResolvedValue({ data: { plants: [] } });
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

test('someone with no plant and no care can still read the whole feed', async () => {
  await mount({ social_feed_unlocked: true, can_post: false });
  expect(container.querySelectorAll('[data-testid="feed-post"]').length).toBe(1);
  expect(container.textContent).toContain('New leaf');
  expect(container.textContent).not.toMatch(/unlock|day 7|day 30|streak/i);
});

test('browse-only people see why they cannot post, with a way forward, and no compose button', async () => {
  await mount({ social_feed_unlocked: true, can_post: false });
  expect(q('feed-browse-only').textContent).toMatch(/anyone can browse/i);
  expect(q('feed-browse-only').querySelector('a').getAttribute('href')).toBe('/add-plant');
  expect(q('feed-compose-button')).toBeNull();
  expect(q('feed-reaction-leaf').disabled).toBe(true);
});

test('anyone with a plant or a first care log can post', async () => {
  await mount({ social_feed_unlocked: true, can_post: true });
  expect(q('feed-browse-only')).toBeNull();
  expect(q('feed-compose-button')).not.toBeNull();
  expect(q('feed-reaction-leaf').disabled).toBe(false);
});

test('if the check itself fails nothing is switched off, and the server has the last word', async () => {
  userAPI.getUnlocks.mockRejectedValue(new Error('offline'));
  await act(async () => { root.render(<FeedPage />); });
  expect(q('feed-compose-button')).not.toBeNull();
  feedAPI.addReaction.mockRejectedValue({ response: { status: 403, data: { detail: 'Add a plant or log your first care to post, react or swap. Browsing is open to everyone.' } } });
  await act(async () => { q('feed-reaction-leaf').click(); });
  expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('Browsing is open to everyone'));
});

test('reaction and photo buttons carry names that say who, what and the state', async () => {
  feedAPI.getFeed.mockResolvedValue({ data: { posts: [{ ...POST, photo_url: 'https://upload.wikimedia.org/x.jpg', plant_name: 'Pothos', user_reactions: ['leaf'] }] } });
  await mount({ social_feed_unlocked: true, can_post: true });
  expect(q('feed-post-media').getAttribute('aria-label')).toBe("Open photo from maya's post about Pothos");
  expect(q('feed-reaction-leaf').getAttribute('aria-label')).toBe('Leaf reaction, 1');
  expect(q('feed-reaction-light').getAttribute('aria-label')).toBe('Light reaction, 0');
  expect(q('feed-reaction-cutting').getAttribute('aria-label')).toBe('Cutting reaction, 0');
});

test('a blocked photo host falls back to the leaf tile instead of a blank hole', async () => {
  feedAPI.getFeed.mockResolvedValue({ data: { posts: [{ ...POST, photo_url: 'https://upload.wikimedia.org/x.jpg' }] } });
  await mount({ social_feed_unlocked: true, can_post: true });
  await act(async () => { q('feed-post-media').querySelector('img').dispatchEvent(new Event('error')); });
  expect(q('feed-photo-fallback')).not.toBeNull();
  expect(q('feed-post-media').querySelector('img')).toBeNull();
});
