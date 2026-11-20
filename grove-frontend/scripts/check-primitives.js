#!/usr/bin/env node
// The raw-button check. Every control should come from components/ui/button.jsx (buttonVariants), which carries the
// 44px minimum and the focus ring once. A raw <button> restates both by hand. There are a lot of them today, so this is
// a ratchet, not a ban: each file's count is recorded in scripts/raw-button-baseline.json, and
//   - a file that has MORE raw buttons than its baseline fails (a new raw button needs a reason, or use the primitive),
//   - a file that has FEWER also fails, with the new number to record (so the list cannot go stale; the total only goes down),
//   - a file not in the baseline that has any raw button fails.
// `--update` rewrites the baseline from the tree, but refuses to raise any count.
// Tests, stories, generated files and components/ui/ itself are skipped. Comments are stripped first; a "<button" inside a
// string would still count, which is why the numbers are a floor for review, not a perfect census.
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const srcDir = path.join(root, 'src');
const baselinePath = process.env.PRIMITIVE_BASELINE || path.join(__dirname, 'raw-button-baseline.json');
const SKIP = [/\.generated\./, /\.test\.jsx?$/, /\.stories\.jsx?$/, /^src\/components\/ui\//];

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) walk(full, out);
    else if (/\.(js|jsx)$/.test(name)) out.push(full);
  }
  return out;
}

const strip = (src) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

function count() {
  const counts = {};
  for (const file of walk(srcDir)) {
    const rel = path.relative(root, file).split(path.sep).join('/');
    if (SKIP.some((re) => re.test(rel))) continue;
    const n = (strip(fs.readFileSync(file, 'utf8')).match(/<button\b/g) || []).length;
    if (n > 0) counts[rel] = n;
  }
  return counts;
}

const now = count();
const total = (o) => Object.values(o).reduce((a, b) => a + b, 0);
const load = () => (fs.existsSync(baselinePath) ? JSON.parse(fs.readFileSync(baselinePath, 'utf8')).files : {});
const write = (files) => fs.writeFileSync(baselinePath, JSON.stringify({
  note: 'Raw <button> tags per file, outside components/ui/. A ratchet: counts may only go down. See scripts/check-primitives.js.',
  total: total(files),
  files,
}, null, 2) + '\n');

if (process.argv.includes('--update')) {
  const before = load();
  const raised = Object.keys(now).filter((f) => now[f] > (before[f] || 0));
  if (raised.length && fs.existsSync(baselinePath)) {
    console.error('Refusing to raise the baseline. These files have more raw buttons than recorded:');
    raised.forEach((f) => console.error(`  ${f}: ${before[f] || 0} -> ${now[f]}`));
    process.exit(1);
  }
  write(now);
  console.log(`Baseline written: ${total(now)} raw buttons in ${Object.keys(now).length} files.`);
  process.exit(0);
}

const base = load();
const problems = [];
for (const f of new Set([...Object.keys(base), ...Object.keys(now)])) {
  const a = base[f] || 0;
  const b = now[f] || 0;
  if (b > a) problems.push(`${f}: ${b} raw <button> (baseline ${a}). Use buttonVariants from components/ui/button.jsx.`);
  if (b < a) problems.push(`${f}: ${b} raw <button> (baseline ${a}). Good: run \`node scripts/check-primitives.js --update\` to record the lower number.`);
}
if (problems.length) {
  console.error(`Raw-button check failed (${problems.length}):`);
  problems.forEach((p) => console.error(`  ${p}`));
  process.exit(1);
}
console.log(`Raw-button check passed. ${total(now)} raw buttons in ${Object.keys(now).length} files, none above baseline.`);
