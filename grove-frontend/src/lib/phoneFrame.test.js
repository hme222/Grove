import { frameChoice, shouldFrame, fitScale, clockText } from './phoneFrame';

describe('phone frame', () => {
  const desktop = { embedded: false, standalone: false, width: 1440, search: '', stored: null };
  test('frames wide desktop windows by default', () => {
    expect(shouldFrame(desktop)).toBe(true);
  });
  test('never frames phones, installed apps or the preview itself', () => {
    expect(shouldFrame({ ...desktop, width: 390 })).toBe(false);
    expect(shouldFrame({ ...desktop, standalone: true })).toBe(false);
    expect(shouldFrame({ ...desktop, embedded: true })).toBe(false);
  });
  test('respects an explicit choice, and the URL wins over what was stored', () => {
    expect(frameChoice('?frame=off', null)).toBe('off');
    expect(frameChoice('', 'off')).toBe('off');
    expect(frameChoice('?frame=on', 'off')).toBe('on');
    expect(shouldFrame({ ...desktop, stored: 'off' })).toBe(false);
  });
  test('shrinks to fit short windows but never above full size', () => {
    expect(fitScale(2000)).toBe(1);
    expect(fitScale(600)).toBeLessThan(1);
    expect(fitScale(100)).toBe(0.5);
  });
  test('shows the time the way iOS does, without AM or PM', () => {
    expect(clockText(new Date(2026, 9, 23, 9, 41))).toBe('9:41');
    expect(clockText(new Date(2026, 9, 23, 21, 5))).toBe('9:05');
  });
});
