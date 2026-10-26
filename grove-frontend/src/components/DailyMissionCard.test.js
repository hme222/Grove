import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import DailyMissionCard from './DailyMissionCard';
import { missionAPI } from '../lib/api';

jest.mock('../lib/api', () => ({
  missionAPI: { getDaily: jest.fn() },
}));
jest.mock('../lib/haptics', () => ({ impactLight: jest.fn() }));
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({ useNavigate: () => mockNavigate }), { virtual: true });

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const CHECK_IN = {
  id: 'm1', mission_type: 'plant_check_in', title: 'Plant check-in',
  subtitle: 'A 20-second soil check on one plant.', cta: 'Check a plant', cta_path: '/care',
  icon: 'droplet', completed: false,
};

let container;
let root;
const q = (id) => container.querySelector(`[data-testid="${id}"]`);
const mount = async (mission) => {
  missionAPI.getDaily.mockResolvedValue({ data: mission });
  await act(async () => { root.render(<DailyMissionCard />); });
};

beforeEach(() => {
  jest.clearAllMocks();
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

test('the daily mission is a plant check-in with one button that opens Care', async () => {
  await mount(CHECK_IN);
  expect(q('daily-mission-title').textContent).toBe('Plant check-in');
  expect(container.textContent).toContain('20-second');
  await act(async () => { q('daily-mission-cta').click(); });
  expect(mockNavigate).toHaveBeenCalledWith('/care');
});

test('there is no way to mark a mission done by hand, whatever its type', async () => {
  for (const type of ['plant_check_in', 'health_check', 'photo_log', 'community_engage']) {
    act(() => root.unmount());
    root = createRoot(container);
    await mount({ ...CHECK_IN, mission_type: type });
    expect(q('daily-mission-manual-complete')).toBeNull();
    expect(container.textContent).not.toMatch(/mark done/i);
  }
});

test('a completed mission keeps the nice work state and drops the button', async () => {
  await mount({ ...CHECK_IN, completed: true, completed_at: '2026-10-26T09:00:00Z' });
  expect(q('daily-mission-card').getAttribute('data-mission-completed')).toBe('true');
  expect(q('daily-mission-title').textContent).toBe('Mission complete');
  expect(container.textContent).toContain('Nice work');
  expect(q('daily-mission-cta')).toBeNull();
});

test('nothing on the card implies points or a currency', async () => {
  await mount({ ...CHECK_IN, xp: 10, xp_awarded: 10 });
  expect(container.textContent.toLowerCase()).not.toMatch(/\bxp\b|points|streak/);
});
