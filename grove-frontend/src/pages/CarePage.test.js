import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import CarePage from './CarePage';
import { careAPI, waterAPI, plantAPI, userAPI, notificationsAPI } from '../lib/api';
import { toast } from 'sonner';

jest.mock('../lib/api', () => ({
  careAPI: { getDueToday: jest.fn(), createLog: jest.fn() },
  waterAPI: { logRound: jest.fn(), undoRound: jest.fn() },
  plantAPI: { getAll: jest.fn() },
  userAPI: { updateMe: jest.fn() },
  notificationsAPI: { scheduleReviews: jest.fn() },
  getFileUrl: (p) => p,
}));
jest.mock('sonner', () => ({ toast: { success: jest.fn(), error: jest.fn(), message: jest.fn() } }));
jest.mock('../lib/haptics', () => ({ impactLight: jest.fn(), impactMedium: jest.fn(), success: jest.fn(), spawnRipple: jest.fn() }));

const mockUpdateUser = jest.fn();
let mockUser = {};
jest.mock('../contexts/AuthContext', () => ({ useAuth: () => ({ user: mockUser, updateUser: mockUpdateUser }) }));
// Jest here cannot load react-router-dom v7 or the `@/` alias.
jest.mock('react-router-dom', () => ({ useNavigate: () => jest.fn() }), { virtual: true });
jest.mock('@/constants/emptyStates', () => ({ EMPTY_STATES: {} }), { virtual: true });
jest.mock('../components/PageHeader', () => ({
  PageHeader: ({ rightContent, children }) => <header>{rightContent}{children}</header>,
  FilterChips: ({ filters }) => <div data-testid="filters">{filters.map((f) => f.label).join('|')}</div>,
}));
jest.mock('../components/EmptyState', () => ({ EmptyState: () => <div data-testid="empty-state" /> }));
jest.mock('../components/CareLogModal', () => () => null);
jest.mock('../components/DailyMissionCard', () => () => null);
jest.mock('../components/NextLessonCard', () => () => null);
jest.mock('../components/FirstCareCelebration', () => () => null);
jest.mock('../components/SectionTutorial', () => () => null);
jest.mock('../components/WorkingTowardSection', () => () => null);
jest.mock('../components/DailyTriviaCard', () => () => null);

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString();
const DUE = [
  {
    id: 'p1',
    common_name: 'Pothos',
    status: 'urgent',
    next_water_due: daysAgo(3),
    last_watered_at: daysAgo(10),
    status_reason: "It's on a 7-day schedule, so the soil may be dry by now.",
  },
];

let container;
let root;
const q = (id) => container.querySelector(`[data-testid="${id}"]`);
const mount = async () => {
  await act(async () => { root.render(<CarePage />); });
};

beforeEach(() => {
  jest.clearAllMocks();
  mockUser = {};
  careAPI.getDueToday.mockResolvedValue({ data: DUE });
  plantAPI.getAll.mockResolvedValue({ data: { plants: DUE } });
  notificationsAPI.scheduleReviews.mockResolvedValue({ data: { plants: [] } });
  userAPI.updateMe.mockResolvedValue({ data: {} });
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

describe('gentle wording', () => {
  test('a plant past schedule reads as a check-in, with days since watering', async () => {
    await mount();
    const card = q('care-card');
    expect(card.textContent).toContain('Check-in time · watered 10 days ago');
    expect(card.textContent).not.toMatch(/overdue|urgent/i);
  });

  test('the filter says Needs a check, not Urgent', async () => {
    await mount();
    expect(q('filters').textContent).toBe('All due|Needs a check|Water today');
  });
});

describe('Simple / Detailed care tips', () => {
  test('Simple is the default: the exact step, no why', async () => {
    await mount();
    expect(q('care-text-simple').checked).toBe(true);
    expect(q('care-card-step').textContent).toBe("Check the top inch of soil. Water if it's dry.");
    expect(q('care-card-status-reason')).toBeNull();
  });

  test('Detailed adds the why', async () => {
    mockUser = { care_text_detail: 'detailed' };
    await mount();
    expect(q('care-text-detailed').checked).toBe(true);
    expect(q('care-card-step')).not.toBeNull();
    expect(q('care-card-status-reason').textContent).toBe("Why: It's on a 7-day schedule, so the soil may be dry by now.");
  });

  test('choosing Detailed saves it to the profile', async () => {
    await mount();
    await act(async () => { q('care-text-detailed').click(); });
    expect(mockUpdateUser).toHaveBeenCalledWith({ care_text_detail: 'detailed' });
    expect(userAPI.updateMe).toHaveBeenCalledWith({ care_text_detail: 'detailed' });
  });

  test('a failed save puts the old choice back and says so', async () => {
    userAPI.updateMe.mockRejectedValue(new Error('offline'));
    await mount();
    await act(async () => { q('care-text-detailed').click(); });
    expect(mockUpdateUser).toHaveBeenLastCalledWith({ care_text_detail: 'simple' });
    expect(toast.error).toHaveBeenCalled();
  });
});

describe('Undo on Water All', () => {
  test('after Water All, Undo reverts the round', async () => {
    waterAPI.logRound.mockResolvedValue({ data: { watered: 1, round_id: 'r1', first_care_pending: false } });
    waterAPI.undoRound.mockResolvedValue({ data: { undone: 1 } });
    await mount();
    await act(async () => { q('water-all-button').click(); });
    expect(q('undo-snackbar').textContent).toContain('Watered 1 plant');
    expect(document.activeElement).toBe(q('undo-snackbar-undo'));
    await act(async () => { q('undo-snackbar-undo').click(); });
    expect(waterAPI.undoRound).toHaveBeenCalledWith('r1');
    expect(toast.success).toHaveBeenCalledWith('Water round undone');
    expect(q('undo-snackbar')).toBeNull();
  });

  test('a failed undo shows the server reason and closes the bar', async () => {
    waterAPI.logRound.mockResolvedValue({ data: { watered: 1, round_id: 'r1' } });
    waterAPI.undoRound.mockRejectedValue({ response: { data: { detail: 'Too late to undo that round.' } } });
    await mount();
    await act(async () => { q('water-all-button').click(); });
    await act(async () => { q('undo-snackbar-undo').click(); });
    expect(toast.error).toHaveBeenCalledWith('Too late to undo that round.');
    expect(q('undo-snackbar')).toBeNull();
  });
});
