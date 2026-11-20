import React, { act } from 'react';
import { createRoot } from 'react-dom/client';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/profile' }),
}), { virtual: true });

// A tiny live store so updateUser re-renders the page the way the real AuthContext does.
let mockUser;
const mockListeners = new Set();
const mockApplyPatch = (patch) => {
  mockUser = { ...mockUser, ...patch };
  mockListeners.forEach((l) => l());
};
const mockUpdateUser = jest.fn();
const mockLogout = jest.fn();
jest.mock('../contexts/AuthContext', () => {
  const R = require('react');
  const subscribe = (l) => { mockListeners.add(l); return () => mockListeners.delete(l); };
  return {
    useAuth: () => {
      const user = R.useSyncExternalStore(subscribe, () => mockUser);
      return { user, updateUser: mockUpdateUser, logout: mockLogout, refreshUser: jest.fn() };
    },
  };
});
jest.mock('../contexts/TooltipContext', () => ({
  useTooltips: () => ({ tooltipsActive: false, daysRemaining: 0, resetAll: jest.fn() }),
}));
jest.mock('../lib/api', () => ({
  userAPI: { updateMe: jest.fn(), getBadges: jest.fn(), replayTutorial: jest.fn(), generatePersonality: jest.fn() },
  notificationAPI: { getPreferences: jest.fn() },
  statsAPI: { getStats: jest.fn() },
  badgeAPI: { getAll: jest.fn(), getMine: jest.fn(), setFeatured: jest.fn() },
  careAPI: { getDueToday: jest.fn() },
  nookAPI: { settings: jest.fn() },
}));
jest.mock('../lib/features', () => ({ ZIP_ZONE_ENABLED: false }));
jest.mock('sonner', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));
jest.mock('../components/NotificationBell', () => () => null);
jest.mock('../nook/PipPanel', () => ({ __esModule: true, default: () => <span data-testid="pip-sprite" /> }));
jest.mock('../nook/usePipForm', () => ({ usePipForm: () => 'seed' }));

import ProfilePage from './ProfilePage';
import PipPeek from '../components/help/PipPeek';
import { HelpSheetContext } from '../components/help/helpSheetContext';
import { userAPI, notificationAPI, statsAPI, badgeAPI, careAPI } from '../lib/api';
import { resetPipNudges } from '../lib/pipNudges';
import { GROVE_BRAND } from '../constants/brand';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const TILES = ['lessons', 'tutorials', 'care-style', 'home', 'pip', 'notifications'];
let container; let root;
const el = (id) => document.querySelector(`[data-testid="${id}"]`);
const tick = (ms = 0) => new Promise((r) => setTimeout(r, ms));
const mount = async (withPeek = false) => {
  await act(async () => {
    root.render(
      <HelpSheetContext.Provider value={{ open: jest.fn() }}>
        <ProfilePage />
        {withPeek && <PipPeek />}
      </HelpSheetContext.Provider>,
    );
  });
  await act(async () => {});
};
const openTile = async (id) => {
  await act(async () => { el(`profile-tile-${id}`).focus(); el(`profile-tile-${id}`).click(); });
  await act(async () => {});
};
const pressEscape = async (sheetId) => {
  await act(async () => { el(sheetId).dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); });
  await act(async () => { await tick(); });
};

beforeEach(() => {
  jest.clearAllMocks();
  // CRA resets mock implementations between tests, so the live store is wired up here.
  mockUpdateUser.mockImplementation(mockApplyPatch);
  localStorage.clear();
  resetPipNudges();
  mockUser = { id: 'u1', username: 'fern', tier: 'free', has_pets: null, hemisphere: 'north', pip_introduced: true };
  notificationAPI.getPreferences.mockResolvedValue({ data: { push_care_due: true } });
  userAPI.updateMe.mockResolvedValue({ data: {} });
  careAPI.getDueToday.mockResolvedValue({ data: [] });
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  await act(async () => { await tick(); });
});

test('shows exactly six tiles, each a button with a label, a state line and a hidden icon', async () => {
  await mount();
  const tiles = container.querySelectorAll('[data-testid^="profile-tile-"]');
  const buttons = Array.from(tiles).filter((n) => n.tagName === 'BUTTON');
  expect(buttons.map((b) => b.getAttribute('data-testid'))).toEqual(TILES.map((t) => `profile-tile-${t}`));
  buttons.forEach((b) => {
    const id = b.getAttribute('data-testid');
    const label = el(`${id}-label`);
    const state = el(`${id}-state`);
    expect(label.textContent.trim()).not.toBe('');
    expect(state.textContent.trim()).not.toBe('');
    expect(b.contains(label)).toBe(true);
    expect(b.contains(state)).toBe(true);
    expect(state.className).not.toContain('truncate');
    b.querySelectorAll('svg').forEach((svg) => expect(svg.getAttribute('aria-hidden')).toBe('true'));
  });
  expect(el('profile-tile-home-state').textContent).toBe('Pets not set · Northern');
  expect(el('profile-tile-pip-state').textContent).toBe('On · peeks in');
  expect(el('profile-tile-notifications-state').textContent).toBe('Daily care check on');
  expect(el('profile-tile-care-style-label').textContent).toBe('Care style');
});

