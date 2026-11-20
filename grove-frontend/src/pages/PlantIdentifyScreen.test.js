import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import PlantIdentifyScreen from './PlantIdentifyScreen';
import { plantAPI } from '../lib/api';

jest.mock('../lib/api', () => ({
  plantAPI: { upload: jest.fn(), identify: jest.fn(), create: jest.fn(), getAll: jest.fn() },
}));
jest.mock('react-router-dom', () => ({ useNavigate: () => jest.fn() }), { virtual: true });
jest.mock('../components/BackButton', () => () => null);
jest.mock('../components/PlantImage', () => () => <div data-testid="plant-image" />);
jest.mock('../components/ToxicityBadge', () => () => null);
jest.mock('../components/PetSafetyLookup', () => () => null);
jest.mock('../components/Loading', () => ({ Spinner: () => null }));
jest.mock('../components/FirstPlantCelebration', () => ({ firstPlantState: () => ({}), groveIsEmpty: async () => false }));
jest.mock('../lib/haptics', () => ({ impactLight: jest.fn(), impactMedium: jest.fn(), success: jest.fn() }));
jest.mock('sonner', () => ({ toast: { error: jest.fn(), success: jest.fn() } }));

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let host; let root;
const q = (id) => host.querySelector(`[data-testid="${id}"]`);
const flush = () => act(async () => { await new Promise((r) => setTimeout(r, 0)); });

beforeEach(() => {
  jest.clearAllMocks();
  host = document.createElement('div'); document.body.appendChild(host);
  root = createRoot(host);
});
afterEach(() => { act(() => root.unmount()); host.remove(); });

const mount = async (onSwitchToManual = jest.fn()) => {
  await act(async () => { root.render(<PlantIdentifyScreen onSwitchToManual={onSwitchToManual} />); });
  return onSwitchToManual;
};

// The screen has two file inputs (camera and gallery); either one starts an identification.
const pickPhoto = async () => {
  const input = host.querySelector('input[type="file"]');
  Object.defineProperty(input, 'files', { value: [new File(['x'], 'p.jpg', { type: 'image/jpeg' })], configurable: true });
  await act(async () => { input.dispatchEvent(new Event('change', { bubbles: true })); });
  await flush();
};

const GOOD = { identified: true, confidence: 0.93, commonName: 'Pothos', latinName: 'Epipremnum aureum', wateringFrequencyDays: 7, growMedium: 'soil' };
const refused = (status, code, message) => ({ response: { status, data: { detail: { code, message } } } });

test('when the free photo IDs are used up the screen says so in the server\'s words and offers to search by name', async () => {
  plantAPI.upload.mockResolvedValue({ data: { path: 'p/1.jpg' } });
  plantAPI.identify.mockRejectedValue(refused(402, 'free_id_limit', 'You’ve used your 3 free photo IDs. You can still add a plant by searching for its name.'));
  const toManual = await mount();
  await pickPhoto();
  expect(q('identify-refused-title').textContent).toBe('Free photo IDs used');
  expect(q('identify-refused-message').textContent).toContain('searching for its name');
  expect(q('identify-retry')).toBeNull(); // trying again cannot help
  act(() => { q('identify-go-manual').click(); });
  expect(toManual).toHaveBeenCalled();
});

test('a cost cap reads as a limit reached, not as a broken service', async () => {
  plantAPI.upload.mockResolvedValue({ data: { path: 'p/1.jpg' } });
  plantAPI.identify.mockRejectedValue(refused(429, 'fair_use_daily', 'You’ve reached today’s photo limit.'));
  await mount();
  await pickPhoto();
  expect(q('identify-refused-title').textContent).toBe('Photo ID limit reached');
  expect(q('identify-refused-message').textContent).toContain('today’s photo limit');
});

test('an ordinary failure still offers Try again and Enter manually', async () => {
  plantAPI.upload.mockResolvedValue({ data: { path: 'p/1.jpg' } });
  plantAPI.identify.mockRejectedValue({ response: { status: 500, data: {} } });
  await mount();
  await pickPhoto();
  expect(q('identify-retry')).not.toBeNull();
  expect(q('identify-go-manual').textContent).toBe('Enter manually');
  expect(q('identify-refused-title')).toBeNull();
});

test('a free account sees how many free IDs are left after a good result', async () => {
  plantAPI.upload.mockResolvedValue({ data: { path: 'p/1.jpg' } });
  plantAPI.identify.mockResolvedValue({ data: { ...GOOD, freeIdsLeft: 1 } });
  await mount();
  await pickPhoto();
  expect(q('identify-free-left').textContent).toBe('1 free photo ID left.');
});

test('the last free ID reads as a fact with a way forward, not as a wall', async () => {
  plantAPI.upload.mockResolvedValue({ data: { path: 'p/1.jpg' } });
  plantAPI.identify.mockResolvedValue({ data: { ...GOOD, freeIdsLeft: 0 } });
  await mount();
  await pickPhoto();
  expect(q('identify-free-left').textContent).toBe('That was your last free photo ID. You can still add plants by name.');
});

test('a Pro account sees no counter', async () => {
  plantAPI.upload.mockResolvedValue({ data: { path: 'p/1.jpg' } });
  plantAPI.identify.mockResolvedValue({ data: GOOD });
  await mount();
  await pickPhoto();
  expect(q('identify-review')).not.toBeNull();
  expect(q('identify-free-left')).toBeNull();
});
