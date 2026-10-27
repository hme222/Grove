import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import HelpMyPlantPage from './HelpMyPlantPage';

jest.mock('react-router-dom', () => ({ useNavigate: () => jest.fn() }), { virtual: true });
jest.mock('../components/PageHeader', () => ({ PageHeader: ({ title }) => <h1>{title}</h1> }));

test('the emergency block is a labelled list with tel: links', () => {
  const host = document.createElement('div'); document.body.appendChild(host);
  const root = createRoot(host);
  act(() => { root.render(<HelpMyPlantPage />); });
  const box = host.querySelector('[data-testid="safety-note"]');
  expect(box).not.toBeNull();
  const terms = [...box.querySelectorAll('dt')].map((d) => d.textContent);
  expect(terms).toEqual(['In an emergency', 'If a pet ate it', 'If a child ate it', 'Outside the US']);
  const tel = [...box.querySelectorAll('a[href^="tel:"]')].map((a) => a.getAttribute('href'));
  expect(tel).toEqual(expect.arrayContaining(['tel:+18884264435', 'tel:+18002221222']));
  box.querySelectorAll('a').forEach((a) => expect(a.className).toContain('min-h-touch'));
  expect(box.textContent).toContain('Do not make them vomit unless told to. Bring the plant or a photo.');
  act(() => root.unmount()); host.remove();
});
