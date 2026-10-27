import fs from 'fs';
import path from 'path';
import { TAB_CLASS, TAB_ACTIVE_CLASS, tabClass } from './tabStyles';

const classes = (s) => s.split(/\s+/).filter(Boolean);

test('an active tab and an inactive tab differ in border colour and text colour (merged order)', () => {
  const active = classes(tabClass(true));
  const inactive = classes(tabClass(false));
  expect(active).toContain('border-grove-lime');
  expect(active).not.toContain('border-transparent');
  expect(active).toContain('text-grove-cream');
  expect(active).not.toContain('text-grove-sage');
  expect(inactive).toContain('border-transparent');
  expect(inactive).toContain('text-grove-sage');
  expect(inactive).not.toContain('border-grove-lime');
});

test('the bottom border width survives the merge on both states', () => {
  expect(classes(tabClass(true))).toContain('border-b-strong');
  expect(classes(tabClass(false))).toContain('border-b-strong');
});

test('tab labels start on the page margin', () => {
  expect(classes(TAB_CLASS)).toContain('justify-start');
  expect(classes(TAB_CLASS)).not.toContain('justify-center');
});

test('no source builds a tab class with border-transparent and border-grove-lime unmerged', () => {
  const dir = path.join(__dirname);
  const files = fs.readdirSync(dir).filter((f) => /\.(js|jsx)$/.test(f) && !/\.test\./.test(f));
  files.forEach((f) => {
    const src = fs.readFileSync(path.join(dir, f), 'utf8');
    // Two classes that fight for border-color must never sit in one plain string.
    src.split('\n').forEach((line) => {
      if (/border-transparent/.test(line) && /border-grove-lime/.test(line)) {
        throw new Error(`${f}: border-transparent and border-grove-lime in the same string: ${line.trim()}`);
      }
    });
  });
  expect(TAB_CLASS + ' ' + TAB_ACTIVE_CLASS).toContain('border-grove-lime');
});
