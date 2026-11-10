// Share cards: five small pictures of a plant's story, built as SVG so they stay sharp, then turned into a PNG
// (Instagram and most chat apps do not take SVG). Only what the person chose to share is drawn: the plant's name,
// species, days together, waterings, care this week, and the new-leaf milestone. Never an email, username or location.
// Designed on a 1080 x 1920 story canvas; the sticker is cropped tight so it pastes as a movable, transparent sticker.

// The card colors are the app's own tokens, read from the page's CSS variables so the pictures follow the design system.
// An exported image needs real color values, which is why they are resolved here instead of left as var().
export const PALETTE_NAMES = ['night', 'root', 'forest', 'canopy', 'moss', 'lime', 'sprout', 'sun', 'cream', 'lichen', 'bloom',
  'ink', 'inkSoft', 'paper', 'paperCard', 'paperPale', 'paperBorder', 'paperGreen', 'paperAccent', 'leafOnCream'];

export function readPalette() {
  const style = typeof document !== 'undefined' ? getComputedStyle(document.documentElement) : null;
  return Object.fromEntries(PALETTE_NAMES.map((n) => [n, (style && style.getPropertyValue(`--grove-${n.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)}`).trim()) || 'black']));
}

export const CARD_W = 1080;
export const CARD_H = 1920;

const DISPLAY = "'Cormorant Garamond', Georgia, serif";
const UI = "'Alegreya Sans', Optima, Candara, sans-serif";
const LEAF = 'M0 -20 C11 -10 11 10 0 20 C-11 10 -11 -10 0 -20Z';

// The card ids, in the order the sheet shows them. `needs` names what the plant must have for the card to be honest.
export const CARD_KINDS = [
  { id: 'day', label: 'Day count', transparent: false, needs: null },
  { id: 'sticker', label: 'Sticker', transparent: true, needs: null },
  { id: 'leaf', label: 'New leaf', transparent: false, needs: 'leaf' },
  { id: 'week', label: 'This week', transparent: false, needs: 'week' },
  { id: 'card', label: 'Plant card', transparent: false, needs: null },
];

export const escapeXml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

const DAY_MS = 86400000;
const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

// What the cards say, worked out from the plant and its care log. `now` is injectable for tests.
// `leafAt` names which new leaf a milestone card is about (sharing from that journal entry); otherwise the latest one.
export function shareStats(plant, logs, now = new Date(), { leafAt = null } = {}) {
  const list = (logs || []).filter((l) => l && l.logged_at && !Number.isNaN(new Date(l.logged_at).getTime()));
  const created = plant && plant.created_at ? new Date(plant.created_at) : null;
  const days = created && !Number.isNaN(created.getTime())
    ? Math.max(1, Math.round((startOfDay(now) - startOfDay(created)) / DAY_MS) + 1)
    : 1;
  const waters = list.filter((l) => l.action === 'water').length;
  // Days in the last seven (today and the six before) with any care. Not a streak: a missed day costs nothing.
  const careDays = new Set();
  for (const l of list) {
    if (l.action === 'photo' || l.action === 'note') continue;
    const ago = Math.round((startOfDay(now) - startOfDay(new Date(l.logged_at))) / DAY_MS);
    if (ago >= 0 && ago < 7) careDays.add(ago);
  }
  const leaves = list.filter((l) => l.action === 'new_leaf').sort((a, b) => new Date(b.logged_at) - new Date(a.logged_at));
  const leafDate = leafAt ? new Date(leafAt) : (leaves[0] ? new Date(leaves[0].logged_at) : null);
  const leafDay = leafDate && !Number.isNaN(leafDate.getTime()) && created && !Number.isNaN(created.getTime())
    ? Math.max(1, Math.round((startOfDay(leafDate) - startOfDay(created)) / DAY_MS) + 1)
    : days;
  return {
    name: (plant && (plant.nickname || plant.common_name)) || 'My plant',
    species: (plant && (plant.latin_name || (plant.nickname ? plant.common_name : ''))) || '',
    days, waters, weekDays: careDays.size, hasLeaf: leaves.length > 0 || !!leafAt, leafDay,
  };
}

// Which cards can honestly be shown for these stats.
export const availableKinds = (stats) => CARD_KINDS.filter((k) => (k.needs === 'leaf' ? stats.hasLeaf : k.needs === 'week' ? stats.weekDays > 0 : true));

