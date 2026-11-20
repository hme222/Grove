#!/usr/bin/env node
// The color check for the two places outside the React app: the sales-page draft (grove-sales) and the iPhone shell.
// Hex colors there must come from design/tokens.json (through tokens.generated.css and theme.generated.js), or be listed in
// scripts/landing-token-exceptions.json with a reason and what would retire them. An exception that no longer matches
// anything fails, so the list cannot go stale. Hex colors only: rgba() glows and gradients on the landing page are not scanned.
//
// Skipped: the generated files, and the exported welcome-screen artwork in grove-sales/index.html (between its
// exported-artwork markers), which is inline markup copied from the app's own welcome stage.
const fs = require('fs');
const path = require('path');

const repo = path.join(__dirname, '..', '..');
const exceptions = JSON.parse(fs.readFileSync(path.join(__dirname, 'landing-token-exceptions.json'), 'utf8')).exceptions;
const FILES = ['grove-sales/index.html', 'grove-sales/page.mjs', 'grove-sales/offer.mjs', 'grove-sales/offer-copy.mjs', 'grove-mobile/App.js', 'grove-mobile/app.json'];
const HEX = /#[0-9A-Fa-f]{6}\b|#[0-9A-Fa-f]{3}\b/g;

const strip = (text, file) => {
  let t = text;
  if (file.endsWith('index.html')) {
    const a = t.indexOf('exported-artwork:start');
    const b = t.indexOf('exported-artwork:end');
    if (a !== -1 && b !== -1) t = t.slice(0, a) + t.slice(b);
  }
  return t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/<!--[\s\S]*?-->/g, '');
};

const found = {};
for (const file of FILES) {
  const full = path.join(repo, file);
  if (!fs.existsSync(full)) continue;
  for (const m of strip(fs.readFileSync(full, 'utf8'), file).matchAll(HEX)) {
    const key = `${file} ${m[0].toUpperCase()}`;
    found[key] = (found[key] || 0) + 1;
  }
}

const allowed = new Map(exceptions.map((e) => [`${e.file} ${e.match.toUpperCase()}`, e]));
const problems = [];
for (const [key, n] of Object.entries(found)) {
  const e = allowed.get(key);
  if (!e) problems.push(`${key}: ${n} use(s), not a token and not in landing-token-exceptions.json. Use the token (see tokens.generated.css or theme.generated.js) or add an exception with a reason.`);
  else if (e.count !== n) problems.push(`${key}: ${n} use(s), the exception says ${e.count}. Update its count.`);
}
for (const [key, e] of allowed) {
  if (!found[key]) problems.push(`${key}: listed as an exception but no longer in the file. Remove the entry.`);
  if (!e.reason || !e.retireWhen) problems.push(`${key}: an exception needs a reason and a retireWhen.`);
}

if (problems.length) {
  console.error(`Landing and mobile color check failed (${problems.length}):`);
  problems.forEach((p) => console.error('  ' + p));
  process.exit(1);
}
console.log(`Landing and mobile color check passed. ${Object.keys(found).length} literal colors, all listed with a reason.`);
