import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import LocationFields from './LocationFields';
import { userAPI, zoneAPI } from '../../lib/api';

jest.mock('../../lib/api', () => ({ userAPI: { updateMe: jest.fn() }, zoneAPI: { lookup: jest.fn() } }));
let mockUser;
const mockRefreshUser = jest.fn();
jest.mock('../../contexts/AuthContext', () => ({ useAuth: () => ({ user: mockUser, refreshUser: mockRefreshUser }) }));

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let container; let root;
const q = (id) => container.querySelector(`[data-testid="${id}"]`);
const mount = async () => { await act(async () => { root.render(<LocationFields />); }); };
const flush = async () => { await act(async () => { await Promise.resolve(); await Promise.resolve(); }); };
const advance = async (ms) => { await act(async () => { jest.advanceTimersByTime(ms); }); await flush(); };
const setValue = (el, value) => {
  const proto = el.tagName === 'SELECT' ? window.HTMLSelectElement.prototype : window.HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, value);
  el.dispatchEvent(new Event(el.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }));
};
const type = async (el, value) => { await act(async () => { setValue(el, value); }); };
const blur = async (el) => { await act(async () => { el.focus(); el.blur(); }); await flush(); };
const labelFor = (el) => container.querySelector(`label[for="${el.id}"]`).textContent;

const found = (zone) => ({ data: { zone, system: 'USDA', source: 'zip-prefix' } });
const deferred = () => { let resolve; const promise = new Promise((r) => { resolve = r; }); return { promise, resolve }; };

beforeEach(() => {
  jest.useFakeTimers();
  mockUser = {
    location_country: 'US', location_postcode: '02139', hardiness_zone: '6b',
    hardiness_zone_system: 'USDA', hardiness_zone_source: 'zip-prefix', hemisphere: 'north',
  };
  mockRefreshUser.mockReset().mockResolvedValue(undefined);
  zoneAPI.lookup.mockReset().mockResolvedValue(found('7b'));
  userAPI.updateMe.mockReset().mockImplementation(async (patch) => ({
    data: { ...mockUser, ...patch, hardiness_zone: patch.hardiness_zone ?? '7b', hardiness_zone_system: 'USDA' },
  }));
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  jest.useRealTimers();
});

test('the label and placeholder follow the country', async () => {
  await mount();
  expect(q('location-fields')).not.toBeNull();
  const code = q('location-code');
  expect(labelFor(code)).toBe('ZIP code');
  expect(code.getAttribute('placeholder')).toBe('e.g. 10001');
  expect(labelFor(q('location-country'))).toBe('Country');
  await type(q('location-country'), 'UK');
  expect(labelFor(q('location-code'))).toBe('Postcode');
  expect(q('location-code').getAttribute('placeholder')).toBe('e.g. SW1A 1AA');
});

test('a saved GB country reads as Postcode', async () => {
  mockUser = { ...mockUser, location_country: 'GB', location_postcode: 'SW1A 1AA' };
  await mount();
  expect(labelFor(q('location-code'))).toBe('Postcode');
});

test('a found code saves once after 600ms and shows the saved line with Undo', async () => {
  await mount();
  await type(q('location-code'), '10001');
  await advance(599);
  expect(userAPI.updateMe).not.toHaveBeenCalled();
  await advance(1);
  await flush();
  expect(zoneAPI.lookup).toHaveBeenCalledWith('US', '10001');
  expect(userAPI.updateMe).toHaveBeenCalledTimes(1);
  expect(userAPI.updateMe).toHaveBeenCalledWith({ location_country: 'US', location_postcode: '10001', hemisphere: 'north' });
  expect(q('location-saved').textContent).toContain('✓ Saved · USDA zone 7b');
  expect(q('location-saved').querySelector('button').textContent).toBe('Undo');
});

test('leaving the field saves right away, once', async () => {
  await mount();
  await type(q('location-code'), '10001');
  await blur(q('location-code'));
  await flush();
  expect(userAPI.updateMe).toHaveBeenCalledTimes(1);
  await advance(600);
  expect(userAPI.updateMe).toHaveBeenCalledTimes(1);
});

test('the saved line reads the zone from the server, not the lookup', async () => {
  zoneAPI.lookup.mockResolvedValue(found('8a'));
  await mount();
  await type(q('location-code'), '10001');
  await advance(600);
  expect(q('location-saved').textContent).toContain('USDA zone 7b');
});

