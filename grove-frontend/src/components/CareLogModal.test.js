import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import CareLogModal from './CareLogModal';
import { careAPI } from '../lib/api';
import { toast } from 'sonner';

jest.mock('../lib/api', () => ({ careAPI: { createLog: jest.fn() } }));
jest.mock('sonner', () => ({ toast: { success: jest.fn(), error: jest.fn(), message: jest.fn() } }));
jest.mock('../lib/haptics', () => ({
  impactLight: jest.fn(),
  impactMedium: jest.fn(),
  success: jest.fn(),
  spawnRipple: jest.fn(),
}));
// Jest here cannot resolve the `@/` alias, so the dialog is mocked as a plain container.
jest.mock(
  '@/components/ui/dialog',
  () => {
    const React = require('react');
    const box = (name) => ({ children }) => React.createElement('div', { 'data-mock': name }, children);
    return {
      Dialog: ({ open, children }) => (open ? React.createElement('div', null, children) : null),
      DialogContent: box('content'),
      DialogHeader: box('header'),
      DialogTitle: box('title'),
    };
  },
  { virtual: true }
);

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container;
let root;

const q = (id) => container.querySelector(`[data-testid="${id}"]`);
const click = (el) => act(() => el.dispatchEvent(new MouseEvent('click', { bubbles: true })));
const flush = () => act(async () => {});

const mount = async (props = {}) => {
  const onClose = props.onClose || jest.fn();
  const onLogged = props.onLogged || jest.fn();
  await act(async () => {
    root.render(<CareLogModal open onClose={onClose} plantId="p1" plantName="Monty" onLogged={onLogged} />);
  });
  return { onClose, onLogged };
};

beforeEach(() => {
  jest.clearAllMocks();
  careAPI.createLog.mockResolvedValue({ data: { _meta: {} } });
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

test('offers a Soil test tile next to the other care actions', async () => {
  await mount();
  expect(q('care-action-soil_check').textContent).toBe('Soil test');
  expect(q('care-action-water')).not.toBeNull();
});

test('the soil fields appear only while Soil test is selected', async () => {
  await mount();
  expect(q('care-soil-fields')).toBeNull();
  await click(q('care-action-soil_check'));
  expect(q('care-soil-fields')).not.toBeNull();
  await click(q('care-action-soil_check'));
  expect(q('care-soil-fields')).toBeNull();
});

test('logging a soil test without an outcome shows a plain error and sends nothing', async () => {
  await mount();
  await click(q('care-action-soil_check'));
  await click(q('care-log-submit'));
  expect(q('care-soil-error').textContent).toBe('Choose what you felt: dry or damp.');
  expect(careAPI.createLog).not.toHaveBeenCalled();
});

test('sends the outcome and decision, shows the coaching, and closes', async () => {
  careAPI.createLog.mockResolvedValue({ data: { _meta: { soil_coaching: 'Dry soil is ready for a drink.' } } });
  const { onClose, onLogged } = await mount();
  await click(q('care-action-soil_check'));
  await click(q('care-soil-outcome-dry'));
  await click(q('care-soil-decision-water'));
  await click(q('care-log-submit'));
  await flush();
  expect(careAPI.createLog).toHaveBeenCalledWith('p1', {
    actions: ['soil_check'],
    notes: '',
    soil_outcome: 'dry',
    soil_decision: 'water',
  });
  expect(toast.message).toHaveBeenCalledWith('Dry soil is ready for a drink.');
  expect(onLogged).toHaveBeenCalledTimes(1);
  expect(onClose).toHaveBeenCalledTimes(1);
});

test('the decision is optional and goes out as null', async () => {
  await mount();
  await click(q('care-action-soil_check'));
  await click(q('care-soil-outcome-damp'));
  await click(q('care-log-submit'));
  await flush();
  expect(careAPI.createLog.mock.calls[0][1].soil_decision).toBeNull();
  expect(careAPI.createLog.mock.calls[0][1].soil_outcome).toBe('damp');
});

test('a soil test and watering can be logged in one sweep', async () => {
  await mount();
  await click(q('care-action-water'));
  await click(q('care-action-soil_check'));
  await click(q('care-soil-outcome-dry'));
  await click(q('care-log-submit'));
  await flush();
  const payload = careAPI.createLog.mock.calls[0][1];
  expect(payload.actions).toEqual(['water', 'soil_check']);
  expect(payload.soil_outcome).toBe('dry');
});

test('other care actions send no soil fields at all', async () => {
  await mount();
  await click(q('care-action-water'));
  await click(q('care-log-submit'));
  await flush();
  expect(careAPI.createLog).toHaveBeenCalledWith('p1', { actions: ['water'], notes: '' });
  expect(toast.message).not.toHaveBeenCalled();
});

test('a failed save keeps the modal open and shows the existing error toast', async () => {
  careAPI.createLog.mockRejectedValue(new Error('network'));
  const { onClose } = await mount();
  await click(q('care-action-soil_check'));
  await click(q('care-soil-outcome-dry'));
  await click(q('care-log-submit'));
  await flush();
  expect(toast.error).toHaveBeenCalledWith('Failed to log care action');
  expect(onClose).not.toHaveBeenCalled();
});

test('offers Light check and Wipe leaves tiles that log those actions', async () => {
  await mount();
  expect(q('care-action-light_check').textContent).toBe('Light check');
  expect(q('care-action-clean').textContent).toBe('Wipe leaves');
  await click(q('care-action-light_check'));
  await click(q('care-action-clean'));
  await click(q('care-log-submit'));
  await flush();
  expect(careAPI.createLog).toHaveBeenCalledWith('p1', { actions: ['light_check', 'clean'], notes: '' });
});

test('the success toast uses the tile name, not the stored action id', async () => {
  await mount();
  await click(q('care-action-soil_check'));
  await click(q('care-soil-outcome-dry'));
  await click(q('care-log-submit'));
  await flush();
  expect(toast.success).toHaveBeenCalledWith('Soil test logged for Monty');
});

test('a single wipe is named in words, and several actions are counted', async () => {
  await mount();
  await click(q('care-action-clean'));
  await click(q('care-log-submit'));
  await flush();
  expect(toast.success).toHaveBeenCalledWith('Wipe leaves logged for Monty');
  await mount();
  await click(q('care-action-water'));
  await click(q('care-action-mist'));
  await click(q('care-log-submit'));
  await flush();
  expect(toast.success).toHaveBeenCalledWith('2 actions logged for Monty');
});
