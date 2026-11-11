// Stateful stand-in for the Grove backend, with no browser or Node dependencies, so the same data drives
// both the Playwright capture and the in-browser demo. Every response mirrors the shapes the real server returns
// (grove-backend/server.py, soil_check.py, nook_service.py).

import SPECIES from '../fixtures/species.json' with { type: 'json' };

const COACHING = {
  'dry:water': 'Dry soil is ready for a drink. Water slowly until it runs from the drainage hole.',
  'dry:wait': 'Dry soil is ready for a drink. Water slowly until it runs from the drainage hole.',
  'dry:': 'Dry soil is ready for a drink. Water slowly until it runs from the drainage hole.',
  'damp:wait': 'Damp soil means your plant is still drinking, so waiting is a good call. Check again in a few days.',
  'damp:water': 'Damp already? This is a good spot to wait. Check again in a few days.',
  'damp:': 'Damp soil means your plant is still drinking. Check again in a few days.',
};

// SPECIES is the real curated list exported from grove-backend/curated_species.py (scripts: see README), ids prefixed 'sp_'.

export function createCore({ now = () => '2026-11-03T10:00:00-05:00', today = () => '2026-11-03' } = {}) {
  const state = {
    token: null,
    user: null,
    plants: [],
    progress: {},
    completed: [],
    careLogs: 0,
    careLogList: [],
    unmocked: [],
  };

  const baseUser = () => ({
    id: 'u_maya', username: 'maya', email: 'maya@example.com', display_name: 'Maya',
    created_at: now(), tier: 'preview', onboarding_complete: false,
    tutorials_seen: ['care', 'collection', 'greenhouse', 'lighting'],
    first_session_banner_dismissed: true, tooltips_enabled: false, has_pets: false, show_daily_trivia: false,
    first_care_celebrated: false, nook_enabled: false,
  });

  const queueBody = () => ({
    primary_track: state.user?.primary_track || 'rebirth',
    queue: ['soil-finger-test', 'plant-parent-reset'].filter((id) => !state.completed.includes(id)),
    completed: state.completed,
    library: [],
    up_next: null,
    progress: state.progress,
    has_plant: state.plants.length > 0,
  });

  const nookState = () => {
    const p = state.plants[0];
    return {
      enabled: true, level: 1, level_name: 'Bare', next_unlock: 'the shelf',
      unlocked: ['window', 'table', 'sill', 'floor'], grew: false, level_up: false, quiet: false,
      pip: { form: 'seed', location: 'sill' },
      hero: p ? { id: p.id, name: p.nickname || p.common_name, group: 'generic', condition: 'fine', looks_off: false, photo_url: null } : null,
      shelf_plants: [],
      plants: p ? [{ id: p.id, name: p.nickname || p.common_name, group: 'generic', condition: 'fine', looks_off: false, photo_url: null }] : [],
      readiness: null, window: null,
    };
  };

  // [method, path-regex, handler(body, match, url)] -> JSON-able
  const routes = [
    ['GET', /^\/auth\/config$/, () => ({ email_verification: false, sso: {} })],
    ['POST', /^\/auth\/register$/, () => {
      state.user = baseUser();
      state.token = 'wt-access';
      return { access_token: 'wt-access', refresh_token: 'wt-refresh', user: state.user };
    }],
    ['GET', /^\/users\/me$/, () => state.user],
    ['POST', /^\/users\/me$/, (b) => { Object.assign(state.user, b); return state.user; }],
    ['PATCH', /^\/users\/me$/, (b) => { Object.assign(state.user, b); return state.user; }],
    ['POST', /^\/users\/me\/quiz$/, (b) => {
      state.user.primary_track = 'rebirth';
      return { primary_track: 'rebirth', queue: ['soil-finger-test', 'plant-parent-reset'], matched: [], plan_answers: b.plan_answers || {} };
    }],
    ['GET', /^\/lessons\/queue$/, () => queueBody()],
    ['POST', /^\/lessons\/([\w-]+)\/progress$/, (b, m) => { state.progress[m[1]] = b.card; return { ok: true }; }],
    ['POST', /^\/lessons\/([\w-]+)\/complete$/, (b, m) => { state.completed.push(m[1]); delete state.progress[m[1]]; return { ok: true }; }],
    // Demo only: the real app reads the photo with a vision model. This returns one fixed, library-backed answer
    // whatever photo is chosen; the demo says so on the result screen.
    ['POST', /^\/plants\/identify$/, () => {
      const sp = SPECIES.find((s) => s.slug === 'monstera-deliciosa');
      return {
        identified: true, isConfident: true, commonName: sp.common_name, latinName: sp.latin_name, confidence: 0.92,
        nicknameSuggestion: '', wateringFrequencyDays: sp.default_watering_days, wateringReason: 'Let the top inch of soil dry between waterings.',
        healthScore: 88, healthSummary: 'The leaves look glossy and green.', healthFlags: [], growMedium: 'soil',
        toxicity: sp.toxicity,
        libraryMatch: { speciesId: sp.id || null, commonName: sp.common_name, latinName: sp.latin_name, family: sp.family, source: (sp.citations || [])[0]?.label || null },
      };
    }],
    ['GET', /^\/species\/search$/, (b, m, url) => {
      const q = (url.searchParams.get('q') || '').toLowerCase();
      return SPECIES.filter((s) => !q || [s.common_name, s.latin_name, ...(s.synonyms || [])].some((n) => n.toLowerCase().includes(q))).slice(0, 12);
    }],
    ['POST', /^\/plants$/, (b) => {
      // Demo only: a new plant arrives a month into its story, with three sample photos and a note, so the Journal and
      // Photos tab show what a plant's story looks like. The demo labels these as samples; the first care log still counts
      // as the first care (last_watered_at stays empty).
      const DAY = 86400000;
      const ago = (days) => new Date(Date.now() - days * DAY).toISOString();
      const origin = typeof location !== 'undefined' ? location.origin : '';
      const sample = (n, file, days, caption) => ({ id: `ph_sample_${n}`, path: `${origin}/photos/${file}`, caption, taken_at: ago(days), is_cover: n === 1, sample: true });
      const id = `pl_${state.plants.length + 1}`;
      const photos = [
        sample(1, 'plant-2.jpg', 28, 'Brought it home today'),
        sample(2, 'window-1.jpg', 14, 'Found it a spot by the window'),
        sample(3, 'plant-1.jpg', 3, 'Looking happier'),
      ];
      const plant = { id, ...b, status: 'healthy', created_at: ago(28), last_watered_at: null, next_water_due: null, photo_url: photos[0].path, photos };
      state.plants.push(plant);
      state.careLogList.push({ id: `cl_${state.careLogList.length + 1}`, plant_id: id, action: 'note', notes: 'Moved it next to the east window.', logged_at: ago(14), created_at: ago(14) });
      return plant;
    }],
    // Demo only: an added photo is a made-up in-tab address (see demo/browser-entry.js). Nothing is stored beyond this page.
    ['POST', /^\/plants\/([\w-]+)\/photo$/, (b, m) => {
      const plant = state.plants.find((p) => p.id === m[1]);
      if (!plant) return { __status: 404 };
      plant.photo_url = b.path;
      return { photo_url: b.path };
    }],
    ['POST', /^\/plants\/([\w-]+)\/photos$/, (b, m) => {
      const plant = state.plants.find((p) => p.id === m[1]);
      if (!plant) return { __status: 404 };
      plant.photos = plant.photos || [];
      const photo = { id: `ph_${plant.photos.length + 1}`, path: b.path, caption: '', taken_at: now(), is_cover: plant.photos.length === 0 };
      plant.photos.push(photo);
      if (!plant.photo_url) plant.photo_url = b.path;
      return photo;
    }],
    ['GET', /^\/plants\/([\w-]+)\/photos$/, (b, m) => {
      const plant = state.plants.find((p) => p.id === m[1]);
      const photos = (plant && plant.photos) || [];
      return { photos, count: photos.length, cap: 10 };
    }],
    ['GET', /^\/plants\/([\w-]+)$/, (b, m) => state.plants.find((p) => p.id === m[1]) || { __status: 404 }],
    ['GET', /^\/plants\/([\w-]+)\/timeline$/, (b, m) => state.careLogList.filter((l) => l.plant_id === m[1]).slice().reverse()],
    ['GET', /^\/plants\/([\w-]+)\/biography$/, () => ({ biography: null, cached: false })],
    ['GET', /^\/rooms$/, () => []],
    ['GET', /^\/users\/me\/wants$/, () => ({ wants: [] })],
    ['GET', /^\/plants$/, () => ({ plants: state.plants, total: state.plants.length, page: 1, limit: 50 })],
    ['GET', /^\/bouquets$/, () => []],
    ['POST', /^\/plants\/([\w-]+)\/care-logs$/, (b, m) => {
      state.careLogs += 1;
      const first = !state.user.first_care_celebrated;
      const key = `${b.soil_outcome || ''}:${b.soil_decision || ''}`;
      for (const action of b.actions || []) {
        state.careLogList.push({ id: `cl_${state.careLogList.length + 1}`, plant_id: m[1], action, notes: b.notes || '', soil_outcome: b.soil_outcome || null, soil_decision: b.soil_decision || null, logged_at: now(), created_at: now() });
      }
      return {
        id: `cl_${state.careLogs}`, plant_id: m[1], action: (b.actions || [])[0], notes: b.notes || '', logged_at: now(),
        _meta: { first_care_pending: first, mission_just_completed: false, mission: null, actions: b.actions || [], group_id: null, logs: [], soil_coaching: COACHING[key] || '' },
      };
    }],
    ['POST', /^\/users\/me\/celebrate-first-care$/, () => ({ already: false })],
    ['POST', /^\/users\/me\/nook$/, (b) => {
      Object.assign(state.user, { nook_enabled: !!b.enabled, nook_offered_at: now(), nook_hero_plant_id: null });
      return { nook_enabled: !!b.enabled, nook_offered_at: now(), nook_hero_plant_id: null };
    }],
    ['GET', /^\/nook\/state$/, () => nookState()],
    ['POST', /^\/nook\/seen$/, () => ({ ok: true })],
    ['GET', /^\/care-logs\/due-today$/, () => []],
    ['GET', /^\/notifications\/schedule-reviews$/, () => ({ plants: [] })],
    // Demo only: a made-up sample so the suggestion card can be seen. Real suggestions come from the person's own soil checks.
    ['GET', /^\/plants\/([\w-]+)\/schedule-suggestion$/, (b, m) => {
      const plant = state.plants.find((p) => p.id === m[1]);
      if (!plant || plant.suggestion_dismissed) return { suggestion: null };
      const current = plant.watering_frequency_days || 7;
      if (current !== 7) return { suggestion: null };
      return { suggestion: { days: 9, current_days: 7, basis: 'soil', reason: 'Your last two soil checks found the soil still damp when watering was due.' } };
    }],
    ['POST', /^\/plants\/([\w-]+)\/schedule-suggestion\/dismiss$/, (b, m) => {
      const plant = state.plants.find((p) => p.id === m[1]);
      if (plant) plant.suggestion_dismissed = true;
      return { dismissed: true };
    }],
    ['PATCH', /^\/plants\/([\w-]+)$/, (b, m) => {
      const plant = state.plants.find((p) => p.id === m[1]);
      if (!plant) return { __status: 404 };
      Object.assign(plant, b);
      if (b.watering_frequency_days) plant.watering_frequency_source = 'user';
      return plant;
    }],
    ['GET', /^\/notifications\/unread-count$/, () => ({ unread_count: 0 })],
    ['GET', /^\/users\/me\/goals$/, () => ({ items: [] })],
    ['GET', /^\/users\/me\/notification-preferences$/, () => ({ push_care_due: false })],
    ['GET', /^\/missions\/daily$/, () => ({ __status: 404 })],
    // Quiet, honest screens for places a reviewer may wander. Numbers follow what Maya has actually done.
    ['GET', /^\/stats\/me$/, () => ({
      plants_needing_water: 0, plants_on_schedule: state.plants.length, total_plants: state.plants.length, active_plants: state.plants.length,
      past_plants_count: 0, total_care_logs: state.careLogs, estimated_care_hours: 0, propagation_count: 0, thriving_rate: 0,
      swap_count: 0, bouquet_count: 0, check_ins: { this_week: state.careLogs ? 1 : 0, weekly_goal: 3 }, show_advanced_analytics: false, tier: 'preview',
    })],
    ['GET', /^\/stats\/me\/care-hours$/, () => (state.careLogs ? { soil_check: { count: state.careLogs, estimated_minutes: state.careLogs }, total_hours: 0 } : { total_hours: 0 })],
    ['GET', /^\/users\/me\/badges$/, () => []],
    ['GET', /^\/notifications$/, () => ({ notifications: [], unread_count: 0 })],
    ['GET', /^\/encyclopedia\/species$/, (b, m, url) => {
      const q = (url.searchParams.get('q') || '').toLowerCase();
      const page = Number(url.searchParams.get('page')) || 1;
      const limit = Number(url.searchParams.get('limit')) || 20;
      const hits = SPECIES.filter((s) => !q || [s.common_name, s.latin_name, ...(s.synonyms || [])].some((n) => n.toLowerCase().includes(q)));
      return { species: hits.slice((page - 1) * limit, page * limit), total: hits.length, page, limit };
    }],
    ['GET', /^\/encyclopedia\/species\/([\w-]+)$/, (b, m) => SPECIES.find((s) => s.id === m[1] || s.slug === m[1]) || { __status: 404 }],
    ['GET', /^\/encyclopedia\/species\/([\w-]+)\/(performance|narrative)$/, () => ({ __status: 404 })],
    ['GET', /^\/trivia\/today$/, () => ({ date: today(), card: null, dismissed: false })],
  ];

  // Returns { status, body } for a handled request, or null when the demo has nothing for it.
  function handle(method, path, body, query) {
    for (const [m, re, fn] of routes) {
      if (m !== method) continue;
      const match = re.exec(path);
      if (!match) continue;
      const out = fn(body || {}, match, { searchParams: query || new URLSearchParams() });
      if (out && out.__status) return { status: out.__status, body: {} };
      return { status: 200, body: out };
    }
    state.unmocked.push(`${method} ${path}`);
    return null;
  }

  return { handle, state };
}
