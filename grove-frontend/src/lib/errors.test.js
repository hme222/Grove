import { saveErrorMessage, actionErrorMessage } from './errors';

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
  expect(actionErrorMessage({ response: { status: 500, data: {} } }, 'post that')).toBe('Couldn’t post that. That’s on our side. Try again in a moment.');
  expect(actionErrorMessage({ response: { status: 404, data: { detail: 'Not Found' } } }, 'post that')).toMatch(/on our side/);
  expect(actionErrorMessage({ response: { status: 403, data: { detail: 'Free tier limited to 15 plants.' } } }, 'add that')).toBe('Free tier limited to 15 plants.');
});
