import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import PhotoCheck from './PhotoCheck';
import { plantAPI, experimentAPI } from '../lib/api';

jest.mock('../lib/api', () => ({
  plantAPI: { upload: jest.fn(), diagnosePhoto: jest.fn() },
  experimentAPI: { event: jest.fn(() => Promise.resolve()) },
}));

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let host; let root;
const q = (id) => host.querySelector(`[data-testid="${id}"]`);
const flush = () => act(async () => { await new Promise((r) => setTimeout(r, 0)); });

beforeEach(() => {
  jest.clearAllMocks();
  experimentAPI.event.mockImplementation(() => Promise.resolve());
  host = document.createElement('div'); document.body.appendChild(host);
  root = createRoot(host);
  act(() => { root.render(<PhotoCheck />); });
});
afterEach(() => { act(() => root.unmount()); host.remove(); });

const pickPhoto = async () => {
  const input = q('photo-check-file');
  Object.defineProperty(input, 'files', { value: [new File(['x'], 'p.jpg', { type: 'image/jpeg' })], configurable: true });
  await act(async () => { input.dispatchEvent(new Event('change', { bubbles: true })); });
  await flush();
};

test('there is no photo button until the soil is answered, and "haven\'t checked" never offers one', () => {
  expect(q('photo-check-choose')).toBeNull();
  act(() => { q('soil-not_checked').click(); });
  expect(q('soil-needed')).not.toBeNull();
  expect(q('photo-check-choose')).toBeNull();
  act(() => { q('soil-dry').click(); });
  expect(q('photo-check-choose')).not.toBeNull();
});

test('a photo is sent with the soil answer and the result shows confidence in words and the limits', async () => {
  plantAPI.upload.mockResolvedValue({ data: { path: 'p/1.jpg' } });
  plantAPI.diagnosePhoto.mockResolvedValue({ data: {
    confidence: 'Fairly sure', notSure: false, limits: 'A photo can’t show your roots.',
    causes: [{ title: 'Too much water', likelihood: 'Likely', why: 'Wet soil', check: 'Lift the pot', fix: 'Let it dry' }],
  } });
  act(() => { q('soil-wet').click(); });
  await pickPhoto();
  expect(plantAPI.diagnosePhoto).toHaveBeenCalledWith({ path: 'p/1.jpg', soil_answer: 'wet' });
  expect(q('photo-check-confidence').textContent).toBe('Fairly sure');
  expect(q('photo-check-done').textContent).toContain('Likely: Too much water');
  expect(q('photo-check-done').textContent).toContain('A photo can’t show your roots.');
});

test('"None of these fit" is one tap, is recorded, and points back to the symptom list', async () => {
  plantAPI.upload.mockResolvedValue({ data: { path: 'p/1.jpg' } });
  plantAPI.diagnosePhoto.mockResolvedValue({ data: { confidence: 'Somewhat sure', limits: 'x', causes: [{ title: 'A', likelihood: 'Possible' }] } });
  act(() => { q('soil-dry').click(); });
  await pickPhoto();
  act(() => { q('photo-check-none-fit').click(); });
  expect(experimentAPI.event).toHaveBeenCalledWith('help_diagnosis', 'photo_check_none_fit', undefined);
  expect(q('photo-check-none-fit-note').textContent).toContain('symptom below');
});

test('a failed check says so, keeps the soil answer, and points to the list', async () => {
  plantAPI.upload.mockResolvedValue({ data: { path: 'p/1.jpg' } });
  plantAPI.diagnosePhoto.mockRejectedValue(new Error('down'));
  act(() => { q('soil-damp').click(); });
  await pickPhoto();
  expect(q('photo-check-failed').textContent).toContain('symptom list');
  expect(q('photo-check-choose')).not.toBeNull();
});
