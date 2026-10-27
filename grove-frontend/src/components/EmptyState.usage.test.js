// EmptyState (components/EmptyState) reads only `config`. Passing icon/title/body props crashes it on render, which
// emptied the want list into an error. This guard keeps every use of it on the config API.
import fs from 'fs';
import path from 'path';

const SRC = path.join(__dirname, '..');

function sourceFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(full);
    return /\.(js|jsx)$/.test(entry.name) && !/\.(test|stories)\./.test(entry.name) ? [full] : [];
  });
}

test('every <EmptyState> from components/EmptyState is given a config', () => {
  const offenders = [];
  sourceFiles(SRC).forEach((file) => {
    const text = fs.readFileSync(file, 'utf8');
    if (!/from ['"](\.\.?\/)+components\/EmptyState['"]|from ['"]@\/components\/EmptyState['"]|from ['"]\.\/EmptyState['"]/.test(text)) return;
    const uses = text.match(/<EmptyState\b[^>]*>/gs) || [];
    uses.forEach((tag) => { if (!/\bconfig=/.test(tag)) offenders.push(`${path.relative(SRC, file)}: ${tag.slice(0, 60)}`); });
  });
  expect(offenders).toEqual([]);
});
