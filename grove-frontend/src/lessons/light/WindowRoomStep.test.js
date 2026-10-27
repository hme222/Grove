import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import WindowRoomStep from './WindowRoomStep';
import { lightAPI } from '../../lib/api';

jest.mock('../../lib/api', () => ({ lightAPI: { guide: jest.fn(), setWindow: jest.fn(), prompt: jest.fn() } }));

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const DIRS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
const guide = (hemisphere = 'north') => ({
  data: {
    hemisphere,
    view: 'open',
    items: DIRS.flatMap((direction) =>
      ['summer', 'winter'].map((season) => ({
        direction, draw_direction: direction, season,
        level: season === 'summer' ? 'bright_direct' : 'medium',
        arrives: `arrives ${direction}`,
      }))
    ),
  },
});
const WINDOW = { sun: 'afternoon', direction: 'SW', draw_direction: 'SW', view: 'open', hemisphere: 'north', season: 'summer', level: 'bright_direct', arrives: 'Hot sun from midday into the evening.', lamp: false };

let container;
let root;
const q = (id) => container.querySelector(`[data-testid="${id}"]`);
const click = (id) => act(() => q(id).dispatchEvent(new MouseEvent('click', { bubbles: true })));
const flush = () => act(async () => {});
const mount = async (window = WINDOW) => {
  await act(async () => {
    root.render(<WindowRoomStep window={window} />);
  });
  await flush();
};

beforeEach(() => {
  jest.clearAllMocks();
  lightAPI.guide.mockResolvedValue(guide());
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

test('writes the picked window as text, with the level and when the sun arrives', async () => {
  await mount();
  expect(q('room-text').textContent).toContain('southwest');
  expect(q('room-text').textContent).toContain('Direct sun');
  expect(q('room-text').textContent).toContain('arrives SW');
  expect(q('chip-SW').getAttribute('aria-pressed')).toBe('true');
});

test('chips change the picture and text without saving anything', async () => {
  await mount();
  click('chip-W');
  expect(q('chip-W').getAttribute('aria-pressed')).toBe('true');
  expect(q('chip-SW').getAttribute('aria-pressed')).toBe('false');
  expect(q('room-text').textContent).toContain('arrives W');
  expect(lightAPI.setWindow).not.toHaveBeenCalled();
  expect(lightAPI.prompt).not.toHaveBeenCalled();
});

test('the season switch changes the level in the text', async () => {
  await mount();
  click('season-winter');
  expect(q('season-winter').getAttribute('aria-pressed')).toBe('true');
  expect(q('room-text').textContent).toContain('Medium');
  click('season-summer');
  expect(q('room-text').textContent).toContain('Direct sun');
});

test('the room is drawn for the picked window', async () => {
  await mount();
  expect(q('nook-canvas')).not.toBeNull();
  expect(q('nook-canvas').getAttribute('aria-label')).toContain('southwest');
});

test('a south-hemisphere user gets the south-hemisphere guide', async () => {
  await mount({ ...WINDOW, hemisphere: 'south' });
  expect(lightAPI.guide).toHaveBeenCalledWith('south', 'open');
});

test('no window shows the lamp text and the grow-light line, and hides the chips', async () => {
  await mount({ sun: 'nowindow', direction: null, draw_direction: null, view: 'open', hemisphere: 'north', season: 'summer', level: 'low', arrives: 'No window here. A lamp or grow light will do the work.', lamp: true });
  expect(q('chip-N')).toBeNull();
  expect(q('season-summer')).toBeNull();
  expect(q('room-text').textContent).toContain('lit by a lamp');
  expect(q('room-grow-light').textContent).toBe('A lamp or grow light does the work of a window. Choose one made for low light plants.');
  expect(lightAPI.guide).not.toHaveBeenCalled();
});

test('a guide failure still shows the picked window as text, with an error', async () => {
  lightAPI.guide.mockRejectedValue(new Error('network'));
  await mount();
  expect(q('room-error').getAttribute('role')).toBe('alert');
  expect(q('room-text').textContent).toContain('southwest');
  expect(q('room-text').textContent).toContain('Hot sun from midday into the evening.');
});

test('the two glass footnotes are there', async () => {
  await mount();
  expect(q('room-footnotes').textContent).toContain('West and southwest glass gets hot. A sheer curtain helps.');
  expect(q('room-footnotes').textContent).toContain('North glass runs cold in winter. Keep leaves off it.');
});

test('every chip and switch is a button at least 44px tall', async () => {
  await mount();
  [...DIRS.map((d) => `chip-${d}`), 'season-summer', 'season-winter'].forEach((id) => {
    expect(q(id).tagName).toBe('BUTTON');
    expect(q(id).className).toContain('min-h-[44px]');
  });
});


test('a south-hemisphere user gets footnotes about the right glass', async () => {
  await mount({ ...WINDOW, hemisphere: 'south' });
  const text = q('room-footnotes').textContent;
  expect(text).toContain('West and northwest glass gets hot. A sheer curtain helps.');
  expect(text).toContain('South glass runs cold in winter. Keep leaves off it.');
  expect(text).not.toContain('North glass');
});

test('nothing in the room step says nook, with or without a window', async () => {
  await mount();
  const labels = [...container.querySelectorAll('[aria-label]')].map((el) => el.getAttribute('aria-label')).join(' ');
  expect(`${container.textContent} ${labels}`.toLowerCase()).not.toContain('nook');
  await mount({ sun: 'nowindow', direction: null, draw_direction: null, view: 'open', hemisphere: 'north', season: 'summer', level: 'low', arrives: 'x', lamp: true });
  const lampLabels = [...container.querySelectorAll('[aria-label]')].map((el) => el.getAttribute('aria-label')).join(' ');
  expect(`${container.textContent} ${lampLabels}`.toLowerCase()).not.toContain('nook');
});
