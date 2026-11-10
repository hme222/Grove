import {
  PALETTE_NAMES, readPalette,
  availableKinds, buildCardSvg, cardAlt, cardFileName, cardSize, escapeXml, shareStats,
} from './shareCards';

const palette = Object.fromEntries(PALETTE_NAMES.map((n) => [n, `C_${n}`]));
const NOW = new Date(2026, 10, 10, 12, 0, 0);
const daysAgo = (n) => new Date(2026, 10, 10 - n, 9, 0, 0).toISOString();
const plant = { nickname: 'Monty', common_name: 'Monstera', latin_name: 'Monstera deliciosa', created_at: daysAgo(41) };
const logs = [
  { id: 1, action: 'water', logged_at: daysAgo(0) },
  { id: 2, action: 'water', logged_at: daysAgo(2) },
  { id: 3, action: 'mist', logged_at: daysAgo(3) },
  { id: 4, action: 'water', logged_at: daysAgo(20) },
  { id: 5, action: 'note', logged_at: daysAgo(1), notes: 'hi' },
  { id: 6, action: 'new_leaf', logged_at: daysAgo(5) },
];

describe('shareStats', () => {
  it('counts the day together, waterings, care days this week and the new leaf', () => {
    const s = shareStats(plant, logs, NOW);
    expect(s).toMatchObject({ name: 'Monty', species: 'Monstera deliciosa', days: 42, waters: 3, hasLeaf: true, leafDay: 37 });
    // days 0, 2, 3 and 5 had care; the note on day 1 is not care; day 20 is outside the week
    expect(s.weekDays).toBe(4);
  });
  it('is never zero days and survives no data', () => {
    expect(shareStats({}, [], NOW)).toMatchObject({ name: 'My plant', days: 1, waters: 0, weekDays: 0, hasLeaf: false });
    expect(shareStats(null, null, NOW).days).toBe(1);
  });
  it('falls back to the common name and ignores bad dates', () => {
    const s = shareStats({ common_name: 'Pothos' }, [{ action: 'water', logged_at: 'nope' }], NOW);
    expect(s.name).toBe('Pothos');
    expect(s.waters).toBe(0);
  });
});

describe('shareStats for one milestone', () => {
  it('counts the day of the chosen leaf, not the latest, and counts as having a leaf', () => {
    const s = shareStats(plant, logs, NOW, { leafAt: daysAgo(30) });
    expect(s.leafDay).toBe(12);
    expect(s.hasLeaf).toBe(true);
    expect(shareStats(plant, [], NOW, { leafAt: daysAgo(30) }).hasLeaf).toBe(true);
  });
});

describe('availableKinds', () => {
  it('hides the new-leaf and this-week cards until they are true', () => {
    expect(availableKinds(shareStats(plant, [], NOW)).map((k) => k.id)).toEqual(['day', 'sticker', 'card']);
    expect(availableKinds(shareStats(plant, logs, NOW)).map((k) => k.id)).toEqual(['day', 'sticker', 'leaf', 'week', 'card']);
  });
});

describe('readPalette', () => {
  it('reads the app tokens from CSS variables, kebab-cased, and falls back to a named color', () => {
    document.documentElement.style.setProperty('--grove-leaf-on-cream', '#123456');
    document.documentElement.style.setProperty('--grove-lime', '#abcdef');
    const p = readPalette();
    expect(p.leafOnCream).toBe('#123456');
    expect(p.lime).toBe('#abcdef');
    expect(p.bloom).toBe('black');
    document.documentElement.removeAttribute('style');
  });
});

describe('buildCardSvg', () => {
  const stats = shareStats(plant, logs, NOW);
  it('draws the plant name and numbers, and nothing personal', () => {
    for (const id of ['day', 'sticker', 'leaf', 'week', 'card']) {
      const svg = buildCardSvg(id, stats, { palette });
      expect(svg).toContain('Monty');
      expect(svg).toContain('viewBox=');
      expect(svg).not.toMatch(/@|password|email/i);
    }
    expect(buildCardSvg('day', stats, { palette })).toContain('>42<');
    expect(buildCardSvg('sticker', stats, { palette })).toContain('4/7');
    expect(buildCardSvg('leaf', stats, { palette })).toContain('on day 37');
  });
  it('makes the sticker transparent and tight, and the others full story size', () => {
    const sticker = buildCardSvg('sticker', stats, { palette });
    expect(sticker).toContain('viewBox="90 960 900 600"');
    expect(sticker).not.toMatch(/<rect width="1080" height="1920"/);
    expect(buildCardSvg('day', stats, { palette })).toMatch(/<rect width="1080" height="1920" fill="C_forest"/);
    expect(cardSize('sticker')).toEqual({ width: 900, height: 600 });
    expect(cardSize('day')).toEqual({ width: 1080, height: 1920 });
  });
  it('escapes a nickname that tries to break the picture', () => {
    const evil = shareStats({ nickname: '<script>"x"&</script>', created_at: daysAgo(1) }, [], NOW);
    const svg = buildCardSvg('card', evil, { palette });
    expect(svg).not.toContain('<script>');
    expect(svg).toContain('&lt;script&gt;');
    expect(escapeXml("a'b")).toBe('a&apos;b');
  });
  it('embeds the photo and fonts when given, and shows a leaf without a photo', () => {
    expect(buildCardSvg('card', stats, { palette, photo: 'data:image/png;base64,AAA' })).toContain('href="data:image/png;base64,AAA"');
    expect(buildCardSvg('card', stats, { palette })).not.toContain('<image');
    expect(buildCardSvg('day', stats, { palette, fontCss: '@font-face{font-family:X}' })).toContain('<style>@font-face{font-family:X}</style>');
  });
  it('shrinks long names and uses singular words', () => {
    const long = shareStats({ nickname: 'Sir Reginald Fernsworth the Third', created_at: daysAgo(0) }, [], NOW);
    expect(buildCardSvg('card', long, { palette })).toMatch(/font-size="(\d+)"[^>]*>Sir Reginald/);
    expect(buildCardSvg('card', long, { palette })).toContain('1 day<');
  });
  it('describes every card in words', () => {
    expect(cardAlt('leaf', stats)).toBe('Card: Monty grew a new leaf on day 37.');
    expect(cardAlt('sticker', stats)).toMatch(/Transparent sticker/);
    expect(cardAlt('week', stats)).toMatch(/4 of the last 7 days/);
  });
  it('names files safely', () => {
    expect(cardFileName({ name: "Monty's Corner!" }, 'day')).toBe('monty-s-corner-day.png');
    expect(cardFileName({ name: '???' }, 'day')).toBe('plant-day.png');
  });
});
