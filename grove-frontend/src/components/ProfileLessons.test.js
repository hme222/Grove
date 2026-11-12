import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import ProfileLessons from './ProfileLessons';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const show = async (props) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => { root.render(<ProfileLessons {...props} />); });
  return { container, done: () => { act(() => root.unmount()); container.remove(); } };
};

test('lists every lesson and opens the one tapped', async () => {
  const onOpen = jest.fn();
  const { container, done } = await show({ seen: [], onOpen });
  expect(container.querySelectorAll('li')).toHaveLength(6);
  await act(async () => { container.querySelector('[data-testid="profile-lesson-plant-er"]').click(); });
  expect(onOpen).toHaveBeenCalledWith('plant-er');
  done();
});

test('a finished lesson says so and can be read again; an unfinished one shows its blurb', async () => {
  const { container, done } = await show({ seen: ['lesson:plant-er', 'section-plants'], onOpen: () => {} });
  expect(container.querySelector('[data-testid="profile-lesson-plant-er"]').textContent).toContain('Done. Tap to read again.');
  expect(container.querySelector('[data-testid="profile-lesson-soil-finger-test"]').textContent).toContain('Check the soil with your finger');
  done();
});