const star = (x, y, s, c) => `<path transform="translate(${x} ${y}) scale(${s})" d="M0 -10 C1 -3 3 -1 10 0 C3 1 1 3 0 10 C-1 3 -3 1 -10 0 C-3 -1 -1 -3 0 -10Z" fill="${c}"/>`;
const mark = (x, y, s, out, fill, bg) => `<g transform="translate(${x} ${y}) scale(${s})"><path transform="translate(-7 2) rotate(-24)" d="${LEAF}" fill="none" stroke="${out}" stroke-width="2.8"/><path transform="translate(7 2) rotate(24)" d="${LEAF}" fill="${fill}" stroke="${bg}" stroke-width="3" paint-order="stroke"/></g>`;
const wordmark = (x, y, size, color, anchor = 'middle') => `<text x="${x}" y="${y}" text-anchor="${anchor}" fill="${color}" font-size="${size}"><tspan font-family="${UI}" font-weight="300">Flora</tspan><tspan font-family="${DISPLAY}" font-weight="700">Grove</tspan></text>`;

// Long nicknames shrink instead of running off the card.
const fit = (text, size, maxChars) => (text.length > maxChars ? Math.max(48, Math.floor(size * (maxChars / text.length))) : size);

function cardBody(kind, s, photo, c) {
  const name = escapeXml(s.name);
  const species = escapeXml(s.species);
  if (kind === 'day') {
    return {
      bg: c.forest,
      body: `<circle cx="540" cy="760" r="330" fill="${c.canopy}"/>
<text x="540" y="560" text-anchor="middle" font-family="${UI}" font-size="44" letter-spacing="6" fill="${c.lichen}">DAY</text>
<text x="540" y="900" text-anchor="middle" font-family="${DISPLAY}" font-weight="500" font-size="${s.days > 999 ? 300 : s.days > 99 ? 360 : 420}" fill="${c.cream}">${s.days}</text>
<text x="540" y="1080" text-anchor="middle" font-family="${DISPLAY}" font-weight="500" font-size="${fit(`with ${s.name}`, 76, 18)}" fill="${c.cream}">with ${name}</text>
<path d="M440 1130 C 500 1160 580 1100 640 1130" stroke="${c.lime}" stroke-width="5" fill="none" stroke-linecap="round"/>
<text x="540" y="1230" text-anchor="middle" font-family="${UI}" font-size="46" fill="${c.sprout}">Still growing</text>
${star(180, 520, 5, c.sun)}${star(900, 640, 3.5, c.sprout)}${star(820, 420, 2.5, c.sun)}
${mark(540, 1560, 2.2, c.lime, c.lime, c.forest)}
${wordmark(540, 1710, 64, c.cream)}`,
    };
  }
  if (kind === 'sticker') {
    return {
      crop: [90, 960, 900, 600],
      body: `<rect x="150" y="1020" width="780" height="480" rx="56" fill="${c.paperCard}"/>
${mark(270, 1130, 1.6, c.leafOnCream, c.leafOnCream, c.paperCard)}
<text x="360" y="1150" font-family="${DISPLAY}" font-weight="700" font-size="${fit(s.name, 76, 14)}" fill="${c.ink}">${name}</text>
<text x="210" y="1260" font-family="${UI}" font-size="40" fill="${c.inkSoft}">Day</text>
<text x="210" y="1380" font-family="${DISPLAY}" font-weight="600" font-size="120" fill="${c.paperGreen}">${s.days}</text>
<text x="480" y="1260" font-family="${UI}" font-size="40" fill="${c.inkSoft}">Waters</text>
<text x="480" y="1380" font-family="${DISPLAY}" font-weight="600" font-size="120" fill="${c.paperGreen}">${s.waters}</text>
<text x="700" y="1260" font-family="${UI}" font-size="40" fill="${c.inkSoft}">This week</text>
<text x="700" y="1380" font-family="${DISPLAY}" font-weight="600" font-size="110" fill="${c.paperGreen}">${s.weekDays}/7</text>
<text x="540" y="1450" text-anchor="middle" font-family="${UI}" font-size="32" fill="${c.paperAccent}">FloraGrove</text>`,
    };
  }
  if (kind === 'leaf') {
    return {
      bg: c.paper,
      body: `<circle cx="540" cy="820" r="300" fill="${c.paperPale}"/>
<g transform="translate(540 800) scale(8)"><path transform="rotate(-24)" d="${LEAF}" fill="${c.paperAccent}"/><path d="M0 18 L0 -14" stroke="${c.paperPale}" stroke-width="0.9" transform="rotate(-24)"/></g>
${star(250, 520, 6, c.bloom)}${star(840, 560, 4.5, c.sun)}${star(780, 1080, 3.5, c.bloom)}${star(300, 1100, 3, c.sun)}
<text x="540" y="1250" text-anchor="middle" font-family="${UI}" font-size="44" letter-spacing="6" fill="${c.paperAccent}">NEW MILESTONE</text>
<text x="540" y="1370" text-anchor="middle" font-family="${DISPLAY}" font-weight="600" font-size="${fit(`${s.name} grew`, 112, 14)}" fill="${c.ink}">${name} grew</text>
<text x="540" y="1490" text-anchor="middle" font-family="${DISPLAY}" font-weight="600" font-style="italic" font-size="112" fill="${c.paperGreen}">a new leaf</text>
<text x="540" y="1590" text-anchor="middle" font-family="${UI}" font-size="44" fill="${c.inkSoft}">on day ${s.leafDay}</text>
${mark(540, 1740, 1.5, c.leafOnCream, c.leafOnCream, c.paper)}
${wordmark(540, 1850, 50, c.ink)}`,
    };
  }
  if (kind === 'week') {
    const cx = 540; const cy = 820; const r = 300;
    let ring = '';
    for (let i = 0; i < 7; i += 1) {
      const a0 = ((-90 + (i * 360) / 7 + 4) * Math.PI) / 180;
      const a1 = ((-90 + ((i + 1) * 360) / 7 - 4) * Math.PI) / 180;
      const x0 = (cx + r * Math.cos(a0)).toFixed(1); const y0 = (cy + r * Math.sin(a0)).toFixed(1);
      const x1 = (cx + r * Math.cos(a1)).toFixed(1); const y1 = (cy + r * Math.sin(a1)).toFixed(1);
      ring += `<path d="M${x0} ${y0} A${r} ${r} 0 0 1 ${x1} ${y1}" stroke="${i < s.weekDays ? c.lime : c.moss}" stroke-width="44" fill="none" stroke-linecap="round"/>`;
    }
    return {
      bg: c.night,
      body: `${ring}
<text x="540" y="840" text-anchor="middle" font-family="${DISPLAY}" font-weight="500" font-size="300" fill="${c.cream}">${s.weekDays}</text>
<text x="540" y="990" text-anchor="middle" font-family="${UI}" font-size="52" fill="${c.sprout}">of the last 7 days</text>
<text x="540" y="1330" text-anchor="middle" font-family="${DISPLAY}" font-weight="500" font-size="${fit(`${s.name} got care`, 84, 18)}" fill="${c.cream}">${name} got care</text>
<text x="540" y="1420" text-anchor="middle" font-family="${UI}" font-size="44" fill="${c.lichen}">${s.waters} ${s.waters === 1 ? 'watering' : 'waterings'} so far</text>
${star(200, 430, 4, c.sun)}${star(890, 1200, 3, c.sprout)}
${mark(540, 1640, 2, c.lime, c.lime, c.night)}
${wordmark(540, 1780, 56, c.cream)}`,
    };
  }
  // 'card'
  const picture = photo
    ? `<clipPath id="p"><rect x="180" y="320" width="720" height="720" rx="18"/></clipPath><image href="${photo}" x="180" y="320" width="720" height="720" preserveAspectRatio="xMidYMid slice" clip-path="url(#p)"/>`
    : `<g transform="translate(540 680) scale(9)"><path transform="rotate(-24)" d="${LEAF}" fill="${c.lime}"/></g>`;
  return {
    bg: c.paper,
    body: `<g transform="translate(0 110)">
<rect x="120" y="260" width="840" height="1400" rx="44" fill="${c.paperCard}" stroke="${c.paperBorder}" stroke-width="3"/>
<rect x="160" y="300" width="760" height="760" rx="28" fill="${c.root}"/>
${picture}
<text x="180" y="1170" font-family="${DISPLAY}" font-weight="700" font-size="${fit(s.name, 116, 16)}" fill="${c.ink}">${name}</text>
${species ? `<text x="180" y="1240" font-family="${DISPLAY}" font-style="italic" font-size="52" fill="${c.inkSoft}">${species}</text>` : ''}
<line x1="180" y1="1290" x2="900" y2="1290" stroke="${c.paperBorder}" stroke-width="3"/>
<text x="180" y="1370" font-family="${UI}" font-size="36" fill="${c.paperAccent}" letter-spacing="3">WITH ME</text>
<text x="180" y="1470" font-family="${DISPLAY}" font-weight="600" font-size="96" fill="${c.paperGreen}">${s.days} ${s.days === 1 ? 'day' : 'days'}</text>
<text x="560" y="1370" font-family="${UI}" font-size="36" fill="${c.paperAccent}" letter-spacing="3">WATERED</text>
<text x="560" y="1470" font-family="${DISPLAY}" font-weight="600" font-size="96" fill="${c.paperGreen}">${s.waters} ${s.waters === 1 ? 'time' : 'times'}</text>
${mark(205, 1590, 1.1, c.leafOnCream, c.leafOnCream, c.paperCard)}
${wordmark(300, 1610, 44, c.ink, 'start')}
${star(870, 1560, 3, c.bloom)}
</g>`,
  };
}

