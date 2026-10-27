import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import StatusDot, { STATUS_LABELS } from './StatusDot';
import { CONDITION_LABELS } from '../nook/nookCopy';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

test('one visible vocabulary', () => {
  expect(STATUS_LABELS).toMatchObject({ healthy: 'Healthy', needs_water: 'Due soon', urgent: 'Needs a check' });
});

test('the nook tiles use the same words', () => {
  expect(CONDITION_LABELS['due-soon']).toBe(STATUS_LABELS.needs_water);
  expect(CONDITION_LABELS['needs-attention']).toBe(STATUS_LABELS.urgent);
});

test('showLabel shows the word beside the icon and allows it to wrap on narrow widths', () => {
  const host = document.createElement('div'); document.body.appendChild(host);
  const root = createRoot(host);
  act(() => { root.render(<StatusDot status="urgent" showLabel />); });
  expect(host.textContent).toBe('Needs a check');
  expect(host.firstChild.className).toContain('max-w-full');
  expect(host.querySelector('.sr-only')).toBeNull();
  act(() => root.unmount()); host.remove();
});
