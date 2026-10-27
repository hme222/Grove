#!/usr/bin/env node
// The token check. Fails when component source carries a design value that does not come from
// design/tokens.json: a raw hex colour, an rgb()/hsl() literal, a numeric inline-style size, a stock font family, a stock Tailwind palette colour, or a hand-typed radius,
// border width, text size, width or z-index. Generated files and tests are skipped (stories and CSS are scanned), and
// comments are stripped first so a hit is real drift.
//
// A literal that must stay is listed in scripts/token-exceptions.json with a reason and the
// condition that would retire it. An exception that no longer matches anything also fails, so
// the list cannot go stale.
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const srcDir = path.join(root, 'src');
const exceptions = JSON.parse(fs.readFileSync(path.join(__dirname, 'token-exceptions.json'), 'utf8'));

const tokens = JSON.parse(fs.readFileSync(path.join(root, '..', 'design', 'tokens.json'), 'utf8'));
const SPACE_PX = new Set([0, ...tokens.space]);
const ALPHA = new Set(tokens.alpha.map(String));

const SKIP = [/\.generated\./, /\.test\.jsx?$/];
const ASPECTS = new Set(Object.keys(tokens.aspectRatio));
const SMALL_STEP = (n) => parseFloat(n) * 4 < tokens.touchTarget.min;
const FILES = /\.(js|jsx|css)$/;

// Raw <img> in src/pages and src/components. PhotoBand is the one photo component (fixed token ratio, lazy
// loading, the moss tile on failure). A file may keep its raw <img> only if it is listed here with the exact
// number of tags and the reason; a count that no longer matches fails, so the list cannot go stale.
const RAW_IMG_ALLOWED = {
  'src/components/PhotoBand.jsx': { count: 1, reason: 'the photo component itself' },
  'src/components/ThumbStrip.jsx': { count: 1, reason: 'thumbnail strip: a tiny square with its own leaf fallback' },
  'src/components/PhotoViewer.jsx': { count: 1, reason: 'full-screen viewer: the photo keeps its natural size and ratio (object-contain), no fixed band' },
  'src/pages/FeedPage.js': { count: 1, reason: 'lightbox: the enlarged picture keeps its natural size (object-contain)' },
  'src/components/GroveChat.js': { count: 2, reason: 'chat attachments: a 40px composer preview and a message image at its natural ratio, up to max-h-72' },
  'src/components/PlantImage.js': { count: 1, reason: 'older tone-fallback image used by the collection tiles; retire by moving its callers to PhotoBand' },
  'src/components/WelcomeStage.js': { count: 1, reason: 'absolutely placed art in the welcome scene (not a content photo)' },
  'src/pages/SwapMatchesPage.js': { count: 1, reason: 'pending conversion to PhotoBand (file not in this pass)' },
  'src/pages/PublicBouquetPage.js': { count: 1, reason: 'pending conversion to PhotoBand (file not in this pass)' },
};

