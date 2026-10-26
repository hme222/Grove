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

if (failures.length) {
  console.error(`Computed token check failed: ${failures.length} problem${failures.length === 1 ? '' : 's'}.\n` + failures.join('\n'));
  process.exit(1);
}
console.log(`Computed token check passed. ${checked} shadcn variables resolve to their token hex.`);
