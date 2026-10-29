import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import FirstCareCelebration from './FirstCareCelebration';

jest.mock('../lib/api', () => ({ userAPI: { celebrateFirstCare: jest.fn().mockResolvedValue({}) } }));
jest.mock('../lib/haptics', () => ({ success: jest.fn(), impactLight: jest.fn() }));
jest.mock('../lib/share', () => ({ shareInvite: jest.fn() }));

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container;
let root;
beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

test('the celebration is a named dialog, focus lands on Keep going, and Escape closes it', async () => {
  const onClose = jest.fn();
  await act(async () => root.render(<FirstCareCelebration open onClose={onClose} logged={{ plantName: 'Monty', actions: ['water'] }} />));
  const dialog = document.querySelector('[role="dialog"]');
  expect(dialog).not.toBeNull();
  expect(document.getElementById(dialog.getAttribute('aria-labelledby')).textContent).toBe('Your grove remembers.');
  expect(document.activeElement).toBe(document.querySelector('[data-testid="first-care-celebration-cta"]'));
  await act(async () => { dialog.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); });
  expect(onClose).toHaveBeenCalled();
});