test('the notifications state line falls back when the preferences fail to load', async () => {
  notificationAPI.getPreferences.mockRejectedValue(new Error('offline'));
  await mount();
  expect(el('profile-tile-notifications-state').textContent).toBe('Reminders and quiet hours');
  expect(el('profile-tile-lessons')).not.toBeNull();
});

test('Care style opens its sheet, and Escape puts focus back on the tile', async () => {
  await mount();
  await openTile('care-style');
  expect(el('care-style-sheet')).not.toBeNull();
  expect(el('care-style-sheet-title').textContent).toBe('Care style');
  await pressEscape('care-style-sheet');
  expect(el('care-style-sheet')).toBeNull();
  expect(document.activeElement).toBe(el('profile-tile-care-style'));
});

test.each([
  ['tutorials', 'tutorials-sheet', 'Tutorials'],
  ['home', 'home-sheet', 'Your home'],
  ['pip', 'pip-sheet', 'Pip'],
])('the %s tile opens %s titled %s', async (tile, sheet, title) => {
  await mount();
  await openTile(tile);
  expect(el(`${sheet}-title`).textContent).toBe(title);
  await pressEscape(sheet);
  expect(el(sheet)).toBeNull();
});

test('Lessons and Notifications go to their pages', async () => {
  await mount();
  await act(async () => { el('profile-tile-lessons').click(); });
  expect(mockNavigate).toHaveBeenCalledWith('/lessons');
  await act(async () => { el('profile-tile-notifications').click(); });
  expect(mockNavigate).toHaveBeenCalledWith('/settings/notifications');
});

test('the retired cards are gone', async () => {
  mockUser = { ...mockUser, tier: 'florist_pro', is_admin: true };
  await mount();
  ['profile-stats-card', 'generate-personality-button', 'profile-badges', 'profile-bouquets-link',
    'profile-challenges-link', 'profile-verification', 'profile-inbox-button'].forEach((id) => {
    expect(el(id)).toBeNull();
  });
  expect(container.textContent.toLowerCase()).not.toMatch(/\btier\b/);
});

test('the hub fetches no stats or badges', async () => {
  await mount();
  expect(statsAPI.getStats).not.toHaveBeenCalled();
  expect(userAPI.getBadges).not.toHaveBeenCalled();
  Object.values(badgeAPI).forEach((fn) => expect(fn).not.toHaveBeenCalled());
});

test('Help goes to /help and About opens the mission sheet', async () => {
  await mount();
  await act(async () => { el('profile-help-button').click(); });
  expect(mockNavigate).toHaveBeenCalledWith('/help');
  await act(async () => { el('profile-about-tile').focus(); el('profile-about-tile').click(); });
  await act(async () => {});
  expect(el('about-sheet-title').textContent).toBe('About FloraGrove');
  expect(el('about-sheet-body').textContent).toContain(GROVE_BRAND.mission);
  await pressEscape('about-sheet');
  expect(document.activeElement).toBe(el('profile-about-tile'));
});

test('admin rows show only for admins, below Sign out', async () => {
  await mount();
  expect(el('profile-replay-onboarding-button')).toBeNull();
  expect(el('profile-admin-button')).toBeNull();
  await act(async () => root.unmount());
  root = createRoot(container);
  mockUser = { ...mockUser, is_admin: true };
  await mount();
  const logout = el('profile-logout-button');
  ['profile-replay-onboarding-button', 'profile-admin-button'].forEach((id) => {
    expect(el(id)).not.toBeNull();
    expect(logout.compareDocumentPosition(el(id)) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
  await act(async () => { el('profile-replay-onboarding-button').click(); });
  expect(mockNavigate).toHaveBeenCalledWith('/first-run');
});

// The florist dashboard is held back from v1 (lib/features FLORIST_ENABLED is off), so no tier sees its row.
test.each([['free'], ['pro'], ['florist_pro']])('no Florist Pro row while florist pages are held back (tier %s)', async (tier) => {
  mockUser = { ...mockUser, tier };
  await mount();
  expect(el('profile-florist-button')).toBeNull();
});

test('Sign out calls logout', async () => {
  await mount();
  await act(async () => { el('profile-logout-button').click(); });
  expect(mockLogout).toHaveBeenCalled();
});

test('a failed save in a sheet leaves the tile showing the old value once the sheet closes', async () => {
  userAPI.updateMe.mockRejectedValue(new Error('offline'));
  await mount();
  await openTile('home');
  await act(async () => { el('profile-pets-yes').click(); });
  await act(async () => {});
  expect(el('pets-error')).not.toBeNull();
  await pressEscape('home-sheet');
  expect(el('profile-tile-home-state').textContent).toBe('Pets not set · Northern');
});

test('a successful save shows on the tile once the sheet closes', async () => {
  await mount();
  await openTile('home');
  await act(async () => { el('profile-pets-no').click(); });
  await pressEscape('home-sheet');
  expect(el('profile-tile-home-state').textContent).toBe('No pets · Northern');
});

test('Pip does not peek in while a sheet is open', async () => {
  const overdue = { id: 'a', nickname: 'Monty', next_water_due: new Date(Date.now() - 3 * 86400000 - 5000).toISOString() };
  careAPI.getDueToday.mockResolvedValue({ data: [overdue] });
  await mount(true);
  expect(el('pip-peek')).not.toBeNull();
  await openTile('care-style');
  expect(el('care-style-sheet')).not.toBeNull();
  expect(el('pip-peek')).toBeNull();
});
