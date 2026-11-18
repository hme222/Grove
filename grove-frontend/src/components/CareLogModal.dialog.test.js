// The real Radix dialog (CareLogModal.test.js mocks it): the dialog is named by its title, focus starts on the
// title, and Radix's missing-title warning does not fire.
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import CareLogModal from './CareLogModal';

jest.mock('../lib/api', () => ({ careAPI: { createLog: jest.fn() } }));
jest.mock('sonner', () => ({ toast: { success: jest.fn(), error: jest.fn(), message: jest.fn() } }));
jest.mock('../lib/haptics', () => ({ impactLight: jest.fn(), impactMedium: jest.fn(), success: jest.fn(), spawnRipple: jest.fn() }));

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

test('is labeled by its title, focuses it, and raises no missing-title warning', async () => {
  const errors = jest.spyOn(console, 'error').mockImplementation(() => {});
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(<CareLogModal open onClose={() => {}} plantId="p1" plantName="Monty" onLogged={() => {}} />);
  });
  await act(async () => {});
  const dialog = document.querySelector('[role="dialog"]');
  const title = document.querySelector('[data-testid="care-log-title"]');
  expect(document.getElementById(dialog.getAttribute('aria-labelledby'))).toBe(title);
  expect(title.textContent).toContain('Log care for Monty');
  expect(document.activeElement).toBe(title);
  const titleWarnings = errors.mock.calls.filter((c) => String(c[0]).includes('requires a `DialogTitle`'));
  expect(titleWarnings).toHaveLength(0);
  act(() => root.unmount());
  container.remove();
  errors.mockRestore();
});
