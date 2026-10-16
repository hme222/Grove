import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import UndoSnackbar from './UndoSnackbar';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container;
let root;
const q = (id) => container.querySelector(`[data-testid="${id}"]`);

beforeEach(() => {
  jest.useFakeTimers();
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  jest.useRealTimers();
});

const render = (props) => act(() => root.render(<UndoSnackbar message="Watered 3 plants" duration={8000} {...props} />));

test('announces politely and focuses Undo when asked', () => {
  render({ onUndo: jest.fn(), onDismiss: jest.fn(), autoFocus: true });
  expect(q('undo-snackbar').getAttribute('role')).toBe('status');
  expect(document.activeElement).toBe(q('undo-snackbar-undo'));
});

test('dismisses itself after the duration when left alone', () => {
  const onDismiss = jest.fn();
  render({ onUndo: jest.fn(), onDismiss });
  act(() => { jest.advanceTimersByTime(7900); });
  expect(onDismiss).not.toHaveBeenCalled();
  act(() => { jest.advanceTimersByTime(200); });
  expect(onDismiss).toHaveBeenCalledTimes(1);
});

test('the timer pauses while it has focus, so keyboard users are not timed out', () => {
  const onDismiss = jest.fn();
  render({ onUndo: jest.fn(), onDismiss, autoFocus: true });
  act(() => { jest.advanceTimersByTime(60000); });
  expect(onDismiss).not.toHaveBeenCalled();
});

test('Undo button calls onUndo; Escape dismisses', () => {
  const onUndo = jest.fn();
  const onDismiss = jest.fn();
  render({ onUndo, onDismiss, autoFocus: true });
  act(() => { q('undo-snackbar-undo').click(); });
  expect(onUndo).toHaveBeenCalled();
  act(() => { q('undo-snackbar').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); });
  expect(onDismiss).toHaveBeenCalled();
});
