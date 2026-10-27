import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import ClosingStep from './ClosingStep';
import { nookAPI } from '../../lib/api';
import { canvasSupported, saveKeepsake } from './keepsake';

jest.mock('../../lib/api', () => ({ nookAPI: { state: jest.fn() } }));
jest.mock('./keepsake', () => ({ canvasSupported: jest.fn(), saveKeepsake: jest.fn() }));

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const WINDOW = { sun: 'afternoon', direction: 'SW', draw_direction: 'SW', view: 'tree', hemisphere: 'north', season: 'summer', level: 'bright_direct', arrives: 'Hot sun from midday into the evening.', lamp: false };
const STATE = (over = {}) => ({
  unlocked: ['window', 'table', 'sill', 'floor'], pip: { form: 'seed', location: 'sill' },
  hero: null, shelf_plants: [], readiness: null, window: WINDOW, ...over,
});

let container;
let root;
const q = (id) => container.querySelector(`[data-testid="${id}"]`);
const flush = () => act(async () => {});
const mount = async (props) => {
  await act(async () => {
    root.render(<ClosingStep nookOn={false} picked={null} markDone={<div data-testid="mark-done">done</div>} {...props} />);
  });
  await flush();
};

beforeEach(() => {
  jest.clearAllMocks();
  nookAPI.state.mockResolvedValue({ data: STATE() });
  canvasSupported.mockReturnValue(false);
  saveKeepsake.mockReturnValue(true);
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

test('opted in shows the nook lit their way with Pip and his line', async () => {
  await mount({ nookOn: true });
  expect(q('closing-pip-line').textContent).toBe("I'm Pip. I'm your guide, not a plant. I'll sit where your light is good.");
  expect(q('nook-canvas').getAttribute('aria-label')).toContain('nook');
  expect(q('closing-text').textContent).toContain('southwest');
  expect(q('mark-done')).not.toBeNull();
});

test('not opted in shows no Pip line and no nook nudge', async () => {
  await mount({ picked: WINDOW });
  const text = container.textContent.toLowerCase();
  expect(text).not.toContain('pip');
  expect(text).not.toContain('nook');
  expect(q('closing-pip-line')).toBeNull();
  expect(nookAPI.state).not.toHaveBeenCalled();
});

test('not opted in shows the keepsake text with the direction and the season', async () => {
  await mount({ picked: WINDOW });
  expect(q('keepsake-text').textContent).toContain('Roughly where the light falls');
  expect(q('keepsake-text').textContent).toContain('southwest');
  expect(q('keepsake-text').textContent).toContain('summer');
});

test('the save button is hidden without canvas support, and saves once when shown', async () => {
  await mount({ picked: WINDOW });
  expect(q('keepsake-save')).toBeNull();
  canvasSupported.mockReturnValue(true);
  await mount({ picked: WINDOW });
  act(() => q('keepsake-save').dispatchEvent(new MouseEvent('click', { bubbles: true })));
  act(() => q('keepsake-save').dispatchEvent(new MouseEvent('click', { bubbles: true })));
  expect(saveKeepsake).toHaveBeenCalledTimes(1);
  expect(saveKeepsake.mock.calls[0][0]).toEqual(WINDOW);
});

test('a failed save says so in words', async () => {
  canvasSupported.mockReturnValue(true);
  saveKeepsake.mockReturnValue(false);
  await mount({ picked: WINDOW });
  act(() => q('keepsake-save').dispatchEvent(new MouseEvent('click', { bubbles: true })));
  expect(q('keepsake-error').textContent).toBe('Could not save the picture on this device.');
});

test('with no window saved and no nook there is no keepsake, only a quiet line', async () => {
  nookAPI.state.mockResolvedValue({ data: STATE({ window: null }) });
  await mount({});
  expect(q('keepsake-text')).toBeNull();
  expect(q('closing-none').textContent).toBe("You haven't picked a window yet. Pick one whenever you like.");
  expect(q('mark-done')).not.toBeNull();
});

test('a lamp keepsake says so without mentioning the nook', async () => {
  await mount({ picked: { ...WINDOW, lamp: true, direction: null, draw_direction: null, sun: 'nowindow' } });
  const text = q('keepsake-text').textContent.toLowerCase();
  expect(text).toContain('lamp');
  expect(text).not.toContain('nook');
});

test('if the nook cannot be loaded it still shows the line and the way to finish', async () => {
  nookAPI.state.mockRejectedValue(new Error('network'));
  await mount({ nookOn: true });
  expect(q('closing-pip-line')).not.toBeNull();
  expect(q('nook-canvas')).toBeNull();
  expect(q('mark-done')).not.toBeNull();
});
