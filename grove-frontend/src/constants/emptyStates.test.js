import { EMPTY_STATES } from './emptyStates';

test('no empty state promises a day-7 or day-30 unlock or mentions a streak', () => {
  const text = JSON.stringify(EMPTY_STATES).toLowerCase();
  expect(text).not.toMatch(/day 7|day 30|7 days|30 days|streak|unlocks at/);
  expect(EMPTY_STATES.swaps_locked).toBeUndefined();
  expect(EMPTY_STATES.feed_no_grove).toBeUndefined();
});

test('an empty feed says anyone can browse', () => {
  expect(EMPTY_STATES.feed_empty.body).toMatch(/anyone can browse/i);
});
