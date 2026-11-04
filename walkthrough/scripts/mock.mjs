// Playwright wrapper around the shared mock core. Unmocked requests are aborted and logged so gaps fail loudly.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCore } from './mock-core.mjs';

const fontsDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../public/fonts');
export const FROZEN_NOW = '2026-11-03T10:00:00-05:00';
const cors = { 'access-control-allow-origin': '*' };

export function createMock({ log = () => {} } = {}) {
  const core = createCore({ now: () => FROZEN_NOW, today: () => '2026-11-03' });

  async function handle(route) {
    const req = route.request();
    const url = new URL(req.url());
    const method = req.method();
    const p = url.pathname.replace(/^\/api/, '');
    let body = {};
    try { body = req.postDataJSON() || {}; } catch { body = {}; }
    const out = core.handle(method, p, body, url.searchParams);
    if (!out) { log(`UNMOCKED ${method} ${p}`); return route.abort(); }
    log(`${method} ${p} -> mocked`);
    return route.fulfill({ status: out.status, contentType: 'application/json', headers: cors, body: JSON.stringify(out.body) });
  }

  async function install(context) {
    await context.route('http://mock.local/**', (route) => {
      if (route.request().method() === 'OPTIONS') {
        return route.fulfill({ status: 204, headers: { ...cors, 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' } });
      }
      return handle(route);
    });
    await context.route(/_vercel\/insights/, (route) => route.abort());
    await context.route(/fonts\.googleapis\.com/, (route) => route.fulfill({ path: fontsDir + '/fonts.css', contentType: 'text/css', headers: cors }));
    await context.route(/fonts\.(gstatic|local)/, (route) => {
      const name = new URL(route.request().url()).pathname.split('/').pop();
      const file = fontsDir + '/' + name;
      return fs.existsSync(file) ? route.fulfill({ path: file, contentType: 'font/woff2', headers: cors }) : route.abort();
    });
  }

  return { install, state: core.state };
}
