import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import PetSafetyLookup, { ASPCA_PLANT_LIST } from './PetSafetyLookup';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let container; let root;
beforeEach(() => { container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container); });
afterEach(() => { act(() => root.unmount()); container.remove(); });
const render = (toxicity) => act(() => root.render(<PetSafetyLookup toxicity={toxicity} />));

test.each([[undefined], [null], [''], ['mild'], ['unknown']])('an unknown plant (%p) gets a named link to the ASPCA list', (value) => {
  render(value);
  const a = container.querySelector('a');
  expect(a.getAttribute('href')).toBe(ASPCA_PLANT_LIST);
  expect(a.getAttribute('target')).toBe('_blank');
  expect(a.getAttribute('rel')).toContain('noopener');
  expect(a.textContent).toMatch(/Look it up on the ASPCA’s plant list/);
  expect(a.textContent).toMatch(/opens in a new tab/);
});

test.each([['toxic'], ['non_toxic']])('a sourced answer (%p) shows no lookup link', (value) => {
  render(value);
  expect(container.querySelector('a')).toBeNull();
});
