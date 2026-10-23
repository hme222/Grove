import { SYMPTOMS, SAFETY_NOTE } from './plantHelp';
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
  test('has a pet and child safety note', () => {
    expect(SAFETY_NOTE).toMatch(/pet|child/i);
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
});
