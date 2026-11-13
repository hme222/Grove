// When Pip peeks in, and what has already been dismissed. Pure functions over a small store, so they are easy to test.
// The store is the device's localStorage, with a memory fallback for private modes that throw.

const memory = new Map();
export const defaultStore = {
  get(key) {
    try {
      const v = window.localStorage.getItem(key);
      if (v !== null) return v;
    } catch { /* fall through to memory */ }
    return memory.has(key) ? memory.get(key) : null;
  },
  set(key, value) {
    memory.set(key, String(value));
    try { window.localStorage.setItem(key, String(value)); } catch { /* memory only */ }
  },
};

const DAY_MS = 86400000;
const K_DISMISSED = 'grove.pip.dismissed';
const K_COUNT = 'grove.pip.dismissCount';
const K_FIRST = 'grove.pip.firstPeekSeen';
const K_ASKED = 'grove.pip.askedToStop';

// Whole days a plant is past its watering date. 0 when it is not due yet or the date is missing.
export function overdueDays(plant, now = new Date()) {
  const due = Date.parse(plant && plant.next_water_due);
  if (Number.isNaN(due)) return 0;
  return Math.max(0, Math.floor((now.getTime() - due) / DAY_MS));
}

const dayKey = (now) => {
  const pad = (n) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
};

const readDismissed = (store) => {
  try { return JSON.parse(store.get(K_DISMISSED) || '{}') || {}; } catch { return {}; }
};

// The most overdue plant, at least one day over, that was not dismissed today. Null when there is none.
export function pickPeek(plants, now = new Date(), store = defaultStore) {
  const dismissed = readDismissed(store);
  const today = dayKey(now);
  const ranked = (Array.isArray(plants) ? plants : [])
    .map((p) => ({ p, days: overdueDays(p, now) }))
    .filter(({ p, days }) => p && days >= 1 && dismissed[p.id] !== today)
    .sort((a, b) => b.days - a.days);
  if (!ranked.length) return null;
  const { p, days } = ranked[0];
  return { plantId: p.id, name: p.nickname || p.common_name || 'Your plant', days };
}

export function dismissToday(plantId, now = new Date(), store = defaultStore) {
  store.set(K_DISMISSED, JSON.stringify({ ...readDismissed(store), [plantId]: dayKey(now) }));
}

export const dismissCount = (store = defaultStore) => Number(store.get(K_COUNT)) || 0;
export const bumpDismissCount = (store = defaultStore) => store.set(K_COUNT, dismissCount(store) + 1);
export const hasSeenFirstPeek = (store = defaultStore) => store.get(K_FIRST) === '1';
export const markFirstPeekSeen = (store = defaultStore) => store.set(K_FIRST, '1');
export const askedToStop = (store = defaultStore) => store.get(K_ASKED) === '1';
export const markAskedToStop = (store = defaultStore) => store.set(K_ASKED, '1');
