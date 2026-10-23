// Search across the user's own plants, the species guide, and the lessons.
const norm = (s) => String(s || '').toLowerCase().trim();

export function matchPlants(plants, query, limit = 8) {
  const q = norm(query);
  if (!q) return [];
  return (plants || [])
    .filter((p) => [p.nickname, p.common_name, p.latin_name, p.room].some((v) => norm(v).includes(q)))
    .slice(0, limit);
}

export function matchLessons(meta, query, limit = 5) {
  const q = norm(query);
  if (!q) return [];
  return Object.values(meta || {})
    .filter((l) => norm(l.title).includes(q) || norm(l.blurb).includes(q))
    .slice(0, limit);
}
