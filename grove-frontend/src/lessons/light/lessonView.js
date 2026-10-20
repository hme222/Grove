// A bare nook room for teaching: no Pip, a plant on the table, lit by `window`.
export const lessonView = (window) => ({
  unlocked: ['window', 'table', 'sill', 'floor'],
  pip: null,
  hero: { group: 'pothos', condition: 'fine' },
  readiness: null,
  shelfPlants: [],
  window,
});
