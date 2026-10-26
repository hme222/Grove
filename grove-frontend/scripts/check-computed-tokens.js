#!/usr/bin/env node
// Computed-token check. Parses the generated CSS and fails if any shadcn variable does not resolve to exactly the
// hex of the token it is bound to in design/tokens.json (so a Button renders lime, not a rounded near-lime), and if
// tailwind.config.js or src consume those variables any way other than rgb(var(--x) / <alpha-value>).
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const tokens = JSON.parse(fs.readFileSync(path.join(root, '..', 'design', 'tokens.json'), 'utf8'));
const css = fs.readFileSync(path.join(root, 'src', 'styles', 'tokens.generated.css'), 'utf8');
const failures = [];

const declared = {};
for (const m of css.matchAll(/^\s*--([a-z0-9-]+):\s*([^;]+);/gm)) declared[m[1]] = m[2].trim();

const toHex = (r, g, b) => '#' + [r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('').toUpperCase();

let checked = 0;
for (const [name, colorName] of Object.entries(tokens.shadcn)) {
  const want = tokens.color[colorName];
  const value = declared[name];
  const m = value && value.match(/^(\d{1,3}) (\d{1,3}) (\d{1,3})$/);
  if (!m) { failures.push(`--${name}: expected an "R G B" triplet for ${colorName} (${want}), found ${JSON.stringify(value)}`); continue; }
  const got = toHex(+m[1], +m[2], +m[3]);
  if (got !== want.toUpperCase()) failures.push(`--${name}: resolves to ${got}, token ${colorName} is ${want}`);
  checked++;
}

const consumers = [path.join(root, 'tailwind.config.js')];
(function walk(dir) {
  for (const n of fs.readdirSync(dir)) {
    const p = path.join(dir, n);
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (/\.(js|jsx|css)$/.test(n) && !/\.generated\./.test(n) && !/\.test\./.test(n)) consumers.push(p);
  }
})(path.join(root, 'src'));
for (const file of consumers) {
  const text = fs.readFileSync(file, 'utf8');
  for (const m of text.matchAll(/hsl\(\s*var\(/g)) failures.push(`${path.relative(root, file)}: hsl(var(...)) consumes a shadcn variable; use rgb(var(--x) / <alpha-value>)`);
}
const tw = fs.readFileSync(path.join(root, 'tailwind.config.js'), 'utf8');
for (const name of Object.keys(tokens.shadcn)) {
  if (!tw.includes(`rgb(var(--${name}) / <alpha-value>)`)) failures.push(`tailwind.config.js: --${name} is not consumed as rgb(var(--${name}) / <alpha-value>)`);
}

// Font-size floor: no text under 14px (0.875rem). Scans source CSS and inline styles for literal sizes, resolves the
// Tailwind text-* scale from tokens.json, and checks that each sub-14px rule in a library stylesheet we ship
// (sonner's toast and action button) is overridden in src/index.css.
const FLOOR_PX = 14;
const toPx = (n, unit) => (unit === 'rem' || unit === 'em' ? n * 16 : n);
for (const [name, [size]] of Object.entries(tokens.fontSize)) {
  const m = size.match(/^([\d.]+)(rem|px)$/);
  if (m && toPx(parseFloat(m[1]), m[2]) < FLOOR_PX) failures.push(`tokens.json fontSize.${name} is ${size}, under the ${FLOOR_PX}px floor`);
}
for (const file of consumers) {
  if (file.endsWith('tailwind.config.js')) continue;
  const text = fs.readFileSync(file, 'utf8');
  for (const m of text.matchAll(/font-size\s*:\s*([\d.]+)(px|rem)\b/g)) {
    if (toPx(parseFloat(m[1]), m[2]) < FLOOR_PX) failures.push(`${path.relative(root, file)}: font-size ${m[1]}${m[2]} is under the ${FLOOR_PX}px floor`);
  }
  for (const m of text.matchAll(/fontSize\s*:\s*['"]?([\d.]+)(px|rem)?['"]?\s*[,}]/g)) {
    if (toPx(parseFloat(m[1]), m[2] || 'px') < FLOOR_PX) failures.push(`${path.relative(root, file)}: inline fontSize ${m[1]}${m[2] || ''} is under the ${FLOOR_PX}px floor`);
  }
}
const libCss = path.join(root, 'node_modules', 'sonner', 'dist', 'index.mjs');
if (fs.existsSync(libCss)) {
  const lib = fs.readFileSync(libCss, 'utf8');
  const indexCss = fs.readFileSync(path.join(root, 'src', 'index.css'), 'utf8');
  for (const m of lib.matchAll(/([^{}]+)\{[^{}]*?font-size:\s*([\d.]+)px/g)) {
    if (parseFloat(m[2]) >= FLOOR_PX) continue;
    const key = m[1].trim().split(/[,"]/).pop().replace(/^.*\}/, '').trim();
    const attr = (key.match(/\[data-[a-z-]+/g) || []).pop();
    if (!attr || !new RegExp(attr.replace('[', '\\[') + '[^{]*\\{[^}]*font-size:\\s*var\\(--text-').test(indexCss)) {
      failures.push(`sonner CSS sets ${m[2]}px on "${m[1].trim().slice(-60)}"; override it in src/index.css with a --text-* variable`);
    }
  }
  if (!/data-sonner-toast[^{]*\{[^}]*border-width:\s*var\(--border-hairline-width\)/.test(indexCss)) failures.push('src/index.css: the toast border is not bound to --border-hairline-width');
}

if (failures.length) {
  console.error(`Computed token check failed: ${failures.length} problem${failures.length === 1 ? '' : 's'}.\n` + failures.join('\n'));
  process.exit(1);
}
console.log(`Computed token check passed. ${checked} shadcn variables resolve to their token hex.`);
