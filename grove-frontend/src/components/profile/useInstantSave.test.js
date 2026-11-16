import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import useInstantSave from './useInstantSave';
import SaveError from './SaveError';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const MSG = 'Couldn’t save that.';
let api;
const ctl = React.createRef();
const Probe = () => {
  api = useInstantSave();
  return (
    <>
      <input data-testid="ctl" ref={ctl} disabled={api.busy} />
      <SaveError id="ctl-error" error={api.error} onRetry={api.retry} testId="err" focusAfter={ctl} />
    </>
  );
};
let container;
let root;
beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => { root.render(<Probe />); });
});
afterEach(() => { act(() => root.unmount()); container.remove(); });

test('on success apply runs and revert does not', async () => {
  const apply = jest.fn(); const revert = jest.fn(); const persist = jest.fn().mockResolvedValue();
  await act(async () => { await api.run(apply, persist, revert); });
  expect(apply).toHaveBeenCalledTimes(1);
  expect(persist).toHaveBeenCalledTimes(1);
  expect(revert).not.toHaveBeenCalled();
  expect(api.error).toBe('');
  expect(container.querySelector('[role="alert"]')).toBeNull();
});

test('on failure revert runs and the error shows', async () => {
  const apply = jest.fn(); const revert = jest.fn(); const persist = jest.fn().mockRejectedValue(new Error('x'));
  await act(async () => { await api.run(apply, persist, revert); });
  expect(revert).toHaveBeenCalledTimes(1);
  expect(api.error).toBe(MSG);
  expect(container.querySelector('[role="alert"]').textContent).toContain(MSG);
  expect(container.querySelector('button').textContent).toBe('Try again');
});

test('retry reapplies, succeeds and clears the error', async () => {
  const apply = jest.fn(); const revert = jest.fn();
  const persist = jest.fn().mockRejectedValueOnce(new Error('x')).mockResolvedValue();
  await act(async () => { await api.run(apply, persist, revert); });
  await act(async () => { container.querySelector('button').click(); });
  expect(apply).toHaveBeenCalledTimes(2);
  expect(persist).toHaveBeenCalledTimes(2);
  expect(revert).toHaveBeenCalledTimes(1);
  expect(api.error).toBe('');
  expect(container.querySelector('[role="alert"]')).toBeNull();
});

test('retry that fails again reverts again and keeps the error', async () => {
  const apply = jest.fn(); const revert = jest.fn(); const persist = jest.fn().mockRejectedValue(new Error('x'));
  await act(async () => { await api.run(apply, persist, revert); });
  await act(async () => { await api.retry(); });
  expect(revert).toHaveBeenCalledTimes(2);
  expect(api.error).toBe(MSG);
});

test('a second run while busy is ignored', async () => {
  let release;
  const persist = jest.fn(() => new Promise((r) => { release = r; }));
  const apply = jest.fn(); const revert = jest.fn();
  let first;
  await act(async () => { first = api.run(apply, persist, revert); });
  expect(api.busy).toBe(true);
  const apply2 = jest.fn(); const persist2 = jest.fn().mockResolvedValue();
  await act(async () => { await api.run(apply2, persist2, revert); });
  expect(apply2).not.toHaveBeenCalled();
  expect(persist2).not.toHaveBeenCalled();
  await act(async () => { release(); await first; });
  expect(api.busy).toBe(false);
});

test('no state update after unmount', async () => {
  const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
  let release;
  const persist = jest.fn(() => new Promise((r) => { release = r; }));
  let p;
  await act(async () => { p = api.run(jest.fn(), persist, jest.fn()); });
  act(() => root.unmount());
  await act(async () => { release(); await p; });
  expect(spy).not.toHaveBeenCalled();
  spy.mockRestore();
  root = createRoot(container);
});

test('SaveError renders nothing without an error', () => {
  act(() => { root.render(<SaveError error="" onRetry={() => {}} />); });
  expect(container.innerHTML).toBe('');
});

test('the id renders on the alert', async () => {
  await act(async () => { await api.run(jest.fn(), jest.fn().mockRejectedValue(new Error('x')), jest.fn()); });
  expect(container.querySelector('[role="alert"]').id).toBe('ctl-error');
});

test('apply throwing reverts, sets the error, and a later run still works', async () => {
  const revert = jest.fn();
  await act(async () => { await api.run(() => { throw new Error('x'); }, jest.fn(), revert); });
  expect(revert).toHaveBeenCalledTimes(1);
  expect(api.error).toBe(MSG);
  const persist = jest.fn().mockResolvedValue();
  await act(async () => { await api.run(jest.fn(), persist, revert); });
  expect(persist).toHaveBeenCalledTimes(1);
  expect(api.error).toBe('');
});

test('focus lands on a control that is disabled while busy after a successful retry', async () => {
  const persist = jest.fn().mockRejectedValueOnce(new Error('x')).mockResolvedValue();
  await act(async () => { await api.run(jest.fn(), persist, jest.fn()); });
  const btn = container.querySelector('button');
  btn.focus();
  await act(async () => { btn.click(); });
  await act(async () => { await new Promise((r) => setTimeout(r, 0)); });
  expect(container.querySelector('[data-testid="ctl"]').disabled).toBe(false);
  expect(document.activeElement).toBe(container.querySelector('[data-testid="ctl"]'));
});
