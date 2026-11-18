import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import SymptomHelp from './SymptomHelp';
import { SYMPTOMS } from '../../lib/plantHelp';
import { LESSON_META } from '../../lessons/lessonMeta';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({ useNavigate: () => mockNavigate }), { virtual: true });
jest.mock('../../lib/api', () => ({ experimentAPI: { helpDiagnosisArm: () => Promise.reject(new Error('offline')), event: () => Promise.resolve() } }));

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const pick = async (symptomId) => {
  const host = document.createElement('div'); document.body.appendChild(host);
  const root = createRoot(host);
  await act(async () => { root.render(<SymptomHelp />); });
  await act(async () => { host.querySelector(`[data-testid="symptom-${symptomId}"]`).click(); });
  return { host, done: () => { act(() => root.unmount()); host.remove(); } };
};

beforeEach(() => mockNavigate.mockClear());

test('the soil lesson button opens the soil finger-test itself, not the lesson list', async () => {
  const page = await pick('yellow-leaves');
  const btn = page.host.querySelector('[data-testid="symptom-lesson"]');
  expect(btn.textContent).toBe('Learn the soil finger-test');
  await act(async () => { btn.click(); });
  expect(mockNavigate).toHaveBeenCalledWith('/lessons/soil-finger-test');
  page.done();
});

test('long, stretchy growth points to the light lesson', async () => {
  const page = await pick('leggy');
  const btn = page.host.querySelector('[data-testid="symptom-lesson"]');
  expect(btn.textContent).toBe('Learn to read your spot’s light');
  await act(async () => { btn.click(); });
  expect(mockNavigate).toHaveBeenCalledWith('/lessons/light-basics');
  page.done();
});

test('every symptom links to a lesson that exists', async () => {
  for (const s of SYMPTOMS) {
    const page = await pick(s.id);
    await act(async () => { page.host.querySelector('[data-testid="symptom-lesson"]').click(); });
    const id = mockNavigate.mock.calls.at(-1)[0].replace('/lessons/', '');
    expect(LESSON_META[id]).toBeDefined();
    page.done();
  }
});
