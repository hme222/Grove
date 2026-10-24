import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import SetupNote, { REMINDER_NOTE_KEY, PETS_NOTE_KEY } from './SetupNote';
import { notificationAPI, userAPI } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

// Jest here cannot load react-router-dom v7.
jest.mock('react-router-dom', () => ({ useNavigate: () => jest.fn() }), { virtual: true });
jest.mock('../lib/api', () => ({
  notificationAPI: { getPreferences: jest.fn(), updatePreferences: jest.fn() },
  userAPI: { updateMe: jest.fn() },
}));
jest.mock('../contexts/AuthContext', () => ({ useAuth: jest.fn() }));

global.IS_REACT_ACT_ENVIRONMENT = true;

let el;
let root;
const updateUser = jest.fn();
const flush = () => act(async () => { await new Promise((r) => setTimeout(r, 0)); });
const q = (id) => el.querySelector(`[data-testid="${id}"]`);

async function mount(user, remindersOn) {
  useAuth.mockReturnValue({ user, updateUser });
  notificationAPI.getPreferences.mockResolvedValue({ data: { push_care_due: remindersOn } });
  el = document.createElement('div');
  document.body.appendChild(el);
  root = createRoot(el);
  await act(async () => { root.render(<SetupNote />); });
  await flush();
}

beforeEach(() => {
  window.localStorage.clear();
  jest.clearAllMocks();
  userAPI.updateMe.mockResolvedValue({});
  notificationAPI.updatePreferences.mockResolvedValue({});
});
afterEach(() => { act(() => root.unmount()); el.remove(); });

test('asks about reminders first, then pets, in the same place', async () => {
  await mount({ has_pets: null }, true);
  expect(q('reminder-note')).not.toBeNull();
  expect(q('pets-note')).toBeNull();
  await act(async () => { q('reminder-keep').click(); });
  expect(q('reminder-note')).toBeNull();
  expect(q('pets-note')).not.toBeNull();
  expect(window.localStorage.getItem(REMINDER_NOTE_KEY)).toBe('1');
});

test('turning reminders off saves the choice', async () => {
  await mount({ has_pets: null }, true);
  await act(async () => { q('reminder-off').click(); });
  expect(notificationAPI.updatePreferences).toHaveBeenCalledWith({ push_care_due: false });
});

test('answering yes or no to pets saves it to the profile', async () => {
  await mount({ has_pets: null }, false);
  expect(q('reminder-note')).toBeNull();
  await act(async () => { q('pets-yes').click(); });
  expect(userAPI.updateMe).toHaveBeenCalledWith({ has_pets: true });
  expect(updateUser).toHaveBeenCalledWith({ has_pets: true });
});

test('does not ask again once pets are answered, or when the person said not now', async () => {
  await mount({ has_pets: false }, false);
  expect(q('pets-note')).toBeNull();
  act(() => root.unmount()); el.remove();
  window.localStorage.setItem(PETS_NOTE_KEY, '1');
  await mount({ has_pets: null }, false);
  expect(q('pets-note')).toBeNull();
});
