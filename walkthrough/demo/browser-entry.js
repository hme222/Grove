// Runs before the app. Replaces the network with the scripted Maya backend so the demo needs no server,
// resets to a fresh start on every load, and adds a small "Restart" control outside the app.
import { createCore } from '../scripts/mock-core.mjs';

const core = createCore({ now: () => new Date().toISOString(), today: () => new Date().toISOString().slice(0, 10) });

// Fresh start on every load: the one-time moments (quiz, first-care celebration, Meet Pip) replay each time.
try {
  Object.keys(localStorage).filter((k) => k.startsWith('grove')).forEach((k) => localStorage.removeItem(k));
  sessionStorage.clear();
} catch (e) { /* storage blocked: demo still works, it just cannot remember a sign-in */ }

const isMock = (url) => /^https?:\/\/mock\.local\/api\//.test(url);
const LATENCY_MS = 90;

// Photos a reviewer picks stay in this tab: the upload gets a made-up address, and images asking for it are
// pointed at the picked file. Nothing is sent anywhere.
const PICKED = new Map();
const PICKED_HOST = 'http://demo.local/photo/';
const imgSrc = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src');
Object.defineProperty(HTMLImageElement.prototype, 'src', {
  ...imgSrc,
  set(value) { imgSrc.set.call(this, typeof value === 'string' && PICKED.has(value) ? PICKED.get(value) : value); },
});

// React sets an <img>'s src as an attribute, so the picked-photo address is swapped there too.
const setAttr = Element.prototype.setAttribute;
Element.prototype.setAttribute = function (name, value) {
  if (this.tagName === 'IMG' && name === 'src' && typeof value === 'string' && PICKED.has(value)) return setAttr.call(this, name, PICKED.get(value));
  return setAttr.call(this, name, value);
};
// Nothing a reviewer picks outlives the tab: the picture is forgotten the moment they leave or close the demo.
window.addEventListener('pagehide', () => { PICKED.forEach((blobUrl) => URL.revokeObjectURL(blobUrl)); PICKED.clear(); });

const keepPicked = (formData) => {
  const file = formData instanceof FormData ? formData.get('file') : null;
  if (!(file instanceof Blob)) return '';
  const id = `${PICKED_HOST}${PICKED.size + 1}`;
  PICKED.set(id, URL.createObjectURL(file));
  return id;
};

function respond(method, url, bodyText) {
  const u = new URL(url);
  const plantPhoto = u.pathname.match(/^\/api\/plants\/([\w-]+)\/photos?$/);
  if (method === 'POST' && plantPhoto) {
    const id = keepPicked(bodyText);
    if (!id) return { status: 400, body: { detail: 'Choose a photo.' } };
    return core.handle(method, `${u.pathname.replace(/^\/api/, '')}`, { path: id }, u.searchParams);
  }
  if (method === 'POST' && u.pathname === '/api/upload') {
    const file = bodyText instanceof FormData ? bodyText.get('file') : null;
    const id = `${PICKED_HOST}${PICKED.size + 1}`;
    if (file instanceof Blob) PICKED.set(id, URL.createObjectURL(file));
    return { status: 200, body: { path: id, url: id } };
  }
  let body = {};
  try { body = bodyText ? JSON.parse(bodyText) : {}; } catch (e) { body = {}; }
  const out = core.handle(method, u.pathname.replace(/^\/api/, ''), body, u.searchParams);
  if (!out) {
    console.warn('[demo] not part of this demo:', method, u.pathname);
    return { status: 404, body: { detail: 'This part is not in the demo.' } };
  }
  return out;
}

// axios talks through XMLHttpRequest, so this is the smallest stand-in that satisfies it.
class DemoXHR {
  constructor() {
    this.readyState = 0; this.status = 0; this.statusText = ''; this.responseText = ''; this.response = '';
    this.responseType = ''; this.timeout = 0; this.withCredentials = false; this.upload = { addEventListener() {} };
    this._h = {}; this._l = {};
  }
  open(method, url) { this._method = method; this._url = url; this.readyState = 1; }
  setRequestHeader() {}
  getAllResponseHeaders() { return 'content-type: application/json\r\n'; }
  getResponseHeader(n) { return n.toLowerCase() === 'content-type' ? 'application/json' : null; }
  addEventListener(t, fn) { (this._l[t] = this._l[t] || []).push(fn); }
  removeEventListener(t, fn) { this._l[t] = (this._l[t] || []).filter((f) => f !== fn); }
  abort() { this._aborted = true; }
  _emit(t) {
    const ev = { type: t, target: this };
    if (typeof this['on' + t] === 'function') this['on' + t](ev);
    (this._l[t] || []).forEach((fn) => fn(ev));
  }
  send(bodyText) {
    const run = () => {
      if (this._aborted) return;
      const out = isMock(this._url) ? respond(this._method, this._url, bodyText) : { status: 404, body: {} };
      const text = JSON.stringify(out.body);
      this.status = out.status; this.statusText = out.status === 200 ? 'OK' : 'Not Found';
      this.responseText = text; this.response = this.responseType === 'json' ? out.body : text;
      this.readyState = 4;
      this._emit('readystatechange'); this._emit('load'); this._emit('loadend');
    };
    setTimeout(run, LATENCY_MS);
  }
}
window.XMLHttpRequest = DemoXHR;

