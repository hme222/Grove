// "\uXXXX" is a JavaScript string escape. In JSX text (between > and <) it is NOT decoded, so people would read the
// backslash sequence on screen. Use &rsquo; or the real character there.
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

test('no \\u escape sits in JSX text', () => {
  const offenders = [];
  sourceFiles(SRC).forEach((file) => {
    // Lesson cards are data: HTML written inside JS strings, where the escape is valid.
    if (/lessons[\\/]cards[\\/]/.test(file)) return;
    const text = fs.readFileSync(file, 'utf8');
    // JSX text: a closing > of a tag followed by text containing \uXXXX before the next < or {.
    const re = />([^<>{}\n]*\\u[0-9a-fA-F]{4}[^<>{}\n]*)</g;
    let m;
    while ((m = re.exec(text))) offenders.push(`${path.relative(SRC, file)}: ${m[1].slice(0, 60)}`);
  });
  expect(offenders).toEqual([]);
});
