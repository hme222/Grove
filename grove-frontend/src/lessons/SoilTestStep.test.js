import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import SoilTestStep from './SoilTestStep';
import MarkDoneStep from './MarkDoneStep';
import { plantAPI, careAPI } from '../lib/api';

jest.mock('../lib/api', () => ({
  plantAPI: { getAll: jest.fn() },
  careAPI: { createLog: jest.fn() },
}));

// Jest here cannot load react-router-dom v7, so it is mocked as a virtual module.
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({ useNavigate: () => mockNavigate }), { virtual: true });

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const PLANTS = [
  { id: 'p1', nickname: 'Monty', common_name: 'Monstera' },
  { id: 'p2', common_name: 'Pothos' },
];

let container;
let root;

const q = (id) => container.querySelector(`[data-testid="${id}"]`);
const click = (el) => act(() => el.dispatchEvent(new MouseEvent('click', { bubbles: true })));
const flush = () => act(async () => {});

const mount = async (ui) => {
  await act(async () => {
    root.render(ui);
  });
};

beforeEach(() => {
  jest.clearAllMocks();
  plantAPI.getAll.mockResolvedValue({ data: { plants: PLANTS } });
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

describe('SoilTestStep without a plant', () => {
  test('says to save the lesson for the first plant and does nothing else', async () => {
    await mount(<SoilTestStep hasPlant={false} onLogged={() => {}} />);
    expect(q('soil-step-no-plant').textContent).toContain('Save this for your first plant');
    expect(q('soil-step-add-plant')).not.toBeNull();
    expect(q('soil-step-submit')).toBeNull();
    expect(plantAPI.getAll).not.toHaveBeenCalled();
    expect(careAPI.createLog).not.toHaveBeenCalled();
  });

  test('its two buttons go to the add plant page and back to the lessons list', async () => {
    await mount(<SoilTestStep hasPlant={false} onLogged={() => {}} />);
    await click(q('soil-step-add-plant'));
    expect(mockNavigate).toHaveBeenLastCalledWith('/add-plant');
    const back = Array.from(container.querySelectorAll('button')).find((b) => b.textContent === 'Back to lessons');
    await click(back);
    expect(mockNavigate).toHaveBeenLastCalledWith('/lessons');
  });
});

describe('SoilTestStep with plants', () => {
  test('offers a plant picker only when there is more than one plant, labelled like Care Today', async () => {
    await mount(<SoilTestStep hasPlant onLogged={() => {}} />);
    const options = Array.from(q('soil-step-plant').querySelectorAll('option')).map((o) => o.textContent);
    expect(options).toEqual(['Monty', 'Pothos']);
  });

  test('with one plant there is no picker', async () => {
    plantAPI.getAll.mockResolvedValue({ data: { plants: [PLANTS[1]] } });
    await mount(<SoilTestStep hasPlant onLogged={() => {}} />);
    expect(q('soil-step-plant')).toBeNull();
  });

  test('submitting with no outcome shows a plain error and sends nothing', async () => {
    await mount(<SoilTestStep hasPlant onLogged={() => {}} />);
    await click(q('soil-step-submit'));
    expect(q('soil-step-error').textContent).toBe('Choose what you felt: dry or damp.');
    expect(careAPI.createLog).not.toHaveBeenCalled();
  });

  test('logs damp and wait for the first plant, then shows coaching and finishes', async () => {
    careAPI.createLog.mockResolvedValue({ data: { _meta: { soil_coaching: 'Waiting is a good call.', first_care_pending: true } } });
    const onLogged = jest.fn();
    await mount(<SoilTestStep hasPlant onLogged={onLogged} />);
    await click(q('soil-outcome-damp'));
    await click(q('soil-decision-wait'));
    await click(q('soil-step-submit'));
    await flush();
    expect(careAPI.createLog).toHaveBeenCalledWith('p1', {
      actions: ['soil_check'],
      soil_outcome: 'damp',
      soil_decision: 'wait',
      notes: '',
    });
    expect(q('soil-step-saved').textContent).toContain('Waiting is a good call.');
    await click(q('soil-step-continue'));
    expect(onLogged).toHaveBeenCalledWith({ soil_coaching: 'Waiting is a good call.', first_care_pending: true });
  });

  test('the decision is optional and is sent as null', async () => {
    careAPI.createLog.mockResolvedValue({ data: { _meta: {} } });
    await mount(<SoilTestStep hasPlant onLogged={() => {}} />);
    await click(q('soil-outcome-dry'));
    await click(q('soil-step-submit'));
    await flush();
    expect(careAPI.createLog.mock.calls[0][1].soil_decision).toBeNull();
  });

  test('tapping the chosen decision again clears it', async () => {
    careAPI.createLog.mockResolvedValue({ data: { _meta: {} } });
    await mount(<SoilTestStep hasPlant onLogged={() => {}} />);
    await click(q('soil-outcome-dry'));
    await click(q('soil-decision-water'));
    await click(q('soil-decision-water'));
    await click(q('soil-step-submit'));
    await flush();
    expect(careAPI.createLog.mock.calls[0][1].soil_decision).toBeNull();
  });

  test('uses the plant picked in the list', async () => {
    careAPI.createLog.mockResolvedValue({ data: { _meta: {} } });
    await mount(<SoilTestStep hasPlant onLogged={() => {}} />);
    const select = q('soil-step-plant');
    await act(async () => {
      const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set;
      setter.call(select, 'p2');
      select.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await click(q('soil-outcome-dry'));
    await click(q('soil-step-submit'));
    await flush();
    expect(careAPI.createLog.mock.calls[0][0]).toBe('p2');
  });

  test('chosen note chips are saved together as the note', async () => {
    careAPI.createLog.mockResolvedValue({ data: { _meta: {} } });
    await mount(<SoilTestStep hasPlant onLogged={() => {}} />);
    const chips = Array.from(container.querySelectorAll('fieldset button')).filter((b) => ['Looked fine', 'New growth'].includes(b.textContent));
    chips.forEach((chip) => click(chip));
    await click(q('soil-outcome-damp'));
    await click(q('soil-step-submit'));
    await flush();
    expect(careAPI.createLog.mock.calls[0][1].notes).toBe('Looked fine, New growth');
  });

  test('a failed save shows an error and keeps the form', async () => {
    careAPI.createLog.mockRejectedValue(new Error('network'));
    await mount(<SoilTestStep hasPlant onLogged={() => {}} />);
    await click(q('soil-outcome-dry'));
    await click(q('soil-step-submit'));
    await flush();
    expect(q('soil-step-error').textContent).toBe('Could not save your soil test. Try again.');
    expect(q('soil-step')).not.toBeNull();
    expect(q('soil-step-saved')).toBeNull();
  });

  test('a failed plant load shows an error', async () => {
    plantAPI.getAll.mockRejectedValue(new Error('network'));
    await mount(<SoilTestStep hasPlant onLogged={() => {}} />);
    expect(q('soil-step-error').textContent).toBe('Could not load your plants. Try again.');
  });

  test('submitting before any plant has loaded asks the user to pick a plant', async () => {
    plantAPI.getAll.mockResolvedValue({ data: { plants: [] } });
    await mount(<SoilTestStep hasPlant onLogged={() => {}} />);
    await click(q('soil-outcome-dry'));
    await click(q('soil-step-submit'));
    expect(q('soil-step-error').textContent).toBe('Pick the plant you tested.');
    expect(careAPI.createLog).not.toHaveBeenCalled();
  });
});

describe('MarkDoneStep', () => {
  test('buttons call their handlers', async () => {
    const onDone = jest.fn();
    const onNotYet = jest.fn();
    await mount(<MarkDoneStep onDone={onDone} onNotYet={onNotYet} />);
    await click(q('mark-done-done'));
    await click(q('mark-done-not-yet'));
    expect(onDone).toHaveBeenCalledTimes(1);
    expect(onNotYet).toHaveBeenCalledTimes(1);
  });
});
