import { bubbleShownToday, markBubbleShown, overdueDays, pickPeek, dismissToday, dismissCount, bumpDismissCount, hasSeenFirstPeek, markFirstPeekSeen, defaultStore } from './pipNudges';

const NOW = new Date(2026, 10, 13, 12, 0, 0);
const daysAgo = (n) => new Date(NOW.getTime() - n * 86400000 - 1000).toISOString();
const memoryStore = () => { const m = {}; return { get: (k) => (k in m ? m[k] : null), set: (k, v) => { m[k] = String(v); } }; };

test('counts whole days past the watering date, and 0 when not due or missing', () => {
  expect(overdueDays({ next_water_due: daysAgo(3) }, NOW)).toBe(3);
  expect(overdueDays({ next_water_due: new Date(NOW.getTime() + 86400000).toISOString() }, NOW)).toBe(0);
  expect(overdueDays({}, NOW)).toBe(0);
  expect(overdueDays({ next_water_due: 'not a date' }, NOW)).toBe(0);
});

test('picks the most overdue plant and names it', () => {
  const plants = [
    { id: 'a', common_name: 'Pothos', next_water_due: daysAgo(1) },
    { id: 'b', nickname: 'Monty', common_name: 'Monstera', next_water_due: daysAgo(3) },
  ];
  expect(pickPeek(plants, NOW, memoryStore())).toEqual({ plantId: 'b', name: 'Monty', days: 3 });
});

test('skips a plant that is not a full day overdue, and says "Your plant" when it has no name', () => {
  expect(pickPeek([{ id: 'a', next_water_due: new Date(NOW.getTime() - 3600000).toISOString() }], NOW, memoryStore())).toBeNull();
  expect(pickPeek([{ id: 'a', next_water_due: daysAgo(2) }], NOW, memoryStore()).name).toBe('Your plant');
});

test('a plant dismissed today is skipped, but not the next day; the other plant is offered instead', () => {
  const store = memoryStore();
  const plants = [
    { id: 'a', common_name: 'Pothos', next_water_due: daysAgo(4) },
    { id: 'b', common_name: 'Fern', next_water_due: daysAgo(2) },
  ];
  dismissToday('a', NOW, store);
  expect(pickPeek(plants, NOW, store).plantId).toBe('b');
  const tomorrow = new Date(NOW.getTime() + 86400000);
  expect(pickPeek(plants, tomorrow, store).plantId).toBe('a');
});

test('nothing to pick from an empty or missing list', () => {
  expect(pickPeek([], NOW, memoryStore())).toBeNull();
  expect(pickPeek(undefined, NOW, memoryStore())).toBeNull();
});

test('counts dismissals and remembers the first peek', () => {
  const store = memoryStore();
  expect(dismissCount(store)).toBe(0);
  bumpDismissCount(store); bumpDismissCount(store);
  expect(dismissCount(store)).toBe(2);
  expect(hasSeenFirstPeek(store)).toBe(false);
  markFirstPeekSeen(store);
  expect(hasSeenFirstPeek(store)).toBe(true);
});

test('when localStorage throws, the default store keeps working from memory', () => {
  const spy = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked'); });
  const get = jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked'); });
  expect(() => defaultStore.set('grove.test', 'x')).not.toThrow();
  expect(defaultStore.get('grove.test')).toBe('x');
  spy.mockRestore(); get.mockRestore();
});

test('the bubble is remembered per plant per day', () => {
  const store = memoryStore();
  expect(bubbleShownToday('a', NOW, store)).toBe(false);
  markBubbleShown('a', NOW, store);
  expect(bubbleShownToday('a', NOW, store)).toBe(true);
  expect(bubbleShownToday('b', NOW, store)).toBe(false);
  expect(bubbleShownToday('a', new Date(NOW.getTime() + 86400000), store)).toBe(false);
});
