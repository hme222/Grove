import { MEDIUMS } from './growMedia';

describe('grow medium descriptions', () => {
  test('every medium says in plain words what it is', () => {
    MEDIUMS.forEach((m) => {
      expect(typeof m.hint).toBe('string');
      expect(m.hint.length).toBeGreaterThan(15);
    });
  });
  test('water and propagation jar are told apart: one is a permanent home, the other a cutting growing roots', () => {
    const hint = (v) => MEDIUMS.find((m) => m.value === v).hint;
    expect(hint('water')).toMatch(/lives in water/);
    expect(hint('water')).toMatch(/for good/);
    expect(hint('propagation_jar')).toMatch(/cutting/);
    expect(hint('propagation_jar')).toMatch(/before it moves/);
    expect(hint('water')).not.toBe(hint('propagation_jar'));
  });
  test('the hints are definitions, not care instructions', () => {
    MEDIUMS.forEach((m) => expect(m.hint).not.toMatch(/\b(should|must|water (it|every)|once a|every \d)/i));
  });
});
