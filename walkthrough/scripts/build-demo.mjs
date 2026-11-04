// Assembles demo/site from the production build: swaps in the in-browser backend, local fonts, and no analytics.
import fs from 'node:fs';
import path from 'node:path';
import { build } from 'esbuild';

const root = path.resolve(import.meta.dirname, '..');
const site = path.join(root, 'demo/site');
fs.rmSync(site, { recursive: true, force: true });
fs.cpSync(path.join(root, 'app-build'), site, { recursive: true });

fs.mkdirSync(path.join(site, 'fonts'));
for (const f of fs.readdirSync(path.join(root, 'public/fonts'))) {
  const src = path.join(root, 'public/fonts', f);
  if (f === 'fonts.css') fs.writeFileSync(path.join(site, 'fonts', f), fs.readFileSync(src, 'utf8').split('http://fonts.local/').join('/fonts/'));
  else fs.copyFileSync(src, path.join(site, 'fonts', f));
}

await build({ entryPoints: [path.join(root, 'demo/browser-entry.js')], bundle: true, minify: true, format: 'iife', outfile: path.join(site, 'demo-shim.js'), logLevel: 'error' });

const indexPath = path.join(site, 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');
html = html.replace(/<link[^>]*fonts\.(googleapis|gstatic)\.com[^>]*>/g, '');
html = html.replace('<head>', '<head><meta name="robots" content="noindex,nofollow"><script src="/demo-shim.js"></script><link rel="stylesheet" href="/fonts/fonts.css">');
fs.writeFileSync(indexPath, html);
console.log('demo built ->', site);
