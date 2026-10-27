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
  HeaderAction: ({ children, icon: _icon, pressed: _pressed, ...p }) => <button type="button" {...p}>{children}</button>,
  FilterChips: ({ filters }) => <div data-testid="filters">{filters.map((f) => f.label).join('|')}</div>,
}));
jest.mock('../components/CareTabs', () => ({ CareTabs: () => null }));
// Radix needs the `@/` alias; a plain stand-in is enough to test the confirm step.
jest.mock('../components/ui/alert-dialog', () => {
  const Pass = ({ children }) => <div>{children}</div>;
  return {
    AlertDialog: ({ open, children }) => (open ? <div>{children}</div> : null),
    AlertDialogContent: ({ children, ...p }) => <div {...p}>{children}</div>,
    AlertDialogHeader: Pass, AlertDialogFooter: Pass, AlertDialogTitle: Pass, AlertDialogDescription: Pass,
    AlertDialogAction: ({ children, ...p }) => <button type="button" {...p}>{children}</button>,
    AlertDialogCancel: ({ children, ...p }) => <button type="button" {...p}>{children}</button>,
  };
});
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
const q = (id) => container.querySelector(`[data-testid="${id}"]`) || document.body.querySelector(`[data-testid="${id}"]`);
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
    expect(card.textContent).toContain('Last watered 10 days ago');
    expect(card.textContent).not.toMatch(/overdue|urgent/i);
  });

  test('no filter chips when there is nothing to choose between', async () => {
    await mount();
    // With one plant, "Needs a check" would show the same list as All due, so no choice is offered at all.
    expect(q('filters')).toBeNull();
  });
});

describe('filter chips', () => {
  test('with a mix of statuses each chip is a real choice', async () => {
    const mixed = [DUE[0], { ...DUE[0], id: 'p2', status: 'needs_water', nickname: 'Fern' }];
    careAPI.getDueToday.mockResolvedValue({ data: mixed });
    await mount();
    expect(q('filters').textContent).toBe('All due · 2|Needs a check · 1|Due today · 1');
  });
});

describe('Simple / Detailed care tips', () => {
  test('Simple is the default: the exact step, no why', async () => {
    await mount();
    expect(q('care-text-simple').getAttribute('aria-pressed')).toBe('true');
    expect(q('care-card-step').textContent).toBe("Check the top inch of soil. Water if it's dry.");
    expect(q('care-card-status-reason')).toBeNull();
  });

  test('Detailed adds the why', async () => {
    mockUser = { care_text_detail: 'detailed' };
    await mount();
    expect(q('care-text-detailed').getAttribute('aria-pressed')).toBe('true');
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

describe('Water All asks first', () => {
  test('opening it does not water anything until confirmed, and Not yet cancels', async () => {
    await mount();
    await act(async () => { q('water-all-button').click(); });
    expect(q('water-all-dialog').textContent).toContain('Water all');
    expect(waterAPI.logRound).not.toHaveBeenCalled();
    await act(async () => { q('water-all-cancel').click(); });
    expect(waterAPI.logRound).not.toHaveBeenCalled();
  });
});

describe('one plant', () => {
  test('Watered waters only that plant and offers Undo', async () => {
    waterAPI.logRound.mockResolvedValue({ data: { watered: 1, round_id: 'r9' } });
    await mount();
    await act(async () => { q('care-mark-done').click(); });
    expect(waterAPI.logRound).toHaveBeenCalledWith([DUE[0].id]);
    expect(q('undo-snackbar').textContent).toContain('Watered 1 plant');
  });

  test('a failed save says so and keeps the card', async () => {
    waterAPI.logRound.mockRejectedValue(new Error('network'));
    await mount();
    await act(async () => { q('care-mark-done').click(); });
    expect(toast.error).toHaveBeenCalled();
    expect(q('care-card')).not.toBeNull();
    expect(q('undo-snackbar')).toBeNull();
  });
});

describe('Undo on Water All', () => {
  test('after Water All, Undo reverts the round', async () => {
    waterAPI.logRound.mockResolvedValue({ data: { watered: 1, round_id: 'r1', first_care_pending: false } });
    waterAPI.undoRound.mockResolvedValue({ data: { undone: 1 } });
    await mount();
    await act(async () => { q('water-all-button').click(); });
    await act(async () => { q('water-all-confirm').click(); });
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
    await act(async () => { q('water-all-confirm').click(); });
    await act(async () => { q('undo-snackbar-undo').click(); });
    expect(toast.error).toHaveBeenCalledWith('Too late to undo that round.');
    expect(q('undo-snackbar')).toBeNull();
  });
});

describe('end-of-round summary', () => {
  const inDays = (n) => new Date(Date.now() + n * 86400000).toISOString();

  test('when the list empties after logging care, a calm summary replaces the bare empty state', async () => {
    jest.useFakeTimers();
    try {
      waterAPI.logRound.mockResolvedValue({ data: { watered: 2, round_id: 'r2' } });
      const due = [DUE[0], { ...DUE[0], id: 'p2', nickname: 'Fern', status: 'needs_water' }];
      careAPI.getDueToday.mockResolvedValueOnce({ data: due }).mockResolvedValue({ data: [] });
      plantAPI.getAll.mockResolvedValue({ data: { plants: [
        { id: 'p1', common_name: 'Pothos', next_water_due: inDays(5) },
        { id: 'p2', nickname: 'Fern', common_name: 'Boston fern', next_water_due: inDays(2) },
      ] } });
      await mount();
      expect(q('round-summary')).toBeNull();
      await act(async () => { q('water-all-button').click(); });
      await act(async () => { q('water-all-confirm').click(); });
      await act(async () => { jest.advanceTimersByTime(400); });
      expect(q('round-summary-title').textContent).toBe('2 plants tended.');
      expect(q('round-summary-names').textContent).toBe('Pothos and Fern.');
      const weekday = new Date(inDays(2)).toLocaleDateString(undefined, { weekday: 'long' });
      expect(q('round-summary-next').textContent).toBe(`Next up: Fern, ${weekday}`);
      expect(q('round-summary-lesson').textContent).toBe('Do a one-minute lesson');
      expect(q('care-session-bar').textContent).toContain('2 plants checked');
      expect(q('care-session-bar').textContent).not.toMatch(/keep going/i);
      await act(async () => { q('round-summary-done').click(); });
      expect(q('round-summary')).toBeNull();
    } finally {
      jest.useRealTimers();
    }
  });

  test('no summary when nothing was logged this visit', async () => {
    careAPI.getDueToday.mockResolvedValue({ data: [] });
    await mount();
    expect(q('round-summary')).toBeNull();
  });
});
