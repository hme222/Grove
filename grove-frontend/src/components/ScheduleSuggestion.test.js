import React, { act } from 'react';
import { createRoot } from 'react-dom/client';

jest.mock('@/lib/api', () => ({
  plantAPI: { getScheduleSuggestion: jest.fn(), dismissScheduleSuggestion: jest.fn() },
}));
jest.mock('sonner', () => ({ toast: { error: jest.fn() } }));

import { plantAPI } from '@/lib/api';
import ScheduleSuggestion, { HEADING_ID } from './ScheduleSuggestion';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const SUGGESTION = { days: 9, current_days: 7, basis: 'soil', reason: 'Your last two soil checks found the soil still damp when watering was due.' };

const setup = async (onAccept = jest.fn().mockResolvedValue()) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const heading = document.createElement('h3');
  heading.id = HEADING_ID; heading.tabIndex = -1;
  document.body.appendChild(heading);
  const root = createRoot(container);
  await act(async () => { root.render(<ScheduleSuggestion plantId="p1" days={7} onAccept={onAccept} />); });
  return { container, heading, onAccept, done: () => { act(() => root.unmount()); container.remove(); heading.remove(); } };
};

beforeEach(() => jest.clearAllMocks());

test('shows nothing when there is no suggestion', async () => {
  plantAPI.getScheduleSuggestion.mockResolvedValue({ data: { suggestion: null } });
  const { container, done } = await setup();
  expect(container.querySelector('[data-testid="schedule-suggestion"]')).toBeNull();
  done();
});

test('shows nothing, and no error, when the request fails', async () => {
  plantAPI.getScheduleSuggestion.mockRejectedValue(new Error('offline'));
  const { container, done } = await setup();
  expect(container.querySelector('[data-testid="schedule-suggestion"]')).toBeNull();
  done();
});

test('shows the number and the reason, as a question, with a region name', async () => {
  plantAPI.getScheduleSuggestion.mockResolvedValue({ data: { suggestion: SUGGESTION } });
  const { container, done } = await setup();
  const region = container.querySelector('[data-testid="schedule-suggestion"]');
  expect(region.getAttribute('aria-labelledby')).toBe('schedule-suggestion-title');
  expect(region.textContent).toContain('Try every 9 days?');
  expect(region.textContent).toContain('still damp');
  expect(region.textContent).toContain('7 days now');
  done();
});

test('Use it saves the new interval, hides the card and returns focus to the section heading', async () => {
  plantAPI.getScheduleSuggestion.mockResolvedValue({ data: { suggestion: SUGGESTION } });
  const { container, heading, onAccept, done } = await setup();
  await act(async () => { container.querySelector('[data-testid="schedule-suggestion-accept"]').click(); });
  expect(onAccept).toHaveBeenCalledWith(9);
  expect(container.querySelector('[data-testid="schedule-suggestion"]')).toBeNull();
  expect(document.activeElement).toBe(heading);
  done();
});

test('the card stays when saving fails, so the person can try again', async () => {
  plantAPI.getScheduleSuggestion.mockResolvedValue({ data: { suggestion: SUGGESTION } });
  const { container, done } = await setup(jest.fn().mockRejectedValue(new Error('nope')));
  await act(async () => { container.querySelector('[data-testid="schedule-suggestion-accept"]').click(); });
  expect(container.querySelector('[data-testid="schedule-suggestion"]')).not.toBeNull();
  done();
});

test('Not now tells the server which number to stop suggesting and hides the card', async () => {
  plantAPI.getScheduleSuggestion.mockResolvedValue({ data: { suggestion: SUGGESTION } });
  plantAPI.dismissScheduleSuggestion.mockResolvedValue({});
  const { container, done } = await setup();
  await act(async () => { container.querySelector('[data-testid="schedule-suggestion-dismiss"]').click(); });
  expect(plantAPI.dismissScheduleSuggestion).toHaveBeenCalledWith('p1', 9);
  expect(container.querySelector('[data-testid="schedule-suggestion"]')).toBeNull();
  done();
});
