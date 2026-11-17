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

// A page with a main region and something that opened the celebration, which may go away before it closes.
function Page({ open, showOpener, onClose }) {
  return (
    <main id="main-content" tabIndex={-1}>
      {showOpener && <button type="button" data-testid="opener">Log care</button>}
      <FirstCareCelebration open={open} onClose={onClose} logged={{ plantName: 'Monty', actions: ['water'] }} />
    </main>
  );
}
// Radix gives focus back in a setTimeout(0) after the dialog unmounts.
const afterClose = () => act(async () => { await new Promise((r) => setTimeout(r, 0)); });

test('closing gives focus back to what opened it when it is still there', async () => {
  await act(async () => root.render(<Page open={false} showOpener />));
  const opener = document.querySelector('[data-testid="opener"]');
  opener.focus();
  await act(async () => root.render(<Page open showOpener />));
  await act(async () => root.render(<Page open={false} showOpener />));
  await afterClose();
  expect(document.activeElement === opener).toBe(true);
});

test('when what opened it has gone (the care form closed), focus goes to the page, not the body', async () => {
  await act(async () => root.render(<Page open={false} showOpener />));
  document.querySelector('[data-testid="opener"]').focus();
  await act(async () => root.render(<Page open showOpener />));
  await act(async () => root.render(<Page open showOpener={false} />));
  await act(async () => root.render(<Page open={false} showOpener={false} />));
  await afterClose();
  expect(document.activeElement === document.getElementById('main-content')).toBe(true);
});
