import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import CareTextToggle from './CareTextToggle';

let host; let root;
const mount = (props) => { host = document.createElement('div'); document.body.appendChild(host); root = createRoot(host); act(() => { root.render(<CareTextToggle {...props} />); }); };
afterEach(() => { act(() => root.unmount()); host.remove(); });
const q = (id) => host.querySelector(`[data-testid="${id}"]`);

test('two chip buttons in a labelled group, the chosen one pressed', () => {
  mount({ value: 'simple' });
  expect(host.querySelector('[role="group"]').getAttribute('aria-label')).toBe('Care tips detail');
  expect(q('care-text-simple').getAttribute('aria-pressed')).toBe('true');
  expect(q('care-text-detailed').getAttribute('aria-pressed')).toBe('false');
});

test('the hint for the current choice is visible text, not a tooltip', () => {
  mount({ value: 'simple' });
  expect(q('care-text-hint').textContent).toBe('Just the step');
  act(() => root.unmount());
  host.remove();
  mount({ value: 'detailed' });
  expect(q('care-text-hint').textContent).toBe('Step plus the why');
  expect(host.querySelector('[title]')).toBeNull();
});

test('clicking calls onChange with the value', () => {
  const onChange = jest.fn();
  mount({ value: 'simple', onChange });
  act(() => { q('care-text-detailed').click(); });
  expect(onChange).toHaveBeenCalledWith('detailed');
});
