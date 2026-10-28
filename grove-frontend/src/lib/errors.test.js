import { saveErrorMessage } from './errors';

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
