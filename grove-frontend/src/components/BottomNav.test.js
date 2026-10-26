import React, { act } from 'react';
import { createRoot } from 'react-dom/client';

jest.mock('react-router-dom', () => ({
  useLocation: () => ({ pathname: '/care/today' }),
  useNavigate: () => jest.fn(),
}), { virtual: true });

import BottomNav from './BottomNav';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

test('the tab bar draws four tabs as links and marks the current one', async () => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => { root.render(<BottomNav />); });
  const tabs = container.querySelectorAll('a[href]');
  expect(tabs.length).toBe(4);
  expect(container.querySelector('[aria-current="page"]').textContent).toBe('Today');
  act(() => root.unmount());
  container.remove();
});
