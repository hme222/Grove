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

function respond(method, url, bodyText) {
  const u = new URL(url);
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
