import { LIGHT_LEVELS, fitSentence, roomSummary, lightHelp } from './roomLight';

describe('room light', () => {
  test('has the four levels the species guide uses, dark to bright', () => {
    expect(LIGHT_LEVELS.map((l) => l.id)).toEqual(['low', 'medium', 'bright_indirect', 'bright_direct']);
    LIGHT_LEVELS.forEach((l) => expect(lightHelp(l.id)).toBeTruthy());
  });

  test('says nothing about a plant that suits the room', () => {
    expect(fitSentence({ name: 'Rudy', need: 'bright_indirect', fit: 'good' })).toBe('');
  });

  test('explains a dim room, a very dim room and a too-bright room in plain words', () => {
    expect(fitSentence({ name: 'Rudy', need: 'bright_indirect', fit: 'dim' })).toMatch(/little dim for Rudy.*bright, indirect light/);
    expect(fitSentence({ name: 'Aloe', need: 'bright_direct', fit: 'too_dim' })).toMatch(/Aloe needs much more light/);
    expect(fitSentence({ name: 'Sandra', need: 'low', fit: 'too_bright' })).toMatch(/brighter than Sandra likes/);
  });

  test('asks for the light when the room has none set', () => {
    expect(roomSummary({ light: null, fits: [] }).tone).toBe('prompt');
  });

  test('reports that all plants suit the light, or lists the ones that do not', () => {
    const ok = roomSummary({ light: 'medium', fits: [{ name: 'A', fit: 'good' }, { name: 'B', fit: 'good' }] });
    expect(ok).toEqual({ tone: 'good', text: 'All 2 plants here suit this light.' });
    const bad = roomSummary({ light: 'low', fits: [{ name: 'A', need: 'bright_indirect', fit: 'too_dim' }, { name: 'B', fit: 'good' }] });
    expect(bad.tone).toBe('issues');
    expect(bad.issues).toHaveLength(1);
  });
});