const realFetch = window.fetch.bind(window);
window.fetch = (input, init = {}) => {
  const url = typeof input === 'string' ? input : input.url;
  if (typeof url === 'string' && PICKED.has(url)) return realFetch(PICKED.get(url));
  if (!isMock(url)) return realFetch(input, init);
  const out = respond((init.method || 'GET').toUpperCase(), url, init.body);
  return new Promise((r) => setTimeout(() => r(new Response(JSON.stringify(out.body), { status: out.status, headers: { 'content-type': 'application/json' } })), LATENCY_MS));
};

// This is a prototype review link: never report visits to the real product's analytics.
const append = Node.prototype.appendChild;
Node.prototype.appendChild = function (node) {
  if (node && node.tagName === 'SCRIPT' && /_vercel\/insights/.test(node.src || '')) return node;
  return append.call(this, node);
};

if (window.top === window) {
  const restart = () => {
    try { Object.keys(localStorage).filter((k) => k.startsWith('grove')).forEach((k) => localStorage.removeItem(k)); sessionStorage.clear(); } catch (e) { /* ignore */ }
    window.location.href = '/';
  };
  window.addEventListener('DOMContentLoaded', () => {
    // On a phone nothing may float over the app (it would cover real buttons): reloading the page restarts the demo.
    // On a desktop the app sits inside a phone frame, so the control lives in the empty space beside it.
    if (!window.matchMedia('(min-width: 900px)').matches) return;
    const bar = document.createElement('div');
    bar.setAttribute('data-demo-ui', '');
    bar.style.cssText = [
      'position:fixed', 'z-index:2147483647', 'display:flex', 'align-items:center', 'gap:10px',
      'font:500 13px/1 "Alegreya Sans",system-ui,sans-serif', 'color:#F4F1E6', 'background:rgba(11,15,8,.92)',
      'border:1px solid #3C4D26', 'border-radius:999px', 'padding:8px 8px 8px 14px',
      'right:20px', 'bottom:20px',
    ].join(';');
    const label = document.createElement('span');
    label.textContent = 'Prototype · fake data';
    const btn = document.createElement('button');
    btn.type = 'button'; btn.textContent = 'Restart demo';
    btn.style.cssText = 'font:inherit;color:#0B0F08;background:#92B44B;border:0;border-radius:999px;padding:7px 12px;cursor:pointer;min-height:32px';
    btn.addEventListener('click', restart);
    bar.append(label, btn);
    document.body.appendChild(bar);
  });
}

// Demo only: fill the account form so a reviewer can just tap Create account. Any values work in this demo;
// the fields stay editable, and are filled once per time they appear (not again while someone is typing).
const DEMO_ACCOUNT = { 'signup-email': 'maya@example.com', 'signup-password': 'growgrove1', 'signup-confirm': 'growgrove1' };
const fillDemoAccount = () => {
  for (const [id, value] of Object.entries(DEMO_ACCOUNT)) {
    const el = document.getElementById(id);
    if (!el || el.dataset.demoFilled) continue;
    el.dataset.demoFilled = '1';
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, value);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }
};
new MutationObserver(fillDemoAccount).observe(document.documentElement, { childList: true, subtree: true });

// On the plant-ID result, say plainly that the answer is a sample. The real app reads the photo that was chosen.
const markSampleResult = () => {
  for (const el of document.querySelectorAll('[data-testid="identify-review"], [data-testid="identify-low-conf"]')) {
    if (el.querySelector('[data-demo-note]')) continue;
    const note = document.createElement('p');
    note.setAttribute('data-demo-note', '');
    note.setAttribute('role', 'note');
    note.className = 'mb-3 rounded-inset border-hairline border-grove-sprout bg-grove-canopy px-3 py-2 font-ui text-sm text-grove-cream';
    note.textContent = 'Demo note: this result is a sample. In the real app, FloraGrove reads the photo you choose.';
    el.insertBefore(note, el.firstChild);
  }
};
new MutationObserver(markSampleResult).observe(document.documentElement, { childList: true, subtree: true });

// On a plant page, say plainly where an added photo goes: nowhere. It stays in this tab and is forgotten on exit.
const markPhotoNote = () => {
  const tabs = document.querySelector('[data-testid="plant-detail-tabs"]');
  if (!tabs || document.querySelector('[data-demo-photo-note]')) return;
  const note = document.createElement('p');
  note.setAttribute('data-demo-photo-note', '');
  note.setAttribute('role', 'note');
  note.className = 'mx-4 mt-3 rounded-inset border-hairline border-grove-sprout bg-grove-canopy px-3 py-2 font-ui text-sm text-grove-cream';
  note.textContent = 'Demo note: the first three photos and the note in this story are samples. A photo you add stays in this browser tab; nothing is uploaded or saved, and it is gone when you close the demo.';
  tabs.parentNode.insertBefore(note, tabs);
};
new MutationObserver(markPhotoNote).observe(document.documentElement, { childList: true, subtree: true });