test('Undo of a derived zone sends the previous code alone so the server re-derives it, announces and keeps focus', async () => {
  await mount();
  await type(q('location-code'), '10001');
  await advance(600);
  await act(async () => { q('location-saved').querySelector('button').click(); });
  await advance(1);
  expect(userAPI.updateMe).toHaveBeenCalledTimes(2);
  expect(userAPI.updateMe).toHaveBeenLastCalledWith({
    location_country: 'US', location_postcode: '02139', hemisphere: 'north',
  });
  expect(q('location-code').value).toBe('02139');
  expect(q('location-saved')).toBeNull();
  expect(q('location-status').getAttribute('role')).toBe('status');
  expect(q('location-status').textContent).toContain('Undone');
  expect(document.activeElement).toBe(q('location-code'));
});

test('a code that is not found says so and saves nothing', async () => {
  zoneAPI.lookup.mockResolvedValue({ data: { zone: null, system: null, source: null } });
  await mount();
  await type(q('location-code'), '00000');
  await advance(600);
  expect(q('location-not-found').textContent).toBe('We couldn’t find that code. Nothing was saved.');
  expect(q('location-code').getAttribute('aria-describedby')).toContain('location-not-found');
  expect(userAPI.updateMe).not.toHaveBeenCalled();
});

test('while a lookup is pending, a polite status reads Looking up…', async () => {
  const pending = deferred();
  zoneAPI.lookup.mockReturnValue(pending.promise);
  await mount();
  await type(q('location-code'), '10001');
  await advance(600);
  const status = q('location-status');
  expect(status.getAttribute('role')).toBe('status');
  expect(status.getAttribute('aria-live')).toBe('polite');
  expect(status.textContent).toContain('Looking up…');
  await act(async () => { pending.resolve(found('7b')); });
  await flush();
  expect(status.textContent).not.toContain('Looking up…');
});

test('out of order: only the latest typed code is saved', async () => {
  const a = deferred(); const b = deferred();
  zoneAPI.lookup.mockImplementation((_c, code) => (code === '11111' ? a.promise : b.promise));
  await mount();
  await type(q('location-code'), '11111');
  await advance(600);
  await type(q('location-code'), '22222');
  await advance(600);
  await act(async () => { b.resolve(found('5a')); });
  await flush();
  await act(async () => { a.resolve(found('9a')); });
  await flush();
  expect(userAPI.updateMe).toHaveBeenCalledTimes(1);
  expect(userAPI.updateMe).toHaveBeenCalledWith({ location_country: 'US', location_postcode: '22222', hemisphere: 'north' });
});

test('a failed save shows Try again and retrying saves', async () => {
  userAPI.updateMe.mockRejectedValueOnce(new Error('offline'));
  await mount();
  await type(q('location-code'), '10001');
  await advance(600);
  expect(q('location-error').textContent).toContain('Try again');
  expect(q('location-code').getAttribute('aria-describedby')).toContain('location-error');
  expect(q('location-saved')).toBeNull();
  await act(async () => { q('location-error').querySelector('button').click(); });
  await flush();
  expect(userAPI.updateMe).toHaveBeenCalledTimes(2);
  expect(q('location-saved').textContent).toContain('USDA zone 7b');
});

test('Enter it instead: empty shows an error, filled saves the zone with Undo', async () => {
  await mount();
  await act(async () => { q('location-enter-zone').click(); });
  const manual = q('profile-zone-manual');
  expect(manual).not.toBeNull();
  expect(labelFor(manual)).toBeTruthy();
  expect(document.activeElement).toBe(manual);
  await type(manual, '');
  await blur(manual);
  expect(q('zone-manual-error').textContent).toBe('Enter a zone, like 7b.');
  expect(manual.getAttribute('aria-invalid')).toBe('true');
  expect(userAPI.updateMe).not.toHaveBeenCalled();
  await type(manual, '7a');
  await blur(manual);
  await flush();
  expect(userAPI.updateMe).toHaveBeenCalledWith({ hardiness_zone: '7a' });
  expect(q('zone-manual-error')).toBeNull();
  expect(q('location-saved').textContent).toContain('✓ Saved · USDA zone 7a');
  await act(async () => { q('location-saved').querySelector('button').click(); });
  await flush();
  // The previous zone was derived from 02139, so Undo re-derives it rather than marking it manual.
  expect(userAPI.updateMe).toHaveBeenLastCalledWith({ location_country: 'US', location_postcode: '02139', hemisphere: 'north' });
});