// The picture's own words, for the preview's alt text and for screen readers.
export function cardAlt(kind, s) {
  if (kind === 'day') return `Card: day ${s.days} with ${s.name}.`;
  if (kind === 'sticker') return `Transparent sticker for ${s.name}: day ${s.days}, ${s.waters} waterings, care on ${s.weekDays} of the last 7 days.`;
  if (kind === 'leaf') return `Card: ${s.name} grew a new leaf on day ${s.leafDay}.`;
  if (kind === 'week') return `Card: ${s.name} got care on ${s.weekDays} of the last 7 days, with ${s.waters} waterings so far.`;
  return `Plant card for ${s.name}${s.species ? `, ${s.species}` : ''}: with you ${s.days} days, watered ${s.waters} times.`;
}

// `fontCss` is an optional <style> body with the two brand fonts embedded (see loadFontCss); without it the card falls
// back to Georgia and Optima, which still reads well. `photo` is an optional data: URL for the plant card.
// `thumb` pads the sticker to a square so its small preview is not cut off.
export function buildCardSvg(kind, stats, { fontCss = '', photo = '', palette = readPalette(), thumb = false } = {}) {
  const { bg, body, crop } = cardBody(kind, stats, photo, palette);
  const [x, y, w, h] = thumb && kind === 'sticker' ? [90, 810, 900, 900] : (crop || [0, 0, CARD_W, CARD_H]);
  const style = fontCss ? `<defs><style>${fontCss}</style></defs>` : '';
  const ground = bg ? `<rect width="${CARD_W}" height="${CARD_H}" fill="${bg}"/>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x} ${y} ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${escapeXml(cardAlt(kind, stats))}">${style}${ground}${body}</svg>`;
}

