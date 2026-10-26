#!/usr/bin/env node
// Generates the app's token files from design/tokens.json, the single source of truth:
//   src/styles/tokens.generated.css   CSS variables (colours, radii, touch size, shadcn RGB triplets)
//   tailwind.tokens.js                the Tailwind theme extension (colours, radii, sizes, z-index)
// Run `npm run tokens`. `npm run check:tokens` fails if these files are out of date.
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const tokens = JSON.parse(fs.readFileSync(path.join(root, '..', 'design', 'tokens.json'), 'utf8'));

const kebab = (s) => s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();

// shadcn variables are exact space-separated RGB triplets, consumed as rgb(var(--x) / <alpha-value>), so a primitive
// renders the token hex and not a rounded approximation of it.
function hexToRgbTriplet(hex) {
  const n = parseInt(hex.slice(1), 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
}

function build() {
  const banner = '/* GENERATED from design/tokens.json by scripts/generate-tokens.js. Do not edit by hand. */';
  const vars = [];
  for (const [name, hex] of Object.entries(tokens.color)) vars.push(`  --grove-${kebab(name)}: ${hex};`);
  for (const [name, px] of Object.entries(tokens.radius)) vars.push(`  --radius-${kebab(name)}: ${px}px;`);
  for (const [name, width] of Object.entries(tokens.borderWidth)) vars.push(`  --border-${kebab(name)}-width: ${width};`);
  vars.push(`  --touch-min: ${tokens.touchTarget.min}px;`);
  vars.push(`  --touch-button: ${tokens.touchTarget.button}px;`);
  vars.push(`  --nav-height: ${tokens.navHeight};`);
  vars.push(`  --float-bar-height: ${tokens.floatBarHeight};`);
  vars.push(`  --font-ui: ${tokens.font.ui};`);
  vars.push(`  --font-display: ${tokens.font.display};`);
  for (const [name, size] of Object.entries(tokens.fontScale)) vars.push(`  --text-${kebab(name)}: ${size};`);
  for (const [name, [size]] of Object.entries(tokens.fontSize)) vars.push(`  --text-${kebab(name)}: ${size};`);
  for (const [name, value] of Object.entries(tokens.boxShadow)) vars.push(`  --shadow-${kebab(name)}: ${value};`);
  vars.push(`  --radius: ${tokens.radius.small}px;`);
  for (const [name, colorName] of Object.entries(tokens.shadcn)) vars.push(`  --${name}: ${hexToRgbTriplet(tokens.color[colorName])};`);
  const css = `${banner}\n:root {\n${vars.join('\n')}\n}\n`;

  const px = (n) => `${n}px`;
  const theme = {
    colors: { grove: tokens.color },
    borderRadius: Object.fromEntries(Object.entries(tokens.radius).map(([k, v]) => [k, v === 999 ? '9999px' : px(v)])),
    borderWidth: tokens.borderWidth,
    maxWidth: tokens.maxWidth,
    minHeight: { ...tokens.minHeight, nav: 'calc(var(--nav-height) + env(safe-area-inset-bottom))' },
    maxHeight: tokens.maxHeight,
    minWidth: tokens.minWidth,
    zIndex: tokens.zIndex,
    fontSize: tokens.fontSize,
    width: tokens.width,
    height: tokens.height,
    boxShadow: tokens.boxShadow,
    backgroundColor: tokens.backgroundColor,
    letterSpacing: tokens.letterSpacing,
    lineHeight: tokens.lineHeight,
    transitionDuration: tokens.transitionDuration,
    keyframes: tokens.keyframes,
    animation: tokens.animation,
    // The stock sans and mono stacks are the UI face, so a stray font-sans or font-mono cannot bring in another one.
    fontFamily: { sans: tokens.font.ui, mono: tokens.font.ui },
    // The tab bar is --nav-height tall plus the device's safe area. pb-nav clears it, h-nav sizes it, and
    // bottom-nav / bottom-nav-stack lift a floating bar above it (stack = above a second, session-bar row).
    // tokens.space (px) becomes the numeric steps (px / 4: 2 -> 0.5, 6 -> 1.5, 20 -> 5), so p-5 and gap-1.5 keep working
    // and check-tokens can reject a step that is not in the list.
    spacing: {
      ...Object.fromEntries(tokens.space.map((px) => [String(px / 4), `${px / 16}rem`])),
      nav: 'calc(var(--nav-height) + env(safe-area-inset-bottom))',
      'nav-stack': 'calc(var(--nav-height) + var(--float-bar-height) + env(safe-area-inset-bottom))',
      safe: 'env(safe-area-inset-bottom)',
    },
  };
  const js = `${banner.replace('/*', '//').replace(' */', '')}\nmodule.exports = ${JSON.stringify(theme, null, 2)};\n`;
  // Token utility names for tailwind-merge (src/lib/utils.js), so `rounded-small` can replace `rounded-card`.
  const names = { borderRadius: theme.borderRadius, borderWidth: theme.borderWidth, maxWidth: theme.maxWidth, maxHeight: theme.maxHeight, boxShadow: theme.boxShadow, zIndex: theme.zIndex };
  const namesJs = `${banner.replace('/*', '//').replace(' */', '')}\nexport const tokenNames = ${JSON.stringify(Object.fromEntries(Object.entries(names).map(([k, v]) => [k, Object.keys(v)])), null, 2)};\n`;
  return { css, js, namesJs };
}

const { css, js, namesJs } = build();
const outputs = [
  [path.join(root, 'src', 'styles', 'tokens.generated.css'), css],
  [path.join(root, 'tailwind.tokens.js'), js],
  [path.join(root, 'src', 'styles', 'tokens.generated.js'), namesJs],
];

if (process.argv.includes('--check')) {
  const stale = outputs.filter(([file, text]) => !fs.existsSync(file) || fs.readFileSync(file, 'utf8') !== text);
  if (stale.length) {
    console.error('Token files are out of date. Run `npm run tokens`:\n' + stale.map(([f]) => '  ' + path.relative(root, f)).join('\n'));
    process.exit(1);
  }
  console.log('Token files are up to date.');
} else {
  for (const [file, text] of outputs) fs.writeFileSync(file, text);
  console.log('Wrote ' + outputs.map(([f]) => path.relative(root, f)).join(', '));
}
