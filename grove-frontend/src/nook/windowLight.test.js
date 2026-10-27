import { lightPatch, windowSentence, directionName } from './windowLight';

const win = (over = {}) => ({ draw_direction: 'S', direction: 'S', season: 'summer', view: 'open', lamp: false, ...over });

test('no window keeps the old beam', () => {
  expect(lightPatch(null).kind).toBe('default');
  expect(lightPatch(undefined).kind).toBe('default');
});

test('north has no patch and no window has a lamp', () => {
  expect(lightPatch(win({ draw_direction: 'N' })).kind).toBe('none');
  expect(lightPatch({ lamp: true }).kind).toBe('lamp');
});

test('reach runs from short to long', () => {
  const reach = (d) => lightPatch(win({ draw_direction: d })).reach;
  expect(reach('NE')).toBeLessThan(reach('E'));
  expect(reach('E')).toBeLessThan(reach('SE'));
  expect(reach('SE')).toBeLessThan(reach('S'));
  expect(reach('NW')).toBeLessThan(reach('W'));
});

test('winter reaches deeper than summer for south-facing windows', () => {
  ['S', 'SE', 'SW', 'W'].forEach((d) => {
    const summer = lightPatch(win({ draw_direction: d, season: 'summer' })).reach;
    const winter = lightPatch(win({ draw_direction: d, season: 'winter' })).reach;
    expect(winter).toBeGreaterThan(summer);
  });
});

test('a tree or building shortens and softens the patch', () => {
  const open = lightPatch(win());
  ['tree', 'building'].forEach((view) => {
    const dimmed = lightPatch(win({ view }));
    expect(dimmed.reach).toBeLessThan(open.reach);
    expect(dimmed.soft).toBe(true);
  });
  expect(open.soft).toBe(false);
});

test('tint is hot for west and southwest and cool for the early morning directions', () => {
  expect(lightPatch(win({ draw_direction: 'W' })).tint).toBe('hot');
  expect(lightPatch(win({ draw_direction: 'SW' })).tint).toBe('hot');
  expect(lightPatch(win({ draw_direction: 'NE' })).tint).toBe('cool');
  expect(lightPatch(win({ draw_direction: 'E' })).tint).toBe('cool');
});

test('the patch never reaches past the floor', () => {
  ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'].forEach((d) =>
    ['summer', 'winter'].forEach((season) => expect(lightPatch(win({ draw_direction: d, season })).reach).toBeLessThanOrEqual(24))
  );
});

test('names the directions in words', () => {
  expect(directionName('SW')).toBe('southwest');
  expect(['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'].map(directionName)).toEqual([
    'north', 'northeast', 'east', 'southeast', 'south', 'southwest', 'west', 'northwest',
  ]);
});

test('the window sentence', () => {
  expect(
    windowSentence(win({ direction: 'SW', view: 'tree', arrives: 'Hot sun from midday into the evening.' }))
  ).toBe('Your window faces southwest and looks out on a tree. Hot sun from midday into the evening.');
  expect(windowSentence(win({ direction: 'N', view: 'open', arrives: 'No direct sun. Steady, even light.' }))).toBe(
    'Your window faces north and looks out on open sky. No direct sun. Steady, even light.'
  );
  expect(windowSentence(win({ direction: 'E', view: 'building', arrives: 'x' }))).toContain('a building');
  expect(windowSentence({ lamp: true })).toBe("There's no window here, so the nook is lit by a lamp.");
  expect(windowSentence(null)).toBe('');
});
