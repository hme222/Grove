import { LIGHT_BASICS_CARDS, WINDOW_MAP_CARDS, HEMISPHERE_NOTE } from './lightCards';

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

describe('the content fixes carried over from the retired window lesson', () => {
  const body = (cards) => cards.map((c) => c.body).join(' ');

  test('bright indirect light is defined in plain words with a distance', () => {
    expect(body(LIGHT_BASICS_CARDS)).toContain(
      'a spot close to a bright window, within about 3 feet (1 meter), where daylight is strong but the sun does not land on the leaves'
    );
  });

  test('the pet warning appears once in the lesson that names the plants', () => {
    const warning = 'toxic to cats and dogs if chewed. Keep them out of reach, or check the plant&rsquo;s pet-safety label first.';
    expect(body(WINDOW_MAP_CARDS).split(warning)).toHaveLength(2);
    expect(body(LIGHT_BASICS_CARDS)).not.toMatch(/Monstera|Pothos|Philodendron|Snake plant/);
  });

  test('north windows give low light, with what Pothos and Snake plant do there', () => {
    expect(body(WINDOW_MAP_CARDS)).toContain(
      'North windows give low light. Pothos and Snake plant tolerate it, but they will grow slowly and may need a brighter spot in winter.'
    );
  });

  test('cards that name a direction carry the exact hemisphere note, and it uses American English', () => {
    expect(HEMISPHERE_NOTE).toBe(
      'Window directions assume the northern hemisphere outside the tropics; in the southern hemisphere swap north and south.'
    );
    expect(LIGHT_BASICS_CARDS[2].body).toContain(HEMISPHERE_NOTE);
    expect(WINDOW_MAP_CARDS[1].body).toContain(HEMISPHERE_NOTE);
  });

  test('both lessons are drawn on paper', () => {
    all.forEach((card) => expect(card.paper).toBe(true));
  });
});
