import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { CareTabs } from './CareTabs';

let mockUser = null;
let mockPath = '/care/today';
jest.mock('react-router-dom', () => ({ useLocation: () => ({ pathname: mockPath }), useNavigate: () => jest.fn(), Link: ({ to, children, ...rest }) => require('react').createElement('a', { href: to, ...rest }, children) }), { virtual: true });
jest.mock('../contexts/AuthContext', () => ({ useAuth: () => ({ user: mockUser }) }));
jest.mock('./AppLink', () => ({ __esModule: true, default: ({ to, children, ...rest }) => require('react').createElement('a', { href: to, ...rest }, children) }));

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe('CareTabs', () => {
  let container;
  let root;
  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    HTMLCanvasElement.prototype.getContext = () => null;
  });
  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });
  const render = (user, path = '/care/today') => {
    mockUser = user;
    mockPath = path;
    act(() => root.render(<CareTabs />));
  };
  const pip = () => container.querySelector('[data-testid="care-pip-tab"]');

  test('a first-run owner sees only To do and Progress', () => {
    render({ nook_enabled: false });
    expect(container.querySelectorAll('a')).toHaveLength(2);
    expect(pip()).toBeNull();
  });

  test('after the room offer is answered, Pip sits beside Progress, even for "not now"', () => {
    render({ nook_enabled: false, nook_offered_at: '2026-11-03T10:00:00Z' });
    expect([...container.querySelectorAll('a')].map((a) => a.textContent)).toEqual(['To do', 'Progress', 'Pip']);
    render({ nook_enabled: true });
    expect(pip()).not.toBeNull();
    expect(pip().getAttribute('href')).toBe('/nook');
  });

  test('on the nook the Pip tab is the current view, and its picture is hidden from screen readers', () => {
    render({ nook_enabled: true }, '/nook');
    expect(pip().getAttribute('aria-current')).toBe('page');
    expect(container.querySelector('[data-testid="care-today-tab"]').hasAttribute('aria-current')).toBe(false);
    expect(pip().querySelector('canvas').getAttribute('aria-hidden')).toBe('true');
  });
});
