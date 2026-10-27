import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import NookPage from './NookPage';
import { nookAPI } from '../lib/api';

jest.mock('../lib/api', () => ({
  nookAPI: {
    state: jest.fn(),
    seen: jest.fn(),
    settings: jest.fn(),
    startReadiness: jest.fn(),
    completeStep: jest.fn(),
    looksOff: jest.fn(),
  },
  speciesAPI: { search: jest.fn() },
  getFileUrl: (path) => `https://files.test/${path}`,
}));

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({ useNavigate: () => mockNavigate }), { virtual: true });

const mockUpdateUser = jest.fn();
jest.mock('../contexts/AuthContext', () => ({ useAuth: () => ({ updateUser: mockUpdateUser }) }));

jest.mock('../components/PageHeader', () => ({
  PageHeader: ({ title }) => require('react').createElement('h1', null, title),
}));

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const PLANT = (id, over = {}) => ({ id, name: `Plant ${id}`, group: 'pothos', condition: 'fine', looks_off: false, ...over });

const STATE = (over = {}) => ({
  enabled: true,
  offered: true,
  level: 1,
  level_name: 'Bare',
  next_unlock: 'the shelf',
  unlocked: ['window', 'table', 'sill', 'floor'],
  grew: false,
  level_up: false,
  pip: { form: 'seed', location: 'sill' },
  hero: PLANT('p1'),
  shelf_plants: [],
  plants: [PLANT('p1')],
  readiness: null,
  quiet: false,
  weekly_days: 2,
  catalog_open: false,
  window: null,
  ...over,
});

let container;
let root;

const q = (id) => container.querySelector(`[data-testid="${id}"]`);
const click = (el) => act(() => el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })));
const flush = () => act(async () => {});
const mount = async () => {
  await act(async () => {
    root.render(<NookPage />);
  });
  await flush();
};

