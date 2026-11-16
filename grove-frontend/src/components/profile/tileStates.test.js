import tileStates from './tileStates';
import { LESSON_META } from '../../lessons/lessonMeta';

const LESSON_IDS = Object.keys(LESSON_META);
const base = { pipOn: true, peeksPref: true, notifPrefs: null, zipZone: false };
const states = (user, opts = {}) => tileStates(user, { ...base, ...opts });

beforeEach(() => { localStorage.clear(); });

describe('lessons', () => {
  test('counts lesson:<id> entries for known lessons only', () => {
    const user = { tutorials_seen: [`lesson:${LESSON_IDS[0]}`, `lesson:${LESSON_IDS[1]}`, 'lesson:not-a-lesson', 'today', LESSON_IDS[2]] };
    expect(states(user).lessons).toBe(`2 of ${LESSON_IDS.length} done`);
  });
  test('none done when nothing is seen', () => {
    expect(states({}).lessons).toBe(`0 of ${LESSON_IDS.length} done`);
  });
});

describe('tutorials', () => {
  test('tooltips on unless turned off', () => {
    expect(states({}).tutorials).toBe('Tooltips on');
    expect(states({ tooltips_enabled: true }).tutorials).toBe('Tooltips on');
  });
  test('tooltips off', () => {
    expect(states({ tooltips_enabled: false }).tutorials).toBe('Tooltips off');
  });
});

describe('careStyle', () => {
  test('simple tips', () => {
    expect(states({}).careStyle).toBe('Simple tips');
  });
  test('detailed tips', () => {
    expect(states({ care_text_detail: 'detailed' }).careStyle).toBe('Detailed tips');
  });
  test('adds the daily tip when it is on', () => {
    expect(states({ show_daily_trivia: true }).careStyle).toBe('Simple tips · Daily tip on');
  });
});

describe('home', () => {
  test('pets at home and northern', () => {
    expect(states({ has_pets: true, hemisphere: 'north' }).home).toBe('Pets at home · Northern');
  });
  test('no pets and southern', () => {
    expect(states({ has_pets: false, hemisphere: 'south' }).home).toBe('No pets · Southern');
  });
  test('neither set', () => {
    expect(states({}).home).toBe('Pets not set · Hemisphere not set');
  });
  test('zone shows only when the flag is on and a zone is set', () => {
    const user = { has_pets: false, hemisphere: 'north', hardiness_zone: '7b' };
    expect(states(user).home).toBe('No pets · Northern');
    expect(states(user, { zipZone: true }).home).toBe('No pets · Northern · Zone 7b');
    expect(states({ has_pets: false, hemisphere: 'north' }, { zipZone: true }).home).toBe('No pets · Northern');
  });
});

describe('pip', () => {
  test('off', () => {
    expect(states({}, { pipOn: false, peeksPref: false }).pip).toBe('Off');
  });
  test('on with peeks', () => {
    expect(states({}, { pipOn: true, peeksPref: true }).pip).toBe('On · peeks in');
  });
  test('on without peeks', () => {
    expect(states({}, { pipOn: true, peeksPref: false }).pip).toBe('On · no peeks');
  });
});

describe('notifications', () => {
  test('daily care check on', () => {
    expect(states({}, { notifPrefs: { push_care_due: true } }).notifications).toBe('Daily care check on');
  });
  test('daily care check off', () => {
    expect(states({}, { notifPrefs: { push_care_due: false } }).notifications).toBe('Daily care check off');
  });
  test('loading or failed falls back to a plain description', () => {
    expect(states({}, { notifPrefs: null }).notifications).toBe('Reminders and quiet hours');
    expect(states({}, { notifPrefs: undefined }).notifications).toBe('Reminders and quiet hours');
  });
});

test('works with no user at all', () => {
  const s = tileStates(null, { pipOn: false, peeksPref: false });
  expect(s.home).toBe('Pets not set · Hemisphere not set');
  expect(s.notifications).toBe('Reminders and quiet hours');
});
