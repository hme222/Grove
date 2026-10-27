// Turns the nook state from the server into what drawRoom needs.
export function buildView(state, mood) {
  const shelf = state.shelf_plants.map((plant) => ({ condition: plant.condition }));
  // A readiness plant that has been replaced by a real plant stays on the shelf as a keepsake.
  const keepsake = state.hero && state.readiness ? [{ condition: 'fine' }] : [];
  return {
    unlocked: state.unlocked,
    pip: { form: state.pip.form, location: state.pip.location, mood },
    hero: state.hero ? { group: state.hero.group, condition: state.hero.condition } : null,
    readiness: !state.hero && state.readiness ? { state: state.readiness.state, group: state.readiness.group } : null,
    shelfPlants: [...shelf, ...keepsake],
    window: state.window || null,
  };
}
