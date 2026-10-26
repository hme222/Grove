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
});
