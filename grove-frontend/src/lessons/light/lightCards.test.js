import { LIGHT_BASICS_CARDS, WINDOW_MAP_CARDS } from './lightCards';

const all = [...LIGHT_BASICS_CARDS, ...WINDOW_MAP_CARDS];

test('each part has four cards', () => {
  expect(LIGHT_BASICS_CARDS).toHaveLength(4);
  expect(WINDOW_MAP_CARDS).toHaveLength(4);
});

test('every card has a header, headline, and body, and headers count the cards', () => {
  all.forEach((card) => {
    expect(card.headline.length).toBeGreaterThan(0);
    expect(card.body.length).toBeGreaterThan(0);
    expect(card.header).toMatch(/^Card [1-4] of 4/);
  });
  expect(LIGHT_BASICS_CARDS.map((c) => c.header.slice(0, 11))).toEqual(['Card 1 of 4', 'Card 2 of 4', 'Card 3 of 4', 'Card 4 of 4']);
});

test('card one of part one is the hand-shadow test', () => {
  expect(LIGHT_BASICS_CARDS[0].interactive).toBe('shadow-test');
  expect(LIGHT_BASICS_CARDS[0].body.toLowerCase()).toContain('hand');
});

test('part one card two reads back the shadow, and card three is the curtain', () => {
  expect(LIGHT_BASICS_CARDS[1].interactive).toBe('reading-note');
  expect(LIGHT_BASICS_CARDS[2].interactive).toBe('curtain');
  expect(LIGHT_BASICS_CARDS[2].body.toLowerCase()).toContain('curtain');
});

test('part two runs pick, room, fits, ending', () => {
  expect(WINDOW_MAP_CARDS.map((c) => c.interactive)).toEqual(['window-pick', 'window-room', 'fits', 'closing']);
});

test('the copy never counts hours and never says wrong', () => {
  all.forEach((card) => {
    const text = `${card.headline} ${card.body}`.toLowerCase();
    expect(text).not.toMatch(/\b\d+\s*(hours?|hrs?)\b/);
    expect(text).not.toContain('wrong');
  });
});


test('no card mentions the nook, because the lessons work without it', () => {
  all.forEach((card) => {
    const text = `${card.header} ${card.headline} ${card.body} ${card.cta || ''}`.toLowerCase();
    expect(text).not.toContain('nook');
  });
});
