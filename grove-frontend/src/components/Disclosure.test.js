import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import Disclosure from './Disclosure';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

test('a native details with a 44px UI-face summary, a chevron that turns when open, and one fill', async () => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => { root.render(<Disclosure title="Photo credits" testId="d"><p>Body</p></Disclosure>); });
  const d = container.querySelector('[data-testid="d"]');
  expect(d.tagName).toBe('DETAILS');
  expect(d.className).toContain('bg-grove-canopy');
  const summary = d.querySelector('summary');
  expect(summary.className).toContain('min-h-touch');
  expect(summary.className).toContain('font-ui');
  expect(summary.className).toContain('text-sm');
  expect(summary.className).toContain('font-medium');
  const chevron = summary.querySelector('svg');
  expect(chevron.getAttribute('aria-hidden')).toBe('true');
  expect(chevron.getAttribute('class')).toContain('motion-safe:transition-transform');
  expect(chevron.getAttribute('class')).toContain('group-open:rotate-180');
  act(() => root.unmount());
  container.remove();
});
