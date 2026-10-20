import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { useFirstCareCelebration } from './useFirstCareCelebration';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container;
let root;
let api;

function Probe({ user, updateUser }) {
  api = useFirstCareCelebration(user, updateUser);
  return null;
}

beforeEach(() => {
  container = document.createElement('div');
  root = createRoot(container);
});
afterEach(() => act(() => root.unmount()));

const mount = (user, updateUser) => act(() => root.render(<Probe user={user} updateUser={updateUser} />));

test('the celebration opens without marking it celebrated, so the offer waits', () => {
  const updateUser = jest.fn();
  mount({ first_care_celebrated: false }, updateUser);
  act(() => api.celebrate(true));
  expect(api.open).toBe(true);
  expect(updateUser).not.toHaveBeenCalled();
});

test('closing marks it celebrated, once', () => {
  const updateUser = jest.fn();
  mount({ first_care_celebrated: false }, updateUser);
  act(() => api.celebrate(true));
  act(() => api.close());
  expect(api.open).toBe(false);
  expect(updateUser).toHaveBeenCalledTimes(1);
  expect(updateUser).toHaveBeenCalledWith({ first_care_celebrated: true });
  act(() => api.celebrate(true));
  expect(api.open).toBe(false);
});

test('does nothing when it was already celebrated or no first care is pending', () => {
  mount({ first_care_celebrated: true }, jest.fn());
  act(() => api.celebrate(true));
  expect(api.open).toBe(false);
  mount({ first_care_celebrated: false }, jest.fn());
  act(() => api.celebrate(false));
  expect(api.open).toBe(false);
});