const RULES = [
  { id: 'hex', re: /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g, why: 'raw hex colour' },
  {
    id: 'stock-palette',
    re: /(?<![\w-])(?:bg|text|border|from|to|via|ring|fill|stroke|divide|placeholder|outline|decoration|accent|caret|shadow)-(?:white|black|gray|slate|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)(?:-\d{2,3})?(?![\w-])/g,
    why: 'stock Tailwind palette colour',
  },
  { id: 'arbitrary-radius', re: /rounded(?:-[trbl]{1,2})?-\[[^\]]+\]/g, why: 'hand-typed radius' },
  { id: 'arbitrary-text', re: /(?<![\w-])text-\[[^\]]+\]/g, why: 'hand-typed text size or colour' },
  { id: 'arbitrary-border', re: /(?<![\w-])border(?:-[trblxy])?-\[[^\]]+\]/g, why: 'hand-typed border width or colour' },
  { id: 'arbitrary-size', re: /(?<![\w-])(?:max-w|min-w|min-h|max-h)-\[[^\]]+\]/g, why: 'hand-typed size' },
  { id: 'arbitrary-z', re: /(?<![\w-])z-\[[^\]]+\]/g, why: 'hand-typed z-index' },
  { id: 'colour-function', re: /(?<![A-Za-z0-9-])(?:rgba?|hsla?)\(/g, why: 'rgb/rgba/hsl colour literal (use var(--grove-*) with tint() or color-mix)' },
  {
    id: 'arbitrary-spacing',
    re: /(?<![\w-])-?(?:w|h|top|left|right|bottom|inset(?:-[xy])?|p[trblxy]?|m[trblxy]?|gap(?:-[xy])?|size|basis|translate-[xy]|rotate|scale(?:-[xy])?|skew-[xy])-\[[^\]]+\]/g,
    why: 'hand-typed size or spacing',
  },
  {
    // Padding, margin, gap and space-x/y take only the steps in design/tokens.json `space` (step * 4 = px).
    id: 'off-scale-spacing',
    re: /(?<![\w-])-?(?:p[trblxyse]?|m[trblxyse]?|gap(?:-[xy])?|space-[xy])-(\d+(?:\.\d+)?)(?![\w.-])/g,
    filter: (m) => !SPACE_PX.has(parseFloat(m[1]) * 4),
    why: 'spacing step not in tokens.json space (use a listed step: 2 4 6 8 10 12 16 20 24 32 40 48 64 96 104 px)',
  },
  {
    id: 'inline-style-number',
    re: /(?<![\w-])(?:width|height|minWidth|minHeight|maxWidth|maxHeight|zIndex|fontSize|gap|margin(?:Top|Right|Bottom|Left)?|padding(?:Top|Right|Bottom|Left)?|borderRadius|borderWidth)\s*:\s*-?(?!0(?![\d.]))\d[\d.]*(?![\w%.])/g,
    jsOnly: true,
    within: /style=\{\{[\s\S]*?\}\}/g,
    why: 'numeric size in an inline style (use a token utility or var)',
  },
  {
    // Tinted colours use the steps in tokens.json `alpha` (15 25 40 80). Gradient stops and bg-grove-night photo scrims are exempt.
    id: 'off-scale-alpha',
    re: /(?<![\w-])(?:bg|text|border(?:-[trblxy])?|ring|divide|shadow|fill|stroke|outline|decoration|placeholder)-(?:grove-[A-Za-z]+|primary|secondary|destructive|muted|accent|background|foreground|card|popover|input|ring|border)(?:-foreground)?\/(\d+)(?![\w.])/g,
    filter: (m) => !ALPHA.has(m[1]) && !/^bg-grove-night\//.test(m[0]),
    why: 'colour opacity step not in tokens.json alpha (use /15 /25 /40 /80)',
  },
  { id: 'stock-shadow', re: /(?<![\w-])shadow-(?:sm|md|lg|xl|2xl|inner)(?![\w-])/g, why: 'stock Tailwind shadow (use shadow-rest|lift|dialog)' },
  { id: 'stock-z', re: /(?<![\w-])-?z-(?:0|10|20|30|40|50)(?![\w-])/g, why: 'stock z-index (use z-raised|sticky|nav|sheet|... from tokens)' },
  { id: 'arbitrary-effect', re: /(?<![\w-])backdrop-blur-\[[^\]]+\]/g, why: 'hand-typed blur' },
  {
    id: 'css-px',
    re: /(?<![\w(-])(?:font-size|border-radius|width|height|min-width|min-height|max-width|max-height)\s*:\s*[^;{}\n]*?\b\d*\.?\d+px/g,
    cssOnly: true,
    why: 'hand-typed px size in CSS (use a token variable)',
  },
  {
    id: 'style-px-string',
    re: /(?<![\w-])(?:fontSize|borderRadius|width|height|minWidth|minHeight|maxWidth|maxHeight)\s*:\s*['"`]\d*\.?\d+px/g,
    jsOnly: true,
    why: 'hand-typed px string in a style object (use a token variable)',
  },
  { id: 'stock-font', re: /(?<![\w-])font-(?:sans|mono|serif)(?![\w-])/g, why: 'stock font family (use font-ui, font-plant)' },
  { id: 'arbitrary-motion-type', re: /(?<![\w-])(?:animate|duration|leading|tracking|delay|ease)-\[[^\]]+\]/g, why: 'hand-typed motion or type value (add a token: animation, transitionDuration, lineHeight, letterSpacing)' },
  {
    id: 'control-size',
    re: /<(?:button|a|label|input|AppLink)\b[^<]{0,600}?className=(?:"[^"]*|\{`[^`]*|\{"[^"]*)(?<![\w-])(?:w|h)-1[12](?![\w-])/g,
    jsOnly: true,
    why: 'control sized with w-11/h-11 (use w-touch h-touch or min-h-touch min-w-touch)',
  },
  { id: 'bare-border-width', re: /(?<![\w:.-])(?:border|border-[trblxy]|divide-[xy])(?=[\s"'`]|$)(?![\w-])/g, jsOnly: true, why: 'bare border/divide/ring is 1px or 3px (use border-hairline, border-strong or divide-y-hairline)' },
  { id: 'stock-border-width', re: /(?<![\w:.-])(?:border(?:-[trblxy])?|divide-[xy])-(?:2|4|8)(?![\w-])/g, jsOnly: true, why: 'stock 2/4/8px border (use border-hairline, border-strong or border-accent)' },
  { id: 'border-px-string', re: /[`'"]\s*\d*\.?\d+px\s+(?:solid|dashed|dotted)\b/g, jsOnly: true, why: 'hand-typed border width (use the border-hairline / border-strong classes)' },
  { id: 'rounded-full', re: /(?<![\w-])rounded(?:-[trblse]{1,2})?-full(?![\w-])/g, why: 'rounded-full computes to 9999px: use rounded-pill (tokens.json radius.pill)' },
  {
    id: 'arbitrary-aspect',
    re: /(?<![\w-])aspect-(?:\[[^\]]+\]|video)(?![\w-])/g,
    why: `hand-typed aspect ratio (use aspect-${[...ASPECTS].join('|aspect-')} from tokens.json aspectRatio)`,
  },
  {
    // Stock Tailwind has its own aspect-square; it is only allowed while tokens.json aspectRatio defines `square`,
    // which makes the class token-backed (1 / 1). Dropping that token makes every aspect-square a hit again.
    id: 'stock-aspect-square',
    re: /(?<![\w-])aspect-(?:square|auto)(?![\w-])/g,
    filter: (m) => m[0] === 'aspect-auto' || !ASPECTS.has('square'),
    why: 'stock aspect class that is not a token (add it to tokens.json aspectRatio or use PhotoBand ratio)',
  },
  {
    id: 'raw-img',
    re: /<img\b/g,
    jsOnly: true,
    pathOnly: /^src\/(?:pages|components)\//,
    why: 'raw <img> (use PhotoBand; a tag that must stay is listed with a reason in RAW_IMG_ALLOWED in scripts/check-tokens.js)',
  },
  {
    // PhotoBand's ratio prop takes the token name. A literal such as "5 / 2" or "3/1" is a shape that is not in the system.
    id: 'photoband-ratio-literal',
    re: /<PhotoBand\b[^<]*?\bratio=(?:"([^"]*)"|\{\s*['"`]([^'"`]*)['"`]\s*\})/g,
    filter: (m) => !ASPECTS.has(m[1] !== undefined ? m[1] : m[2]),
    label: (m) => `ratio=${m[0].split('ratio=')[1]}`,
    jsOnly: true,
    why: `PhotoBand ratio must be a token name (${[...ASPECTS].join(', ')})`,
  },
  {
    // A button or link sized below the touch target by w-N/h-N/size-N (N * 4 < 44px). Put the hit area on the control
    // (w-touch h-touch, or min-h-touch min-w-touch) and draw the smaller visual on an inner span. sr-only and a class that
    // is overridden by w-touch/h-touch/min-w-touch/min-h-touch on the same axis are fine; svg and icon classes are not on the tag.
    id: 'sub-touch-control',
    re: /<(?:button|a|AppLink|Link|NavLink)\b[^<]{0,900}/g,
    jsOnly: true,
    filter: (m) => subTouch(m[0]).length > 0,
    label: (m) => `<${m[0].match(/^<\w+/)[0].slice(1)}> ${subTouch(m[0]).join(' ')}`,
    why: 'control below the 44px touch target (use w-touch h-touch or min-h-touch min-w-touch; keep a smaller visual on an inner span)',
  },
  { id: 'arbitrary-color-util', re: /(?<![\w-])(?:bg|fill|stroke|ring|from|to|via|shadow)-\[#[^\]]+\]/g, why: 'hand-typed colour' },
];


// Classes in a tag head's className (string literals after `className=`) that size a control below the touch target.
function subTouch(head) {
  const ci = head.indexOf('className=');
  if (ci < 0) return [];
  const cls = [...head.slice(ci).matchAll(/"([^"]*)"|'([^']*)'|`([^`]*)`/g)].map((x) => x[1] || x[2] || x[3] || '').join(' ');
  if (/(?<![\w-])sr-only(?![\w-])/.test(cls)) return [];
  const has = (re) => re.test(cls);
  const out = [];
  for (const x of cls.matchAll(/(?<![\w:.-])(w|h|size)-(\d+(?:\.\d+)?)(?![\w./-])/g)) {
    if (!SMALL_STEP(x[2])) continue;
    const axis = x[1];
    const covered = (axis === 'w' && has(/(?<![\w-])min-w-touch(?![\w-])/)) || (axis === 'h' && has(/(?<![\w-])min-h-touch(?![\w-])/));
    if (!covered) out.push(x[0]);
  }
  return out;
}

// Blanks comments but leaves string, template and attribute literals alone, so a `/*` inside
// accept="image/*" or a URL's `//` cannot open a fake comment and hide the rest of the file.
// Quotes close at a line end (a JSX apostrophe is text, not a string); templates span lines.
function strip(text, file) {
  const css = file.endsWith('.css');
  const out = text.split('');
  const blank = (from, to) => { for (let k = from; k < to; k++) if (out[k] !== '\n') out[k] = ' '; };
  let i = 0;
  const n = text.length;
  const templateDepth = []; // brace depth at which each open `${` returns to template text
  let depth = 0;
  const readTemplate = () => {
    // i is just after a backtick or just after the `}` that closes a `${`
    while (i < n) {
      const c = text[i];
      if (c === '\\') { i += 2; continue; }
      if (c === '`') { i++; return; }
      if (c === '$' && text[i + 1] === '{') { i += 2; templateDepth.push(depth); depth++; return; }
      i++;
    }
  };
  while (i < n) {
    const c = text[i];
    const d = text[i + 1];
    if (c === '/' && d === '*') {
      const end = text.indexOf('*/', i + 2);
      const stop = end < 0 ? n : end + 2;
      blank(i, stop); i = stop; continue;
    }
    if (!css && c === '/' && d === '/' && text[i - 1] !== ':') {
      let stop = text.indexOf('\n', i); if (stop < 0) stop = n;
      blank(i, stop); i = stop; continue;
    }
    if (c === '"' || c === "'") {
      i++;
      while (i < n && text[i] !== c && text[i] !== '\n') { if (text[i] === '\\') i++; i++; }
      i++; continue;
    }
    if (!css && c === '`') { i++; readTemplate(); continue; }
    if (!css && c === '{') { depth++; i++; continue; }
    if (!css && c === '}') {
      depth--; i++;
      if (templateDepth.length && templateDepth[templateDepth.length - 1] === depth) { templateDepth.pop(); readTemplate(); }
      continue;
    }
    i++;
  }
  return out.join('');
}

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) walk(p, out);
    else if (FILES.test(name) && !SKIP.some((r) => r.test(p))) out.push(p);
  }
  return out;
}

const used = new Set();
const usedImg = new Set();
const failures = [];
for (const file of walk(srcDir)) {
  const rel = path.relative(root, file);
  const text = strip(fs.readFileSync(file, 'utf8'), file);
  for (const rule of RULES) {
    if (rule.jsOnly && file.endsWith('.css')) continue;
    if (rule.cssOnly && !file.endsWith('.css')) continue;
    if (rule.pathOnly && !rule.pathOnly.test(rel.split(path.sep).join('/'))) continue;
    // Some rules only apply inside a part of the file (an inline style object).
    const hits = [];
    if (rule.within) {
      for (const scope of text.matchAll(rule.within)) {
        for (const m of scope[0].matchAll(rule.re)) if (!rule.filter || rule.filter(m)) hits.push({ 0: rule.label ? rule.label(m) : m[0], index: scope.index + m.index });
      }
    } else {
      for (const m of text.matchAll(rule.re)) if (!rule.filter || rule.filter(m)) hits.push({ 0: rule.label ? rule.label(m) : m[0], index: m.index });
    }
    if (rule.id === 'raw-img') {
      const key = rel.split(path.sep).join('/');
      const allowed = RAW_IMG_ALLOWED[key];
      if (allowed) {
        usedImg.add(key);
        if (hits.length === allowed.count) continue;
        failures.push(`${rel}: ${hits.length} raw <img> but RAW_IMG_ALLOWED lists ${allowed.count} (${allowed.reason}). Use PhotoBand or update the list.`);
        continue;
      }
    }
    for (const m of hits) {
      const line = text.slice(0, m.index).split('\n').length;
      // Values that are not design choices: library-provided sizes (--radix-*), inheritance, and safe-area math.
      if (/--radix|\[inherit\]|^[\w-]+-\[env\(safe-area-inset-[a-z]+\)\]$/.test(m[0])) continue;
      const ex = exceptions.findIndex((e) => e.file === rel && e.rule === rule.id && (e.match === '*' || e.match === m[0]));
      if (ex >= 0) { used.add(ex); continue; }
      failures.push(`${rel}:${line}  ${rule.why}: ${m[0]}`);
    }
  }
}
for (const k of Object.keys(RAW_IMG_ALLOWED)) if (!usedImg.has(k)) failures.push(`RAW_IMG_ALLOWED lists ${k} but it has no raw <img> any more. Remove it.`);
exceptions.forEach((e, i) => { if (!used.has(i)) failures.push(`scripts/token-exceptions.json: unused exception for ${e.file} (${e.rule} ${e.match}). Remove it.`); });
for (const e of exceptions) if (!e.reason || !e.retireWhen) failures.push(`scripts/token-exceptions.json: ${e.file} needs a reason and retireWhen`);

if (failures.length) {
  console.error(`Token check failed: ${failures.length} problem${failures.length === 1 ? '' : 's'}.\n` + failures.slice(0, 100000).join('\n') + '');
  process.exit(1);
}
console.log(`Token check passed. ${used.size} exception${used.size === 1 ? '' : 's'} in use.`);
