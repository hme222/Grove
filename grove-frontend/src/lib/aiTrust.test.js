import { confidenceLevel, confidenceText, identifyWhy } from './aiTrust';

describe('confidenceText', () => {
  test.each([
    [0.92, 'High confidence (92%)'],
    [0.75, 'Fairly confident (75%)'],
    [0.4, 'Not sure, please check (40%)'],
    ['high', 'High confidence'],
    ['Medium', 'Fairly confident'],
    ['low', 'Not sure, please check'],
  ])('%p -> %p', (value, text) => {
    expect(confidenceText(value)).toBe(text);
  });

  test.each([[undefined], [null], [''], ['sure'], [NaN]])('%p says nothing rather than inventing a score', (value) => {
    expect(confidenceText(value)).toBeNull();
    expect(confidenceLevel(value)).toBeNull();
  });

  test('the low band matches plant ID low-confidence threshold of 0.7', () => {
    expect(confidenceLevel(0.69)).toBe('low');
    expect(confidenceLevel(0.7)).toBe('medium');
  });
});

describe('identifyWhy', () => {
  test('uses library facts when there is a match', () => {
    const why = identifyWhy({
      libraryMatch: { latinName: 'Monstera deliciosa', family: 'Araceae', source: 'Royal Horticultural Society' },
    });
    expect(why).toBe(
      "Top photo match. Grove's library lists Monstera deliciosa in the Araceae family (Royal Horticultural Society). Check the leaf shape against it."
    );
  });

  test('leaves out facts the library does not have', () => {
    expect(identifyWhy({ libraryMatch: { latinName: 'Ficus lyrata' } })).toBe(
      "Top photo match. Grove's library lists Ficus lyrata. Check the leaf shape against it."
    );
  });

  test('without a match it says so and points to a check', () => {
    expect(identifyWhy({ libraryMatch: null })).toMatch(/isn't in Grove's library yet/);
    expect(identifyWhy(undefined)).toMatch(/check the leaf shape/);
  });
});
