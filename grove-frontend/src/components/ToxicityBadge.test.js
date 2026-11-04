import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import ToxicityBadge from './ToxicityBadge';
import { getToxicityInfo, normalizeToxicity } from '../lib/toxicity';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe('normalizeToxicity', () => {
  test.each([
    ['non_toxic', 'non_toxic'],
    ['non-toxic', 'non_toxic'],
    [' Non Toxic ', 'non_toxic'],
    ['mild', 'mild'],
    ['toxic', 'toxic'],
    ['TOXIC', 'toxic'],
  ])('%p reads as %p', (value, level) => {
    expect(normalizeToxicity(value)).toBe(level);
  });

  test.each([[undefined], [null], [''], ['   '], ['safe-ish'], ['unknown'], [0], [{}]])(
    'missing or unrecognized %p is unknown, never pet-safe',
    (value) => {
      expect(normalizeToxicity(value)).toBe('unknown');
      expect(getToxicityInfo(value).label).not.toBe('Non-toxic to pets');
    }
  );
});

describe('ToxicityBadge', () => {
  let container;
  let root;
  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });
  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  const render = (toxicity) => {
    act(() => root.render(<ToxicityBadge toxicity={toxicity} />));
    return container.querySelector('[data-testid="toxicity-badge"]');
  };

  test('missing toxicity shows the neutral unknown message', () => {
    const badge = render(undefined);
    expect(badge.dataset.level).toBe('unknown');
    expect(badge.textContent).toBe('Pet safety unknown — check before bringing it home');
    expect(badge.className).not.toMatch(/3B6D11/);
  });

  test('toxic shows warning words and a distinct style from non-toxic', () => {
    const toxic = render('toxic');
    const toxicClass = toxic.className;
    expect(toxic.textContent).toBe('Toxic if ingested');
    expect(toxic.querySelector('svg')).not.toBeNull();
    const safe = render('non_toxic');
    expect(safe.textContent).toBe('Non-toxic to pets');
    expect(safe.className).not.toBe(toxicClass);
  });

  test('every level carries an icon and words, not color alone', () => {
    ['non_toxic', 'mild', 'toxic', undefined].forEach((value) => {
      const badge = render(value);
      expect(badge.querySelector('svg[aria-hidden="true"]')).not.toBeNull();
      expect(badge.textContent.length).toBeGreaterThan(3);
    });
  });

  test('every level has a plain definition, and unknown never reads as safe', () => {
    ['non_toxic', 'mild', 'toxic', undefined].forEach((value) => {
      expect(getToxicityInfo(value).definition.length).toBeGreaterThan(20);
    });
    expect(getToxicityInfo(undefined).definition).toMatch(/don’t assume it’s safe/);
  });

  test('keyboard focus shows the definition and Escape closes it', async () => {
    const badge = render('toxic');
    expect(badge.getAttribute('tabindex')).toBe('0');
    await act(async () => { badge.focus(); });
    const panel = () => document.body.querySelector('[data-testid="toxicity-badge-definition"]');
    expect(panel()?.textContent).toContain(getToxicityInfo('toxic').definition);
    await act(async () => { document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); });
    expect(panel()).toBeNull();
  });

  test('a chip inside a link or button takes no focus', () => {
    act(() => root.render(<ToxicityBadge toxicity="mild" interactive={false} />));
    expect(container.querySelector('[data-testid="toxicity-badge"]').hasAttribute('tabindex')).toBe(false);
  });
});
