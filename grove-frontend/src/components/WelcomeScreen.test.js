import React, { act } from 'react';
import { createRoot } from 'react-dom/client';

jest.mock('@/components/PhotoBand', () => ({ __esModule: true, default: () => null, photoSrc: (p) => p }), { virtual: true });
import { WelcomeScreen, isCompact } from './WelcomeScreen';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

test('the flow layout takes over below 360px or when the scaled body text would be under 14px', () => {
  expect(isCompact(390, 390 / 430)).toBe(false); // an iPhone: 17px text scales to about 15.4px
  expect(isCompact(430, 1)).toBe(false);
  expect(isCompact(359, 0.9)).toBe(true);
  expect(isCompact(195, 195 / 430)).toBe(true);
  expect(isCompact(390, 0.8)).toBe(true); // a short window: 13.6px
});

const render = async (width, height) => {
  window.innerWidth = width;
  window.innerHeight = height;
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => { root.render(<WelcomeScreen onContinue={() => {}} onSkip={() => {}} />); });
  return { container, done: () => { act(() => root.unmount()); container.remove(); } };
};

test('narrow: a normal-flow page with the same words, one h1, a Continue button and a skip, above the nav', async () => {
  const { container, done } = await render(195, 600);
  const welcome = container.querySelector('[data-testid="onboarding-welcome"]');
  expect(welcome.getAttribute('data-layout')).toBe('flow');
  expect(welcome.className).toContain('z-intro');
  expect(welcome.querySelectorAll('h1')).toHaveLength(1);
  expect(welcome.textContent).toContain('A grove is a small group of trees growing closely together');
  expect(welcome.textContent).toContain('FloraGrove is a safe space to learn about plants.');
  expect(container.querySelector('[data-testid="onboarding-continue"]')).not.toBeNull();
  expect(container.querySelector('[data-testid="onboarding-skip"]')).not.toBeNull();
  expect(container.querySelector('.gw-stage')).toBeNull();
  done();
});

test('wide: the 430 x 932 stage, above the tab bar', async () => {
  const { container, done } = await render(430, 932);
  const welcome = container.querySelector('[data-testid="onboarding-welcome"]');
  expect(welcome.getAttribute('data-layout')).toBeNull();
  expect(welcome.className).toContain('gw');
  expect(welcome.className).toContain('z-intro');
  expect(container.querySelector('.gw-stage')).not.toBeNull();
  done();
});
