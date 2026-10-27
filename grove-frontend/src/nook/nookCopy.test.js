import fs from 'fs';
import path from 'path';
import * as copy from './nookCopy';

// UI strings use the curly apostrophe (’), never the straight one.
function walk(value, out = []) {
  if (typeof value === 'string') out.push(value);
  else if (Array.isArray(value)) value.forEach((v) => walk(v, out));
  else if (value && typeof value === 'object') Object.values(value).forEach((v) => walk(v, out));
  return out;
}

test('exported nook strings have no straight apostrophe', () => {
  const strings = walk(Object.values(copy).filter((v) => typeof v !== 'function'));
  expect(strings.length).toBeGreaterThan(5);
  expect(strings.filter((s) => s.includes("'"))).toEqual([]);
});

test('lines Pip builds have no straight apostrophe', () => {
  const states = [
    { quiet: true, plants: [{ condition: 'needs-attention' }] },
    { level_up: true, level_name: 'Greenhouse', plants: [] },
    { grew: true, plants: [] },
    { pip: { location: 'shelf' }, plants: [] },
    { pip: { location: 'windowsill' }, plants: [] },
  ];
  states.forEach((s) => {
    expect(copy.pipLine(s)).not.toContain("'");
    expect(copy.lookLine(s)).not.toContain("'");
  });
});

test('the source has no straight apostrophe inside a double-quoted or template string', () => {
  const src = fs.readFileSync(path.join(__dirname, 'nookCopy.js'), 'utf8');
  const bad = src.split('\n').filter((l) => !/^\s*(\/\/|\*)/.test(l) && /"[^"\n]*'[^"\n]*"|`[^`\n]*'[^`\n]*`/.test(l));
  expect(bad).toEqual([]);
});