export const cardSize = (kind) => (kind === 'sticker' ? { width: 900, height: 600 } : { width: CARD_W, height: CARD_H });

// --- Fonts: an SVG drawn as an image cannot see the page's fonts, so the two brand fonts are inlined as data. ---
let fontCssPromise = null;
const toDataUrl = (blob) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = () => reject(reader.error);
  reader.readAsDataURL(blob);
});

export function loadFontCss() {
  if (!fontCssPromise) {
    const href = 'https://fonts.googleapis.com/css2?family=Alegreya+Sans:wght@300;400&family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,600&display=swap';
    fontCssPromise = (async () => {
      const css = await (await fetch(href)).text();
      const out = [];
      for (const match of css.matchAll(/\/\*\s*latin\s*\*\/\s*@font-face\s*\{([^}]*)\}/g)) {
        const block = match[1];
        const url = (block.match(/url\((https:[^)]+)\)/) || [])[1];
        if (!url) continue;
        const data = await toDataUrl(await (await fetch(url)).blob());
        out.push(`@font-face{${block.replace(/src:[^;]+;/, `src:url(${data}) format('woff2');`).replace(/unicode-range:[^;]+;/, '')}}`);
      }
      return out.join('\n');
    })().catch(() => { fontCssPromise = null; return ''; });
  }
  return fontCssPromise;
}

// A same-origin or CORS-friendly photo as a data: URL, or '' when it cannot be read (the card then shows a leaf).
export async function photoDataUrl(url) {
  if (!url) return '';
  try {
    const res = await fetch(url);
    if (!res.ok) return '';
    return await toDataUrl(await res.blob());
  } catch {
    return '';
  }
}

export function svgToPngBlob(svg, { width, height }) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Could not make the picture'))), 'image/png');
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not make the picture')); };
    img.src = url;
  });
}

export const cardFileName = (stats, kind) => `${(stats.name || 'plant').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'plant'}-${kind}.png`;
