import { saveErrorMessage, actionErrorMessage, refusalFrom } from './errors';

test('a dropped connection says nothing was lost and to check the connection', () => {
  expect(saveErrorMessage(new Error('Network Error'))).toMatch(/Nothing was lost.*connection/);
});

test('a rule from the server is passed on as written', () => {
  expect(saveErrorMessage({ response: { status: 403, data: { detail: 'Free tier limited to 15 plants.' } } })).toBe('Free tier limited to 15 plants.');
});

test('a server fault is not blamed on the person', () => {
  expect(saveErrorMessage({ response: { status: 500, data: {} } })).toMatch(/our side/);
});

test('a validation list is never shown raw', () => {
  expect(saveErrorMessage({ response: { status: 422, data: { detail: [{ msg: 'x' }] } } })).toMatch(/Check what you entered/);
});

test('a missing route never shows the server’s own words', () => {
  expect(saveErrorMessage({ response: { status: 404, data: { detail: 'Not Found' } } })).toMatch(/our side/);
  expect(saveErrorMessage({ response: { status: 404, data: { detail: 'Not Found' } } }, { fallback: 'We couldn’t send the link.' })).toBe('We couldn’t send the link.');
});

test('an action failure says what failed and whose side it is on', () => {
  expect(actionErrorMessage(new Error('Network Error'), 'post that')).toBe('Couldn’t post that. Nothing was lost. Check your connection and try again.');
  expect(actionErrorMessage({ response: { status: 500, data: {} } }, 'post that')).toBe('Couldn’t post that. That’s on our side, and nothing was saved. Try again in a moment.');
  expect(actionErrorMessage({ response: { status: 404, data: { detail: 'Not Found' } } }, 'post that')).toMatch(/on our side/);
  expect(actionErrorMessage({ response: { status: 403, data: { detail: 'Free tier limited to 15 plants.' } } }, 'add that')).toBe('Free tier limited to 15 plants.');
});

describe('refusals the server words itself (402 and 429)', () => {
  const refusal = (status, code, message) => ({ response: { status, data: { detail: { code, message } } } });

  test('refusalFrom reads a code and a message from a 402 or 429', () => {
    expect(refusalFrom(refusal(402, 'free_id_limit', 'Used up.'))).toEqual({ code: 'free_id_limit', message: 'Used up.' });
    expect(refusalFrom(refusal(429, 'fair_use_daily', 'Slow down.'))).toEqual({ code: 'fair_use_daily', message: 'Slow down.' });
  });

  test('it ignores anything else: other statuses, string details, missing fields, no response', () => {
    expect(refusalFrom(refusal(400, 'x', 'y'))).toBeNull();
    expect(refusalFrom({ response: { status: 402, data: { detail: 'Plain string' } } })).toBeNull();
    expect(refusalFrom({ response: { status: 402, data: { detail: { code: 'x' } } } })).toBeNull();
    expect(refusalFrom({ response: { status: 429, data: {} } })).toBeNull();
    expect(refusalFrom(new Error('offline'))).toBeNull();
    expect(refusalFrom(null)).toBeNull();
  });

  test('both message helpers show the server\'s words for a refusal', () => {
    const err = refusal(402, 'free_id_limit', 'You’ve used your 3 free photo IDs. You can still add a plant by searching for its name.');
    expect(saveErrorMessage(err)).toContain('searching for its name');
    expect(actionErrorMessage(err, 'identify that')).toContain('searching for its name');
  });
});