test('Undo of a manual zone sends the previous zone', async () => {
  mockUser = { ...mockUser, hardiness_zone: '8a', hardiness_zone_source: 'manual' };
  await mount();
  await type(q('location-code'), '10001');
  await advance(600);
  await act(async () => { q('location-saved').querySelector('button').click(); });
  await advance(1);
  expect(userAPI.updateMe).toHaveBeenLastCalledWith({
    location_country: 'US', location_postcode: '02139', hardiness_zone: '8a', hardiness_zone_system: 'USDA', hemisphere: 'north',
  });
});

test('Undo with no previous code sends the previous zone too', async () => {
  mockUser = { hemisphere: 'north' };
  await mount();
  await type(q('location-code'), '10001');
  await advance(600);
  await act(async () => { q('location-saved').querySelector('button').click(); });
  await advance(1);
  expect(userAPI.updateMe).toHaveBeenLastCalledWith({
    location_country: '', location_postcode: '', hardiness_zone: '', hemisphere: 'north',
  });
});

test('a save keeps the hemisphere the person already has', async () => {
  mockUser = { ...mockUser, hemisphere: 'south' };
  await mount();
  await type(q('location-code'), '10001');
  await advance(600);
  expect(userAPI.updateMe).toHaveBeenCalledWith({ location_country: 'US', location_postcode: '10001', hemisphere: 'south' });
});

test('with no hemisphere set, a save lets the server derive it', async () => {
  mockUser = { location_country: 'US', location_postcode: '02139' };
  await mount();
  await type(q('location-code'), '10001');
  await advance(600);
  expect(userAPI.updateMe).toHaveBeenCalledWith({ location_country: 'US', location_postcode: '10001' });
});

test('closing the sheet during the debounce still saves', async () => {
  await mount();
  await type(q('location-code'), '10001');
  await advance(300);
  act(() => root.unmount());
  await flush();
  await flush();
  expect(userAPI.updateMe).toHaveBeenCalledWith({ location_country: 'US', location_postcode: '10001', hemisphere: 'north' });
  root = createRoot(container);
});

test('closing the sheet during a lookup still saves', async () => {
  const a = deferred();
  zoneAPI.lookup.mockReturnValue(a.promise);
  await mount();
  await type(q('location-code'), '10001');
  await blur(q('location-code'));
  act(() => root.unmount());
  await act(async () => { a.resolve(found('7b')); });
  await flush();
  expect(userAPI.updateMe).toHaveBeenCalledWith({ location_country: 'US', location_postcode: '10001', hemisphere: 'north' });
  root = createRoot(container);
});

test('editing the field while a lookup runs drops the old lookup', async () => {
  const a = deferred();
  zoneAPI.lookup.mockReturnValueOnce(a.promise);
  await mount();
  await type(q('location-code'), '11111');
  await advance(600);
  expect(q('location-status').textContent).toContain('Looking up…');
  await type(q('location-code'), '1111');
  await act(async () => { a.resolve(found('9a')); });
  await flush();
  expect(userAPI.updateMe).not.toHaveBeenCalled();
});

test('a failed save keeps showing the old saved zone, never the unsaved one', async () => {
  userAPI.updateMe.mockRejectedValueOnce(new Error('offline'));
  await mount();
  await type(q('location-code'), '10001');
  await advance(600);
  expect(q('location-error').textContent).toContain('Try again');
  expect(q('location-saved')).toBeNull();
  expect(q('zone-source-label').textContent).toContain('USDA zone 6b');
  expect(q('zone-source-label').textContent).not.toContain('7b');
  expect(q('location-code').value).toBe('10001');
});

test('a failed Undo brings the saved line back and focuses Undo', async () => {
  await mount();
  await type(q('location-code'), '10001');
  await advance(600);
  userAPI.updateMe.mockRejectedValueOnce(new Error('offline'));
  await act(async () => { q('location-saved').querySelector('button').click(); });
  await advance(1);
  const undoButton = q('location-saved').querySelector('button');
  expect(q('location-undo-error').textContent).toContain('Try again');
  expect(document.activeElement).toBe(undoButton);
  expect(undoButton.getAttribute('aria-describedby')).toBe('location-undo-error');
});

test('retrying a failed lookup that ends not-found keeps focus on the field', async () => {
  zoneAPI.lookup.mockRejectedValueOnce(new Error('offline'))
    .mockResolvedValueOnce({ data: { zone: null } });
  await mount();
  await type(q('location-code'), '00000');
  await advance(600);
  expect(q('location-lookup-error').textContent).toContain('Try again');
  await act(async () => { q('location-lookup-error').querySelector('button').click(); });
  await advance(1);
  expect(q('location-not-found')).not.toBeNull();
  expect(document.activeElement).toBe(q('location-code'));
  expect(userAPI.updateMe).not.toHaveBeenCalled();
});
