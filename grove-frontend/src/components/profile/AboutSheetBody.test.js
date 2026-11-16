import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import AboutSheetBody from './AboutSheetBody';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

test('shows the approved About text in one paragraph', () => {
  const container = document.createElement('div');
  const root = createRoot(container);
  act(() => { root.render(<AboutSheetBody />); });
  expect(container.querySelectorAll('p')).toHaveLength(1);
  expect(container.textContent).toBe('FloraGrove is for people who want to become confident with taking care of plants. It shows what each plant needs today and why, and helps you put things right when something goes wrong.');
  act(() => root.unmount());
});
