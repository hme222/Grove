import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import LoadError from './LoadError';

jest.mock('./PageHeader', () => ({ PageHeader: () => null }));

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let container; let root;
beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => { act(() => root.unmount()); container.remove(); });

const render = async (props) => { await act(async () => { root.render(<LoadError onRetry={() => {}} {...props} />); }); };

test('with no response (a dropped connection), it asks the person to check their connection', async () => {
  await render({ what: 'plants-a', error: new Error('Network Error') });
  expect(container.textContent).toContain('Check your connection');
});

test('a server fault says it is on our side and not the connection', async () => {
  await render({ what: 'plants-b', error: { response: { status: 500 } } });
  expect(container.textContent).toContain('FloraGrove had a problem on our side. It isn’t your connection');
  expect(container.textContent).not.toContain('Check your connection');
});

test('without an error it keeps the connection wording', async () => {
  await render({ what: 'plants-c' });
  expect(container.textContent).toContain('We couldn’t reach FloraGrove. Check your connection');
});

test('a 4xx is not called a server fault', async () => {
  await render({ what: 'plants-d', error: { response: { status: 404 } } });
  expect(container.textContent).not.toContain('on our side. It isn’t');
});
