import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import ForgotPasswordPage from './ForgotPasswordPage';
import ResetPasswordPage from './ResetPasswordPage';
import { authAPI } from '../lib/api';

jest.mock('../lib/api', () => ({ authAPI: { forgotPassword: jest.fn(), resetPassword: jest.fn() } }));
jest.mock('react-router-dom', () => ({
  Link: ({ children, to, ...p }) => <a href={to} {...p}>{children}</a>,
  useSearchParams: () => [new URLSearchParams(globalThis.__search || '')],
}), { virtual: true });
jest.mock('@/components/brand/FloraGroveWordmark', () => ({ FloraGroveWordmark: () => <span>FloraGrove</span> }), { virtual: true });

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container;
let root;
const q = (id) => container.querySelector(`[data-testid="${id}"]`);
const type = async (id, value) => {
  const el = q(id);
  const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
  await act(async () => { set.call(el, value); el.dispatchEvent(new Event('input', { bubbles: true })); });
};
const submit = async (id) => { await act(async () => { q(id).closest('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); }); };

beforeEach(() => {
  jest.clearAllMocks();
  globalThis.__search = '';
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => { act(() => root.unmount()); container.remove(); });

test('asking for a link says the same thing for every address', async () => {
  authAPI.forgotPassword.mockResolvedValue({ data: { sent: true } });
  await act(async () => { root.render(<ForgotPasswordPage />); });
  await type('forgot-email', 'a@b.co');
  await submit('forgot-submit');
  expect(authAPI.forgotPassword).toHaveBeenCalledWith('a@b.co');
  expect(q('forgot-sent').textContent).toMatch(/If there is a FloraGrove account/);
});

test('a dropped connection is not told as "sent"', async () => {
  authAPI.forgotPassword.mockRejectedValue(new Error('Network Error'));
  await act(async () => { root.render(<ForgotPasswordPage />); });
  await type('forgot-email', 'a@b.co');
  await submit('forgot-submit');
  expect(q('forgot-sent')).toBeNull();
  expect(q('forgot-error').textContent).toMatch(/connection/);
});

test('a new password of five characters is refused without asking the server', async () => {
  globalThis.__search = 'token=abc';
  await act(async () => { root.render(<ResetPasswordPage />); });
  await type('reset-password', '12345');
  await submit('reset-submit');
  expect(authAPI.resetPassword).not.toHaveBeenCalled();
  expect(q('reset-error').textContent).toMatch(/at least 6/);
});

test('a good password goes to the server with the link code and ends on a sign-in button', async () => {
  globalThis.__search = 'token=abc';
  authAPI.resetPassword.mockResolvedValue({ data: { reset: true } });
  await act(async () => { root.render(<ResetPasswordPage />); });
  await type('reset-password', 'newpass1');
  await submit('reset-submit');
  expect(authAPI.resetPassword).toHaveBeenCalledWith('abc', 'newpass1');
  expect(q('reset-done').textContent).toMatch(/Password changed/);
});

test('an expired link shows the server reason', async () => {
  globalThis.__search = 'token=abc';
  authAPI.resetPassword.mockRejectedValue({ response: { status: 400, data: { detail: 'This link has expired or was already used. Ask for a new one.' } } });
  await act(async () => { root.render(<ResetPasswordPage />); });
  await type('reset-password', 'newpass1');
  await submit('reset-submit');
  expect(q('reset-error').textContent).toMatch(/expired/);
});
