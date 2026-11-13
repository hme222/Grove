import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { usePipPrefs } from './pipPrefs';
import { userAPI } from './api';

jest.mock('./api', () => ({ userAPI: { updateMe: jest.fn() } }));
let mockUser = {};
const mockUpdateUser = jest.fn();
jest.mock('../contexts/AuthContext', () => ({ useAuth: () => ({ user: mockUser, updateUser: mockUpdateUser }) }));

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const read = async (user) => {
  mockUser = user;
  let out;
  const Probe = () => { out = usePipPrefs(); return null; };
  const container = document.createElement('div');
  const root = createRoot(container);
  await act(async () => { root.render(<Probe />); });
  return { get: () => out, done: () => act(() => root.unmount()) };
};

beforeEach(() => { jest.clearAllMocks(); });

test('a user who never set anything has the switches on, but Pip shows nothing until he has said hello', async () => {
  const p = await read({ id: 'u1' });
  expect(p.get().pipOn).toBe(true);
  expect(p.get().peeksPref).toBe(true);
  expect(p.get().introduced).toBe(false);
  expect(p.get().shows).toBe(false);
  expect(p.get().peeksOn).toBe(false);
  p.done();
});

test('once introduced, Pip shows and may peek', async () => {
  const p = await read({ id: 'u1', pip_introduced: true });
  expect(p.get().shows).toBe(true);
  expect(p.get().peeksOn).toBe(true);
  p.done();
});

test('turning Pip off turns the peeks off too, but not the other way round', async () => {
  let p = await read({ pip_enabled: false, pip_introduced: true });
  expect(p.get().pipOn).toBe(false);
  expect(p.get().shows).toBe(false);
  expect(p.get().peeksPref).toBe(false);
  expect(p.get().peeksOn).toBe(false);
  p.done();
  p = await read({ pip_peeks_enabled: false, pip_introduced: true });
  expect(p.get().pipOn).toBe(true);
  expect(p.get().shows).toBe(true);
  expect(p.get().peeksOn).toBe(false);
  p.done();
});

test('nobody signed in means no Pip', async () => {
  const p = await read(null);
  expect(p.get().pipOn).toBe(false);
  p.done();
});

test('save sends the patch and updates the signed-in user', async () => {
  userAPI.updateMe.mockResolvedValue({ data: { pip_enabled: false } });
  const p = await read({});
  await act(async () => { await p.get().save({ pip_enabled: false }); });
  expect(userAPI.updateMe).toHaveBeenCalledWith({ pip_enabled: false });
  expect(mockUpdateUser).toHaveBeenCalledWith({ pip_enabled: false });
  p.done();
});
