import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import HelpMyPlantPage from './HelpMyPlantPage';

jest.mock('react-router-dom', () => ({ useNavigate: () => jest.fn() }), { virtual: true });
jest.mock('../components/PageHeader', () => ({ PageHeader: ({ title }) => <h1>{title}</h1> }));
let mockArm = null;
jest.mock('../lib/api', () => ({
  experimentAPI: {
    helpDiagnosisArm: () => (mockArm ? Promise.resolve({ data: { arm: mockArm } }) : Promise.reject(new Error('offline'))),
    event: () => Promise.resolve(),
  },
  plantAPI: {},
}));

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

const mountHelp = async () => {
  const host = document.createElement('div'); document.body.appendChild(host);
  const root = createRoot(host);
  await act(async () => { root.render(<HelpMyPlantPage />); });
  await act(async () => { await new Promise((r) => setTimeout(r, 0)); });
  return { host, done: () => { act(() => root.unmount()); host.remove(); } };
};

test('the control arm, and anyone the arm call fails for, sees only the symptom list', async () => {
  mockArm = 'control';
  let page = await mountHelp();
  expect(page.host.querySelector('[data-testid="photo-check"]')).toBeNull();
  expect(page.host.querySelector('[data-testid="symptom-list"]')).not.toBeNull();
  page.done();
  mockArm = null;
  page = await mountHelp();
  expect(page.host.querySelector('[data-testid="photo-check"]')).toBeNull();
  page.done();
});

test('the photo_check arm sees the photo check above the symptom list', async () => {
  mockArm = 'photo_check';
  const page = await mountHelp();
  expect(page.host.querySelector('[data-testid="photo-check"]')).not.toBeNull();
  expect(page.host.querySelector('[data-testid="symptom-list"]')).not.toBeNull();
  page.done();
  mockArm = null;
});
