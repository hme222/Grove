import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import ReadinessPanel from './ReadinessPanel';
import { speciesAPI } from '../lib/api';

jest.mock('../lib/api', () => ({ speciesAPI: { search: jest.fn() } }));

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({ useNavigate: () => mockNavigate }), { virtual: true });

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const READY = (over = {}) => ({
  species_id: 's1',
  species_name: 'Snake Plant',
  watering_days: 14,
  group: 'snake',
  state: 'seed',
  steps: [
    { id: 'light-spot', done: false },
    { id: 'drainage', done: false },
    { id: 'soil-mix', done: false },
  ],
  ...over,
});

let container;
let root;

const q = (id) => container.querySelector(`[data-testid="${id}"]`);
const click = (el) => act(() => el.dispatchEvent(new MouseEvent('click', { bubbles: true })));
const flush = () => act(async () => {});
const type = (input, value) =>
  act(async () => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    setter.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
const submit = () => act(async () => q('readiness-search-button').closest('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));

const mount = async (props = {}) => {
  const handlers = { onStart: jest.fn(), onStep: jest.fn() };
  await act(async () => {
    root.render(<ReadinessPanel readiness={null} busy={false} {...handlers} {...props} />);
  });
  return handlers;
};

beforeEach(() => {
  jest.clearAllMocks();
  speciesAPI.search.mockResolvedValue({ data: [{ id: 's1', common_name: 'Snake Plant' }, { id: 's2', common_name: 'Pothos' }] });
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

describe('choosing a plant', () => {
  test('shows a search when no plant has been picked yet', async () => {
    await mount();
    expect(q('readiness-search')).not.toBeNull();
    expect(container.textContent).toContain('Getting ready for a plant?');
  });

  test('asks for at least two letters and does not search for less', async () => {
    await mount();
    await type(q('readiness-query'), 'a');
    await submit();
    expect(q('readiness-error').textContent).toBe('Type at least two letters.');
    expect(speciesAPI.search).not.toHaveBeenCalled();
  });

  test('searches and picks a plant', async () => {
    const { onStart } = await mount();
    await type(q('readiness-query'), ' snake ');
    await submit();
    await flush();
    expect(speciesAPI.search).toHaveBeenCalledWith('snake');
    await click(q('readiness-result-s1'));
    expect(onStart).toHaveBeenCalledWith('s1');
  });

  test('says when nothing matches', async () => {
    speciesAPI.search.mockResolvedValue({ data: [] });
    await mount();
    await type(q('readiness-query'), 'zzz');
    await submit();
    await flush();
    expect(container.textContent).toContain('No plants found.');
  });

  test('shows a plain error when the search fails', async () => {
    speciesAPI.search.mockRejectedValue(new Error('network'));
    await mount();
    await type(q('readiness-query'), 'snake');
    await submit();
    await flush();
    expect(q('readiness-error').textContent).toBe('Couldn’t search plants. Try again.');
  });

  test('shows at most eight results', async () => {
    speciesAPI.search.mockResolvedValue({ data: Array.from({ length: 12 }, (_, i) => ({ id: `s${i}`, common_name: `Plant ${i}` })) });
    await mount();
    await type(q('readiness-query'), 'plant');
    await submit();
    await flush();
    expect(container.querySelectorAll('[data-testid^="readiness-result-"]')).toHaveLength(8);
  });
});

describe('getting ready', () => {
  test('shows the plant, its state, and three steps, and says the plant never needs anything', async () => {
    await mount({ readiness: READY() });
    expect(container.textContent).toContain('Getting ready for a Snake Plant');
    expect(q('readiness-state').textContent).toContain('Seed');
    expect(q('readiness-state').textContent).toContain('never needs anything');
    expect(container.textContent).toContain('Find a light spot');
    expect(container.textContent).toContain('Check drainage');
    expect(container.textContent).toContain('Choose a soil mix');
  });

  test('a step is marked done with one tap, and done steps say so', async () => {
    const readiness = READY({
      state: 'sprouting',
      steps: [
        { id: 'light-spot', done: true },
        { id: 'drainage', done: false },
        { id: 'soil-mix', done: false },
      ],
    });
    const { onStep } = await mount({ readiness });
    expect(q('readiness-done-light-spot')).not.toBeNull();
    expect(q('readiness-step-light-spot')).toBeNull();
    await click(q('readiness-step-drainage'));
    expect(onStep).toHaveBeenCalledWith('drainage');
    expect(q('readiness-state').textContent).toContain('Sprouting');
  });

  test('when ready it shows the real schedule and offers to add a real plant', async () => {
    const readiness = READY({
      state: 'ready',
      steps: [
        { id: 'light-spot', done: true },
        { id: 'drainage', done: true },
        { id: 'soil-mix', done: true },
      ],
    });
    await mount({ readiness });
    expect(q('readiness-ready').textContent).toContain('A Snake Plant usually likes water about every 14 days.');
    expect(q('readiness-ready').textContent).toContain('Ready to meet a real one?');
    await click(q('readiness-add-plant'));
    expect(mockNavigate).toHaveBeenCalledWith('/add-plant');
  });

  test('the ready message is not shown before the plant is ready', async () => {
    await mount({ readiness: READY() });
    expect(q('readiness-ready')).toBeNull();
  });

  test('a different plant can be picked, and keeping the current one goes back', async () => {
    await mount({ readiness: READY() });
    await click(q('readiness-change'));
    expect(q('readiness-search')).not.toBeNull();
    const keep = Array.from(container.querySelectorAll('button')).find((b) => b.textContent === 'Keep Snake Plant');
    await click(keep);
    expect(q('readiness-panel')).not.toBeNull();
  });
});
