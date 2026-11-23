import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { Droplets } from 'lucide-react';
import IconCircle from './IconCircle';

global.IS_REACT_ACT_ENVIRONMENT = true;

let el;
let root;
beforeEach(() => { el = document.createElement('div'); document.body.appendChild(el); root = createRoot(el); });
afterEach(() => { act(() => root.unmount()); el.remove(); });
const render = (node) => act(async () => { root.render(node); });

test('rests as sprout on moss and is hidden from screen readers', async () => {
  await render(<IconCircle icon={Droplets} testId="ic" />);
  const c = el.querySelector('[data-testid="ic"]');
  expect(c.getAttribute('aria-hidden')).toBe('true');
  expect(c.className).toContain('bg-grove-moss');
  expect(c.className).toContain('text-grove-sprout');
});

test('turns lime with a forest icon when on', async () => {
  await render(<IconCircle icon={Droplets} on testId="ic" />);
  const c = el.querySelector('[data-testid="ic"]');
  expect(c.className).toContain('bg-grove-lime');
  expect(c.className).toContain('text-grove-root');
});

test('inside a group it follows the parent state (tab active or tile open)', async () => {
  await render(<span className="group" data-state="active"><IconCircle icon={Droplets} onGroup testId="ic" /></span>);
  const c = el.querySelector('[data-testid="ic"]');
  expect(c.className).toContain('group-data-[state=active]:bg-grove-lime');
  expect(c.className).toContain('group-data-[state=open]:bg-grove-lime');
});
