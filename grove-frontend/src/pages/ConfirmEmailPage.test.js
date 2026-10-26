import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import ConfirmEmailPage from './ConfirmEmailPage';
import { authAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

let mockSearch = '';
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useSearchParams: () => [new URLSearchParams(mockSearch)],
}), { virtual: true });
jest.mock('@/lib/api', () => ({ authAPI: { confirmEmail: jest.fn() } }));
jest.mock('@/contexts/AuthContext', () => ({ useAuth: jest.fn() }));

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container;
let root;
const q = (id) => container.querySelector(`[data-testid="${id}"]`);
const mount = async (url) => {
  mockSearch = url.includes('?') ? url.split('?')[1] : '';
  await act(async () => { root.render(<ConfirmEmailPage />); });
  await act(async () => { await Promise.resolve(); });
};

beforeEach(() => {
  jest.clearAllMocks();
  useAuth.mockReturnValue({ user: null, fetchUser: jest.fn() });
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => { act(() => root.unmount()); container.remove(); });

test('a good link confirms, says so, and takes focus', async () => {
  authAPI.confirmEmail.mockResolvedValue({ data: { confirmed: true } });
  await mount('/confirm-email?token=abc');
  expect(authAPI.confirmEmail).toHaveBeenCalledWith('abc');
  expect(q('confirm-heading').textContent).toBe('You’re confirmed');
  expect(document.activeElement).toBe(q('confirm-heading'));
  expect(q('confirm-continue').textContent).toBe('Go to sign in');
});

test('signed in, Continue goes home', async () => {
  useAuth.mockReturnValue({ user: { id: 'u' }, fetchUser: jest.fn() });
  authAPI.confirmEmail.mockResolvedValue({ data: {} });
  await mount('/confirm-email?token=abc');
  expect(q('confirm-continue').textContent).toBe('Continue');
  await act(async () => { q('confirm-continue').click(); });
  expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
});

test('a used or expired link shows the server message, not a blank', async () => {
  authAPI.confirmEmail.mockRejectedValue({ response: { status: 400, data: { detail: 'This link has expired or was already used. Ask for a new one.' } } });
  await mount('/confirm-email?token=old');
  expect(q('confirm-heading').textContent).toBe('We couldn’t confirm that');
  expect(q('confirm-message').textContent).toContain('expired or was already used');
});

test('with the feature off the link says it is not active rather than failing silently', async () => {
  authAPI.confirmEmail.mockRejectedValue({ response: { status: 404, data: { detail: 'Not found' } } });
  await mount('/confirm-email?token=abc');
  expect(q('confirm-heading').textContent).toBe('We couldn’t confirm that');
});

test('a link with no token explains itself and calls nothing', async () => {
  await mount('/confirm-email');
  expect(authAPI.confirmEmail).not.toHaveBeenCalled();
  expect(q('confirm-message').textContent).toContain('missing its code');
});

test('an unreachable server says to check the connection', async () => {
  authAPI.confirmEmail.mockRejectedValue(new Error('network'));
  await mount('/confirm-email?token=abc');
  expect(q('confirm-message').textContent).toContain('Check your connection');
});
