import { SYMPTOMS, SAFETY_NOTE, SOIL_CHECK } from './plantHelp';
import { matchPlants, matchLessons } from './search';

describe('plantHelp', () => {
  test('every symptom has an id, a label and at least one cause', () => {
    const ids = new Set();
    for (const s of SYMPTOMS) {
      expect(s.id && s.label).toBeTruthy();
      expect(ids.has(s.id)).toBe(false);
      ids.add(s.id);
      expect(s.causes.length).toBeGreaterThan(0);
    }
  });
  test('every cause says what to check and what to try', () => {
    for (const s of SYMPTOMS) for (const c of s.causes) {
      expect(c.title && c.check && c.fix).toBeTruthy();
    }
  });
  test('moisture-dependent symptoms start with the soil check, before any cause', () => {
    for (const id of ['yellow-leaves', 'drooping', 'brown-tips', 'dropping-leaves']) {
      expect(SYMPTOMS.find((s) => s.id === id).soilCheck).toBe(true);
    }
    expect(SOIL_CHECK.dry).toMatch(/water/i);
    expect(SOIL_CHECK.wet).toMatch(/do not water/i);
  });
  test('has a pet and child safety note', () => {
    expect(SAFETY_NOTE).toMatch(/pet|child/i);
  });
  test('the safety note says when to call emergency services and keeps the ASPCA line', () => {
    expect(SAFETY_NOTE).toMatch(/collapses, has a seizure, has trouble breathing or cannot be woken, call 911/);
    expect(SAFETY_NOTE).toContain('US poison help line 1-800-222-1222, or poison.org online');
    expect(SAFETY_NOTE).toContain('Outside the US, ask your local vet or poison center.');
    expect(SAFETY_NOTE).toContain('(888) 426-4435');
    expect(SAFETY_NOTE).toMatch(/a fee may apply/);
  });
  test('sun scorch is a cause, succulents get their own soil line, and bug treatments keep pets away', () => {
    const scorch = SYMPTOMS.flatMap((s) => s.causes).find((c) => c.title === 'Sun scorch');
    expect(scorch.check).toMatch(/tan or bleached/i);
    expect(scorch.fix).toMatch(/back from the glass/i);
    expect(SOIL_CHECK.dry).toMatch(/Succulents and cacti: wait until the whole pot is dry\./);
    const bugs = SYMPTOMS.find((s) => s.id === 'bugs');
    expect(bugs.causes.filter((c) => /away from pets while the (soap|alcohol) dries/.test(c.fix))).toHaveLength(2);
  });
});

describe('search', () => {
  const plants = [
    { id: '1', nickname: 'Rudy', common_name: 'Rubber plant', latin_name: 'Ficus elastica', room: 'living room' },
    { id: '2', nickname: '', common_name: 'Peace Lily', latin_name: 'Spathiphyllum', room: 'bedroom' },
  ];
  test('matches nickname, common name, latin name and room, ignoring case', () => {
    expect(matchPlants(plants, 'rudy').map((p) => p.id)).toEqual(['1']);
    expect(matchPlants(plants, 'LILY').map((p) => p.id)).toEqual(['2']);
    expect(matchPlants(plants, 'ficus').map((p) => p.id)).toEqual(['1']);
    expect(matchPlants(plants, 'bedroom').map((p) => p.id)).toEqual(['2']);
  });
  test('returns nothing for an empty query', () => {
    expect(matchPlants(plants, '  ')).toEqual([]);
    expect(matchLessons({ a: { title: 'Soil', blurb: '' } }, '')).toEqual([]);
  });
  test('matches lessons by title or blurb', () => {
    const meta = { a: { id: 'a', title: 'Soil Finger-Test', blurb: 'Check with your finger.' }, b: { id: 'b', title: 'Window Blueprint', blurb: 'Match light.' } };
    expect(matchLessons(meta, 'soil').map((l) => l.id)).toEqual(['a']);
    expect(matchLessons(meta, 'light').map((l) => l.id)).toEqual(['b']);
  });

  test('pest treatments say to test on one leaf first, and winter rest has its own line', () => {
    const bugs = SYMPTOMS.find((s) => s.id === 'bugs');
    expect(bugs.causes.filter((c) => /test on one leaf first/.test(c.fix)).length).toBeGreaterThanOrEqual(2);
    const winter = SYMPTOMS.flatMap((s) => s.causes).filter((c) => c.title === 'Resting for winter');
    expect(winter.length).toBeGreaterThanOrEqual(1);
  });
});