beforeEach(() => {
  jest.clearAllMocks();
  nookAPI.state.mockResolvedValue({ data: STATE() });
  nookAPI.seen.mockResolvedValue({ data: { ok: true } });
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

describe('loading', () => {
  test('shows a loading line, then the nook', async () => {
    let resolve;
    nookAPI.state.mockReturnValue(new Promise((r) => { resolve = r; }));
    await act(async () => root.render(<NookPage />));
    expect(container.textContent).toContain('Loading');
    await act(async () => resolve({ data: STATE() }));
    expect(q('nook-summary')).not.toBeNull();
  });

  test('a failed load offers a retry that loads again', async () => {
    nookAPI.state.mockRejectedValueOnce(new Error('network'));
    await mount();
    expect(q('load-error').textContent).toContain("Pip’s nook");
    expect(q('nook-canvas')).toBeNull();
    await click(q('load-retry'));
    await act(async () => { await new Promise((r) => setTimeout(r, 800)); });
    await flush();
    expect(q('nook-summary')).not.toBeNull();
  });
});

describe('when the nook is off', () => {
  beforeEach(() => nookAPI.state.mockResolvedValue({ data: STATE({ enabled: false }) }));

  test('says so and offers to turn it on, with no picture', async () => {
    await mount();
    expect(q('nook-off').textContent).toContain("Pip’s nook is off");
    expect(q('nook-canvas')).toBeNull();
  });

  test('turning it on saves, updates the signed-in user, and shows the nook', async () => {
    const saved = { nook_enabled: true, nook_offered_at: '2026-10-14T10:00:00Z', nook_hero_plant_id: null };
    nookAPI.settings.mockResolvedValue({ data: saved });
    nookAPI.state.mockResolvedValueOnce({ data: STATE({ enabled: false }) }).mockResolvedValue({ data: STATE() });
    await mount();
    await click(q('nook-turn-on'));
    await flush();
    expect(nookAPI.settings).toHaveBeenCalledWith({ enabled: true });
    expect(mockUpdateUser).toHaveBeenCalledWith(saved);
    expect(q('nook-summary')).not.toBeNull();
  });

  test('a failed turn on shows a plain error', async () => {
    nookAPI.settings.mockRejectedValue(new Error('network'));
    await mount();
    await click(q('nook-turn-on'));
    await flush();
    expect(container.querySelector('[role="alert"]').textContent).toBe('Couldn’t turn the nook on. Try again.');
  });
});

describe('the picture and what it says in words', () => {
  test('describes the nook for screen readers, with Pip\'s place', async () => {
    await mount();
    expect(q('nook-canvas').getAttribute('aria-label')).toBe("Pip’s nook, bare. Pip is on the sill.");
  });

  test('writes down the level, the week, what is next, and what is unlocked', async () => {
    await mount();
    expect(q('nook-summary').textContent).toContain('Your nook: Bare');
    expect(q('nook-rhythm')).toBeNull();
    expect(q('nook-summary').textContent).not.toMatch(/days? this week/);
    expect(q('nook-next').textContent).toBe('Next in your nook: the shelf.');
    expect(q('nook-items').textContent).toBe('Nothing is unlocked yet.');
  });

  test('has no days-this-week count and no numbers for growth', async () => {
    nookAPI.state.mockResolvedValue({ data: STATE({ weekly_days: 1 }) });
    await mount();
    expect(q('nook-rhythm')).toBeNull();
    expect(container.textContent).not.toMatch(/growth/i);
  });

  test('lists what has unlocked, and says when everything has', async () => {
    nookAPI.state.mockResolvedValue({
      data: STATE({
        level: 4,
        level_name: 'In bloom',
        next_unlock: null,
        unlocked: ['window', 'table', 'sill', 'floor', 'shelf', 'rug', 'lamp', 'hanging', 'wall-art'],
        pip: { form: 'bloom', location: 'shelf' },
      }),
    });
    await mount();
    expect(q('nook-items').textContent).toBe('In the nook: a shelf, a rug, a lamp, a hanging plant, a botanical print.');
    expect(q('nook-next').textContent).toBe('Everything is unlocked.');
    expect(q('nook-canvas').getAttribute('aria-label')).toContain('Pip is on the shelf');
  });
});

describe('Pip', () => {
  test('says the nook grew after a level up, and tells the server it was seen once', async () => {
    nookAPI.state.mockResolvedValue({ data: STATE({ grew: true, level_up: true, level: 2, level_name: 'Settling in' }) });
    await mount();
    expect(q('nook-pip-line').textContent).toBe("Your nook grew. It’s settling in now.");
    await flush();
    expect(nookAPI.seen).toHaveBeenCalledTimes(1);
  });

  test('does not tell the server anything when nothing is new', async () => {
    await mount();
    expect(nookAPI.seen).not.toHaveBeenCalled();
  });

  test('stays quiet, never celebrates, and points to the lesson while a plant needs attention', async () => {
    nookAPI.state.mockResolvedValue({
      data: STATE({
        quiet: true,
        grew: true,
        level_up: true,
        level_name: 'Settling in',
        plants: [PLANT('p1', { condition: 'needs-attention' })],
        hero: PLANT('p1', { condition: 'needs-attention' }),
      }),
    });
    await mount();
    expect(q('nook-pip-line').textContent).toContain('keep quiet');
    expect(q('nook-pip-line').textContent).toContain('One of your plants could use a look.');
    expect(q('nook-pip-line').textContent.toLowerCase()).not.toContain('grew');
    await click(q('nook-quiet-lesson'));
    expect(mockNavigate).toHaveBeenCalledWith('/lessons/plant-er');
  });

  test('has no lesson link when no plant needs attention', async () => {
    await mount();
    expect(q('nook-quiet-lesson')).toBeNull();
  });
});

describe('plants', () => {
  const TWO = () =>
    STATE({
      plants: [PLANT('p1'), PLANT('p2', { condition: 'due-soon' })],
      shelf_plants: [PLANT('p2', { condition: 'due-soon' })],
    });

  test('lists each plant with its condition in words and where the label comes from', async () => {
    nookAPI.state.mockResolvedValue({ data: TWO() });
    await mount();
    expect(q('nook-condition-p1').textContent).toBe('Healthy');
    expect(q('nook-condition-p2').textContent).toBe('Due soon');
    expect(q('nook-source').textContent).toBe("From your records and Grove’s plant check");
  });

  test('marking a plant as looking off saves and refreshes, and says so in words', async () => {
    nookAPI.looksOff.mockResolvedValue({ data: { looks_off: true } });
    nookAPI.state
      .mockResolvedValueOnce({ data: STATE() })
      .mockResolvedValue({ data: STATE({ plants: [PLANT('p1', { condition: 'needs-attention', looks_off: true })], quiet: true }) });
    await mount();
    await click(q('nook-looks-off-p1'));
    await flush();
    expect(nookAPI.looksOff).toHaveBeenCalledWith('p1', true);
    expect(q('nook-condition-p1').textContent).toBe('Needs a check, marked as looking off');
    expect(q('nook-looks-off-p1').getAttribute('aria-pressed')).toBe('true');
  });

  test('a double tap saves once', async () => {
    nookAPI.looksOff.mockResolvedValue({ data: { looks_off: true } });
    await mount();
    await act(async () => {
      const button = q('nook-looks-off-p1');
      button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    await flush();
    expect(nookAPI.looksOff).toHaveBeenCalledTimes(1);
  });

  test('a failed save shows a plain error', async () => {
    nookAPI.looksOff.mockRejectedValue(new Error('network'));
    await mount();
    await click(q('nook-looks-off-p1'));
    await flush();
    expect(q('nook-error').textContent).toBe('Couldn’t save that. Try again.');
  });

  test('the plant picker appears only with more than one plant and saves the choice', async () => {
    await mount();
    expect(q('nook-hero-select')).toBeNull();
    nookAPI.state.mockResolvedValue({ data: TWO() });
    nookAPI.settings.mockResolvedValue({ data: {} });
    await act(async () => root.render(null));
    await mount();
    const select = q('nook-hero-select');
    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set.call(select, 'p2');
      select.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await flush();
    expect(nookAPI.settings).toHaveBeenCalledWith({ hero_plant_id: 'p2' });
  });
});

describe('getting ready for a first plant', () => {
  test('shows the readiness panel when there is no plant', async () => {
    nookAPI.state.mockResolvedValue({ data: STATE({ hero: null, plants: [] }) });
    await mount();
    expect(q('nook-plants')).toBeNull();
    expect(q('readiness-search')).not.toBeNull();
  });

  test('starting and finishing steps saves and shows the new state', async () => {
    const started = STATE({
      hero: null,
      plants: [],
      readiness: {
        species_id: 's1', species_name: 'Pothos', watering_days: 9, group: 'pothos', state: 'seed',
        steps: [{ id: 'light-spot', done: false }, { id: 'drainage', done: false }, { id: 'soil-mix', done: false }],
      },
    });
    nookAPI.state.mockResolvedValue({ data: started });
    nookAPI.completeStep.mockResolvedValue({
      data: { ...started, readiness: { ...started.readiness, state: 'sprouting', steps: started.readiness.steps.map((s, i) => ({ ...s, done: i === 0 })) } },
    });
    await mount();
    expect(q('readiness-panel')).not.toBeNull();
    await click(q('readiness-step-light-spot'));
    await flush();
    expect(nookAPI.completeStep).toHaveBeenCalledWith('light-spot');
    expect(q('readiness-state').textContent).toContain('Sprouting');
  });

  test('is hidden once there is a real plant and no readiness plant', async () => {
    await mount();
    expect(q('readiness-panel')).toBeNull();
    expect(q('readiness-search')).toBeNull();
  });

  test('writes the window as text when one is saved, and says nothing when none is', async () => {
    await mount();
    expect(q('nook-window')).toBeNull();
    nookAPI.state.mockResolvedValue({
      data: STATE({ window: { sun: 'afternoon', direction: 'SW', draw_direction: 'SW', view: 'tree', season: 'summer', lamp: false, arrives: 'Hot sun from midday into the evening.' } }),
    });
    await act(async () => { root.unmount(); });
    root = createRoot(container);
    await mount();
    expect(q('nook-window').textContent).toBe('Your window faces southwest and looks out on a tree. Hot sun from midday into the evening.');
  });
});

describe('the paper layout', () => {
  const THREE = () =>
    STATE({
      plants: [PLANT('p1'), PLANT('p2', { condition: 'due-soon' }), PLANT('p3', { condition: 'needs-attention', looks_off: true, photo_url: 'plants/p3.jpg' })],
    });

  test('the room sits on a dark band, and Pip speaks in a light note over it, not a live region', async () => {
    await mount();
    const note = q('nook-pip');
    expect(note.getAttribute('role')).toBeNull();
    expect(note.getAttribute('aria-label')).toBe("Pip’s note");
    expect(note.className).toContain('bg-grove-paperCard');
    expect(note.className).toContain('-mt-10');
    expect(q('nook-canvas').closest('.bg-grove-forest')).not.toBeNull();
    expect(container.firstChild.className).toContain('bg-grove-paper');
  });

  test('the plants are a swipeable, keyboard-focusable row of tiles, one list item each', async () => {
    nookAPI.state.mockResolvedValue({ data: THREE() });
    await mount();
    const region = container.querySelector('[role="region"][aria-label="Your plants"]');
    expect(region).not.toBeNull();
    expect(region.getAttribute('tabindex')).toBe('0');
    expect(region.className).toContain('snap-x');
    expect(region.className).toContain('overflow-x-auto');
    const tiles = region.querySelectorAll('ul > li');
    expect(tiles).toHaveLength(3);
    expect(tiles[0].className).toContain('w-tile');
    expect(tiles[0].className).toContain('snap-start');
  });

  test('each tile says its status in words and has an icon, and shows a photo when the state carries one', async () => {
    nookAPI.state.mockResolvedValue({ data: THREE() });
    await mount();
    expect(q('nook-plant-p2').querySelector('svg')).not.toBeNull();
    expect(q('nook-condition-p2').textContent).toBe('Due soon');
    expect(q('nook-photo-p1').querySelector('img')).toBeNull();
    expect(q('nook-photo-p1').querySelector('svg')).not.toBeNull();
    const img = q('nook-photo-p3').querySelector('img');
    expect(img).not.toBeNull();
    expect(img.getAttribute('alt')).toBe('');
    expect(img.getAttribute('src')).toBe('https://files.test/plants/p3.jpg');
  });

  test('Looks off is a 44px toggle that reports whether it is pressed', async () => {
    nookAPI.state.mockResolvedValue({ data: THREE() });
    await mount();
    expect(q('nook-looks-off-p1').getAttribute('aria-pressed')).toBe('false');
    expect(q('nook-looks-off-p3').getAttribute('aria-pressed')).toBe('true');
    expect(q('nook-looks-off-p1').className).toContain('min-h-touch');
    expect(q('nook-looks-off-p1').getAttribute('aria-label')).toBe('Looks off: Plant p1');
    expect(q('nook-looks-off-p3').getAttribute('aria-label')).toBe('Looks off, Plant p3, pressed');
    nookAPI.looksOff.mockResolvedValue({ data: {} });
    await click(q('nook-looks-off-p3'));
    await flush();
    expect(nookAPI.looksOff).toHaveBeenCalledWith('p3', false);
  });

  test('the progress line is one line of words, with a hairline divider before the plants', async () => {
    await mount();
    expect(q('nook-summary').textContent).toContain('Next in your nook: the shelf.');
    expect(q('nook-summary').className).toContain('border-b-hairline');
  });

  test('the quiet lesson link is a real link with a 44px target', async () => {
    nookAPI.state.mockResolvedValue({ data: STATE({ quiet: true }) });
    await mount();
    const link = q('nook-quiet-lesson');
    expect(link.tagName).toBe('A');
    expect(link.getAttribute('href')).toBe('/lessons/plant-er');
    expect(link.className).toContain('min-h-touch');
  });

  test('a failed load shows the shared load error with Try again, and no paper page', async () => {
    nookAPI.state.mockRejectedValue(new Error('network'));
    await mount();
    expect(q('load-error')).not.toBeNull();
    expect(q('load-retry').textContent).toBe('Try again');
    expect(q('nook-pip')).toBeNull();
  });

  test('the off state is a paper card on the normal dark page', async () => {
    nookAPI.state.mockResolvedValue({ data: STATE({ enabled: false }) });
    await mount();
    expect(q('nook-off').className).toContain('bg-grove-paperDeep');
    expect(q('nook-pip')).toBeNull();
    expect(q('nook-turn-on').className).toContain('min-h-touch');
  });
});
