import fs from 'fs';
import path from 'path';
import { photoCredits } from './photoCredits';

const PHOTOS_DIR = path.resolve(__dirname, '../../public/photos');
const SRC_DIR = path.resolve(__dirname, '..');

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) walk(full, out);
    else if (/\.(js|jsx)$/.test(name) && !/\.(test|stories)\./.test(name) && name !== 'photoCredits.js') out.push(full);
  }
  return out;
}

describe('photo credits', () => {
  test('every credit is complete and links to Unsplash', () => {
    expect(photoCredits.length).toBeGreaterThan(0);
    photoCredits.forEach((c) => {
      expect(c.file).toMatch(/\.jpg$/);
      expect(c.title).toBeTruthy();
      expect(c.photographer).toBeTruthy();
      expect(c.photographerUrl).toMatch(/^https:\/\/unsplash\.com\/@/);
      if (c.note === 'photo page not verified') expect(c.photoUrl).toBe(c.photographerUrl);
      else expect(c.photoUrl).toMatch(/^https:\/\/unsplash\.com\/photos\//);
    });
    expect(new Set(photoCredits.map((c) => c.file)).size).toBe(photoCredits.length);
  });

  test('every credited file exists in public/photos and stays small', () => {
    photoCredits.forEach((c) => {
      const file = path.join(PHOTOS_DIR, c.file);
      expect(fs.existsSync(file)).toBe(true);
      expect(fs.statSync(file).size).toBeLessThan(150 * 1024);
    });
  });

  test('every photo used in src is credited, and no file in public/photos is uncredited', () => {
    const credited = new Set(photoCredits.map((c) => c.file));
    const used = new Set();
    walk(SRC_DIR).forEach((f) => {
      const text = fs.readFileSync(f, 'utf8');
      for (const m of text.matchAll(/\/photos\/([\w.-]+\.(?:jpg|jpeg|png|webp))/g)) used.add(m[1]);
    });
    expect(used.size).toBeGreaterThan(0);
    used.forEach((file) => expect(credited.has(file)).toBe(true));
    const files = fs.readdirSync(PHOTOS_DIR).filter((f) => !f.startsWith('.'));
    expect(files).toEqual(expect.arrayContaining(['onboarding-forest.jpg', 'welcome-forest.jpg']));
    files.forEach((f) => expect(credited.has(f)).toBe(true));
  });

  test('no source file points at the retired /onboarding/ folder or imports a photo from src/assets', () => {
    walk(SRC_DIR).forEach((f) => {
      const text = fs.readFileSync(f, 'utf8');
      expect(`${f}: ${/['"`(]\/?onboarding\/[\w-]+\.(?:jpg|png)/.test(text)}`).toMatch(/: false$/);
      expect(`${f}: ${/from '@\/assets\/[^']+\.(?:jpg|jpeg|png)'/.test(text)}`).toMatch(/: false$/);
    });
    expect(fs.existsSync(path.resolve(PHOTOS_DIR, '../onboarding'))).toBe(false);
  });
});
