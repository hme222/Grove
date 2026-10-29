import React, { act } from 'react';
import { createRoot } from 'react-dom/client';

jest.mock('@/components/PhotoBand', () => ({ __esModule: true, default: () => null, photoSrc: (p) => p }), { virtual: true });
import { WelcomeScreen, isCompact, stageScaleFor, shouldPinContinue } from './WelcomeScreen';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

test('the flow layout takes over only below 360px', () => {
  expect(isCompact(359)).toBe(true);
  expect(isCompact(195)).toBe(true);
  expect(isCompact(360)).toBe(false);
  expect(isCompact(1420)).toBe(false);
});

test('the stage scales to fit but never below the size where its body text is 14px', () => {
  expect(stageScaleFor(430, 932)).toBe(1);
  expect(stageScaleFor(390, 844)).toBeCloseTo(844 / 932, 5); // an iPhone fits
  expect(stageScaleFor(1420, 682)).toBeCloseTo(14 / 17, 5); // a laptop window keeps the picture and scrolls
  expect(stageScaleFor(360, 500)).toBeCloseTo(14 / 17, 5);
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

test('a short desktop window still gets the stage, not the flow page', async () => {
  const { container, done } = await render(1420, 682);
  const welcome = container.querySelector('[data-testid="onboarding-welcome"]');
  expect(welcome.getAttribute('data-layout')).toBeNull();
  expect(container.querySelector('.gw-stage')).not.toBeNull();
  done();
});

test('Continue is pinned when the stage would put it below the fold or behind the sign-in bar', () => {
  expect(shouldPinContinue(1, 932)).toBe(false); // a full 430 x 932 screen
  expect(shouldPinContinue(stageScaleFor(390, 844), 844)).toBe(false); // an iPhone as a home-screen app
  expect(shouldPinContinue(stageScaleFor(390, 664), 664)).toBe(true); // an iPhone in Safari
  expect(shouldPinContinue(stageScaleFor(1420, 682), 682)).toBe(true); // a laptop window
});

test('short screen: one Continue button, outside the stage, pinned', async () => {
  const { container, done } = await render(390, 664);
  const buttons = container.querySelectorAll('[data-testid="onboarding-continue"]');
  expect(buttons).toHaveLength(1);
  expect(container.querySelector('.gw-stage [data-testid="onboarding-continue"]')).toBeNull();
  expect(container.querySelector('.gw-pin [data-testid="onboarding-continue"]')).not.toBeNull();
  done();
});

test('tall screen: one Continue button, inside the stage', async () => {
  const { container, done } = await render(430, 932);
  expect(container.querySelectorAll('[data-testid="onboarding-continue"]')).toHaveLength(1);
  expect(container.querySelector('.gw-stage [data-testid="onboarding-continue"]')).not.toBeNull();
  expect(container.querySelector('.gw-pin')).toBeNull();
  done();
});
