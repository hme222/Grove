import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API_BASE = `${BACKEND_URL}/api`;

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('grove_access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      const refreshToken = localStorage.getItem('grove_refresh_token');
      if (refreshToken) {
        try {
          const res = await axios.post(`${API_BASE}/auth/refresh`, { refresh_token: refreshToken });
          localStorage.setItem('grove_access_token', res.data.access_token);
          localStorage.setItem('grove_refresh_token', res.data.refresh_token);
          error.config.headers.Authorization = `Bearer ${res.data.access_token}`;
          return api(error.config);
        } catch (e) {
          localStorage.removeItem('grove_access_token');
          localStorage.removeItem('grove_refresh_token');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  testLogin: () => api.post('/auth/test-login'),
};

// Users
export const userAPI = {
  getMe: () => api.get('/users/me'),
  updateMe: (data) => api.patch('/users/me', data),
  getStats: () => api.get('/users/me/stats'),
  getBadges: () => api.get('/users/me/badges'),
  getUnlocks: () => api.get('/users/me/unlocks'),
  generatePersonality: () => api.post('/users/me/generate-personality'),
  // Phase 11
  celebrateFirstCare: () => api.post('/users/me/celebrate-first-care'),
  dismissFirstSessionBanner: () => api.post('/users/me/dismiss-first-session-banner'),
  // Phase 14A.2 — tooltips + tutorials
  dismissTooltip: (tooltip_id) => api.post('/users/me/tooltips/dismiss', { tooltip_id }),
  resetTooltips: () => api.post('/users/me/tooltips/reset'),
  markTutorialSeen: (tutorial_id) => api.post('/users/me/tutorials/seen', { tutorial_id }),
  replayTutorial: (tutorial_id) => api.post('/users/me/tutorials/reset', { tutorial_id }),
};

// Phase 14C.3.b — Badge catalog + display picker
export const badgeAPI = {
  catalog: () => api.get('/users/me/badges/catalog'),
  setDisplayed: (badge_slugs) => api.put('/users/me/badges/displayed', { badge_slugs }),
};

// Phase 14C.3.c — Grove chat (5s polling, no WebSockets)
export const groveChatAPI = {
  list: (groveId, params = {}) =>
    api.get(`/groves/${groveId}/messages`, { params }),
  send: (groveId, body) =>
    api.post(`/groves/${groveId}/messages`, body),
  edit: (groveId, messageId, body) =>
    api.patch(`/groves/${groveId}/messages/${messageId}`, { body }),
  remove: (groveId, messageId) =>
    api.delete(`/groves/${groveId}/messages/${messageId}`),
};

// Daily Missions (Phase 11)
export const missionAPI = {
  getDaily: () => api.get('/missions/daily'),
  completeDaily: () => api.post('/missions/daily/complete'),
  pingHealthCheck: () => api.post('/missions/health-check'),
};

// Plants
export const plantAPI = {
  getAll: (params) => api.get('/plants', { params }),
  create: (data) => api.post('/plants', data),
  getOne: (id) => api.get(`/plants/${id}`),
  update: (id, data) => api.patch(`/plants/${id}`, data),
  delete: (id) => api.delete(`/plants/${id}`),
  getAISchedule: (id) => api.post(`/plants/${id}/ai-schedule`),
  getTimeline: (id) => api.get(`/plants/${id}/timeline`),
  getBiography: (id) => api.get(`/plants/${id}/biography`),
  generateBiography: (id) => api.post(`/plants/${id}/generate-biography`),
  uploadPhoto: (id, formData) => api.post(`/plants/${id}/photo`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  // Phase 14A.2 — multi-photo gallery (cap 10 per plant)
  listPhotos: (id) => api.get(`/plants/${id}/photos`),
  addPhoto: (id, formData) => api.post(`/plants/${id}/photos`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  updatePhoto: (id, photoId, data) => api.patch(`/plants/${id}/photos/${photoId}`, data),
  deletePhoto: (id, photoId) => api.delete(`/plants/${id}/photos/${photoId}`),
  upload: (formData) => api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  validatePhoto: (path) => api.post('/plants/validate-photo', { path }),
  // Phase 13 — AI identification
  identify: (data) => api.post('/plants/identify', data),
  scanRoom: (data) => api.post('/plants/scan-room', data),
  batchCreate: (data) => api.post('/plants/batch', data),
};

// Care Logs
export const careAPI = {
  getLogs: (plantId) => api.get(`/plants/${plantId}/care-logs`),
  createLog: (plantId, data) => api.post(`/plants/${plantId}/care-logs`, data),
  bulkLog: (data) => api.post('/care-logs/bulk', data),
  getDueToday: () => api.get('/care-logs/due-today'),
};

// Water Round
export const waterAPI = {
  getRound: () => api.get('/plants/water-round'),
  logRound: () => api.post('/plants/water-round/log'),
};

// Species
export const speciesAPI = {
  search: (q) => api.get('/species/search', { params: { q } }),
};

// Rooms
export const roomAPI = {
  getRooms: () => api.get('/rooms'),
};

// Stats
export const statsAPI = {
  getStats: () => api.get('/stats/me'),
  getCareHours: () => api.get('/stats/me/care-hours'),
};

// Bouquets
export const bouquetAPI = {
  getAll: () => api.get('/bouquets'),
  getLimits: () => api.get('/bouquets/limits'),
  create: (data) => api.post('/bouquets', data),
  getOne: (id) => api.get(`/bouquets/${id}`),
  update: (id, data) => api.patch(`/bouquets/${id}`, data),
  identify: (id) => api.post(`/bouquets/${id}/identify`),
  identifyText: (id) => api.post(`/bouquets/${id}/identify-text`),
  getCarePlan: (id) => api.get(`/bouquets/${id}/care-plan`),
  createCareLog: (id, data) => api.post(`/bouquets/${id}/care-logs`, data),
  uploadPhoto: (id, formData) => api.post(`/bouquets/${id}/photo`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getPublic: (slug) => api.get(`/bouquets/public/${slug}`),
};

// Social Feed
export const feedAPI = {
  getFeed: (params) => api.get('/feed', { params }),
  createPost: (data) => api.post('/posts', data),
  getPost: (id) => api.get(`/posts/${id}`),
  deletePost: (id) => api.delete(`/posts/${id}`),
  addKudos: (id) => api.post(`/posts/${id}/kudos`),
  removeKudos: (id) => api.delete(`/posts/${id}/kudos`),
  getComments: (id) => api.get(`/posts/${id}/comments`),
  createComment: (id, data) => api.post(`/posts/${id}/comments`, data),
  // New reactions & wishlist (Phase 8C UX Fix 6)
  getReactions: (id) => api.get(`/posts/${id}/reactions`),
  addReaction: (id, type) => api.post(`/posts/${id}/reactions`, { type }),
  removeReaction: (id, type) => api.delete(`/posts/${id}/reactions/${type}`),
};

// Wishlist (from "cutting" reactions)
export const wishlistAPI = {
  getAll: () => api.get('/wishlist'),
  remove: (id) => api.delete(`/wishlist/${id}`),
};

// Groves
export const groveAPI = {
  getAll: () => api.get('/groves'),
  create: (data) => api.post('/groves', data),
  discover: () => api.get('/groves/discover'),
  getOne: (id) => api.get(`/groves/${id}`),
  join: (id) => api.post(`/groves/${id}/join`),
  leave: (id) => api.delete(`/groves/${id}/leave`),
  getMembers: (id) => api.get(`/groves/${id}/members`),
  getFeed: (id, params) => api.get(`/groves/${id}/feed`, { params }),
};

// Phase 14C.4 — Goal/Badge unification.
// "Goals" are now pinned locked badges; the user pins up to 5 from the
// catalog and progress surfaces on the Care/Today tab. The legacy /goals
// CRUD endpoints are no longer used.
export const goalAPI = {
  list: () => api.get('/users/me/goals'),
  pin: (slug) => api.post(`/users/me/goals/${slug}`),
  unpin: (slug) => api.delete(`/users/me/goals/${slug}`),
};

// Phase 14C.4 — Daily plant trivia (Supplement v1 Part D.7)
export const triviaAPI = {
  today: (tzOffsetMinutes) =>
    api.get('/trivia/today', { params: { tz_offset: tzOffsetMinutes } }),
  dismiss: (tzOffsetMinutes) =>
    api.post('/trivia/today/dismiss', null, { params: { tz_offset: tzOffsetMinutes } }),
};

// Challenges
export const challengeAPI = {
  getTemplates: () => api.get('/challenges'),
  start: (slug) => api.post(`/challenges/${slug}/start`),
};

// Notifications
export const notificationAPI = {
  getAll: (limit) => api.get('/notifications', { params: { limit } }),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
  remove: (id) => api.delete(`/notifications/${id}`),
  getPreferences: () => api.get('/users/me/notification-preferences'),
  updatePreferences: (data) => api.patch('/users/me/notification-preferences', data),
};

// Florist Pro
export const floristAPI = {
  getPortfolio: () => api.get('/florist/portfolio'),
  addItem: (data) => api.post('/florist/portfolio', data),
  deleteItem: (id) => api.delete(`/florist/portfolio/${id}`),
};

// Encyclopedia
export const encyclopediaAPI = {
  getSpecies: (params) => api.get('/encyclopedia/species', { params }),
  getSpeciesDetail: (id) => api.get(`/encyclopedia/species/${id}`),
  // Phase 14B.2 — community performance + AI narrative
  getPerformance: (id) => api.get(`/encyclopedia/species/${id}/performance`),
  getNarrative: (id) => api.get(`/encyclopedia/species/${id}/narrative`),
};

// Phase 14B.2 — Themed guilds
export const guildAPI = {
  list: () => api.get('/guilds'),
  get: (slug) => api.get(`/guilds/${slug}`),
};

// Admin/Demo
// Phase 14C — Hardiness zones + swaps API
export const zoneAPI = {
  lookup: (country, postcode) => api.get('/zones/lookup', { params: { country, postcode } }),
  catalog: () => api.get('/zones/catalog'),
};

export const swapsAPI = {
  eligibility: () => api.get('/swaps/eligibility'),
};

// Phase 14C.3.a — Verification pact flow
export const verificationAPI = {
  status: () => api.get('/users/me/verification'),
  start: () => api.post('/users/me/verification/start'),
  confirmEmail: () => api.post('/users/me/verification/confirm-email'),
  setPhone: ({ phone, skip }) => api.post('/users/me/verification/phone', { phone, skip }),
  agree: ({ acknowledgments, pact_version }) =>
    api.post('/users/me/verification/agree', { acknowledgments, pact_version }),
};

// Phase 14C — Want list
export const wantsAPI = {
  list: () => api.get('/users/me/wants'),
  add: (species_id, note, priority) => api.post('/users/me/wants', { species_id, note, priority }),
  remove: (species_id) => api.delete(`/users/me/wants/${species_id}`),
};

// Phase 14C — Notifications (1-month watering review nudge)
export const notificationsAPI = {
  scheduleReviews: () => api.get('/notifications/schedule-reviews'),
  acknowledgeReview: (plantId) => api.post(`/plants/${plantId}/schedule-review/acknowledge`),
};

export const adminGroveAPI = {
  verifyUser: (userId, body) => api.post(`/admin/users/${userId}/verify`, body),
  grantBadge: (userId, slug) => api.post(`/admin/users/${userId}/badges/${slug}/grant`),
  revokeBadge: (userId, slug) => api.delete(`/admin/users/${userId}/badges/${slug}`),
};

export const adminAPI = {
  getDemoStatus: () => api.get('/admin/demo/status'),
  resetAccount: (username) => api.post(`/admin/demo/reset/${username}`),
  setQuickState: (username, action) => api.post('/admin/demo/quick-state', null, { params: { username, action } }),
};

// File upload
export const uploadAPI = {
  upload: (formData) => api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};

// Helper to get file URL
export const getFileUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const token = localStorage.getItem('grove_access_token');
  return `${API_BASE}/files/${path}${token ? `?auth=${token}` : ''}`;
};

export default api;
