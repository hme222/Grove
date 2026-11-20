import test from 'node:test';
import assert from 'node:assert/strict';
import { OFFER, missingValues } from '../offer.mjs';
import { buildPage, spotsLine, allStrings, copyProblems, shownFeatures } from '../offer-copy.mjs';

const clone = (o) => JSON.parse(JSON.stringify(o));
const full = () => {
  const c = clone(OFFER);
  c.STRIPE_PAYMENT_LINK = 'https://buy.stripe.com/test_x';
  c.CONTACT_EMAIL = 'hello@example.com';
  c.TERMS_URL = '/terms';
  c.PRIVACY_URL = '/privacy';
  c.FEATURES.forEach((f) => { if (f.shipped === null) f.shipped = true; if (f.tier === null) f.tier = 'free'; });
  for (const k of Object.keys(c.FAQ)) c.FAQ[k] = k === 'renewalEmailDays' ? 30 : `Answer for ${k}.`;
  return c;
};
const text = (cfg) => allStrings(buildPage(cfg)).join('\n');

test('spots line: "Limited to" until half are gone, then the real count, hidden when sold out', () => {
  assert.equal(spotsLine({ ...OFFER, SPOTS_REMAINING: 100 }), 'Limited to the first 100 founding members.');
  assert.equal(spotsLine({ ...OFFER, SPOTS_REMAINING: 51 }), 'Limited to the first 100 founding members.');
  assert.equal(spotsLine({ ...OFFER, SPOTS_REMAINING: 50 }), '50 of 100 founding spots left.');
  assert.equal(spotsLine({ ...OFFER, SPOTS_REMAINING: 7 }), '7 of 100 founding spots left.');
  assert.equal(spotsLine({ ...OFFER, SOLD_OUT: true }), '');
});

test('the page never says "unlimited", has no trademark symbols, brackets or undefined, even with every value filled', () => {
  const t = text(full());
  assert.deepEqual(copyProblems(t), []);
});

test('the page is clean with the current draft config too', () => {
  assert.deepEqual(copyProblems(text(OFFER)), []);
});

test('only shipped features with a known tier appear', () => {
  const cfg = clone(OFFER);
  const names = [...shownFeatures(cfg, 'free'), ...shownFeatures(cfg, 'pro')].map((f) => f.id);
  assert.ok(!names.includes('reminders-why'), 'unknown shipped state is hidden');
  assert.ok(!names.includes('toxicity-badge'), 'a held-back feature is hidden');
  assert.ok(names.includes('photo-id') && names.includes('diagnosis'));
});

test('photo ID says plenty for everyday use and reads the allowance from config; diagnosis says Pro only', () => {
  const cfg = clone(OFFER);
  cfg.FREE_ID_ALLOWANCE = 5;
  const pro = buildPage(cfg).inside.pro.items;
  assert.match(pro.find((i) => i.label === 'Photo plant ID').line, /Plenty for everyday use\. Try 5 free\./);
  assert.match(pro.find((i) => i.label === 'Sick-plant diagnosis').line, /Pro only\./);
  assert.ok(!/\b3\b/.test(text(cfg).replace(/\$29\.99|\$39\.99|\b100\b|\b30\b|\b1\.7\b|\b37\b|\b12\b|\b5\b|2026|2027|\b1\b|\b15\b|\b24\b/g, '')), 'no stray hard-coded 3');
});

test('if no Pro feature shipped, Pro features vanish from the Pro group, offer card and FAQ', () => {
  const cfg = clone(OFFER);
  cfg.FEATURES.forEach((f) => { if (f.tier === 'pro') f.shipped = false; });
  const page = buildPage(cfg);
  assert.equal(page.inside.pro, null);
  assert.equal(page.inside.foundersLine, '');
  const t = text(cfg);
  assert.doesNotMatch(t, /photo plant ID|diagnosis|Included with Pro|Pro includes|including the Pro features|Is the AI accurate/i);
});

test('prices come only from config and no monthly or other prices appear', () => {
  const cfg = full();
  cfg.PRICE_USD = 31; cfg.PUBLIC_PRICE_USD = 41; cfg.LOYALTY_PRICE_USD = 33;
  const t = text(cfg);
  const prices = [...t.matchAll(/\$\d+(?:\.\d+)?/g)].map((m) => m[0]);
  assert.ok(prices.every((p) => ['$31.00', '$41.00', '$33.00'].includes(p)), prices.join(' '));
  assert.ok(!/month(ly)?\b.*\$|\$.*per month|\/mo/i.test(t));
});

test('dates in the hero, offer card and refund promise come from config', () => {
  const cfg = full();
  cfg.TESTFLIGHT_DATE = 'Dec 2, 2026'; cfg.APP_STORE_DATE = 'Dec 16, 2026'; cfg.REFUND_DEADLINE = 'Jan 16, 2027';
  const page = buildPage(cfg);
  assert.match(page.pill, /targeted Dec 16, 2026/);
  assert.match(page.hero.payLine, /Jan 16, 2027/);
  assert.match(page.offer.afterPay, /Dec 2, 2026/);
  assert.match(page.offer.afterPay, /targeted for Dec 16, 2026/);
  assert.match(page.offer.promise, /TestFlight by Dec 2, 2026 and on the App Store by Jan 16, 2027/);
});

test('the refund promise and the name-change clause are in the offer card', () => {
  const o = buildPage(full()).offer;
  assert.match(o.promise, /full refund/);
  assert.match(o.promise, /hello@example\.com/);
  assert.match(o.nameClause, /name changes/);
});

test('an empty founder line is hidden, never replaced', () => {
  assert.equal(buildPage(OFFER).proof.founderLine, '');
  const cfg = clone(OFFER); cfg.FOUNDER_LINE = 'I made this because I kept killing plants.';
  assert.equal(buildPage(cfg).proof.founderLine, 'I made this because I kept killing plants.');
});

test('FAQ answers that are not written are not shown', () => {
  const qs = buildPage(OFFER).faq.map((f) => f.q);
  assert.ok(!qs.includes('What about my pets?') && !qs.includes('Is it on Android?') && !qs.includes('Where does my data go?'));
  assert.ok(qs.includes('What’s free and what’s Pro?') && qs.includes('What happens after my year?') && qs.includes('What if you don’t ship?'));
  const filled = buildPage(full()).faq.map((f) => f.q);
  assert.ok(filled.includes('What about my pets?') && filled.includes('Who’s behind this?'));
});

test('missingValues lists every gap and is empty for a complete config', () => {
  const keys = missingValues(OFFER).map((m) => m.key);
  for (const k of ['STRIPE_PAYMENT_LINK', 'CONTACT_EMAIL', 'TERMS_URL', 'PRIVACY_URL', 'FEATURES.reminders-why.shipped', 'FAQ.pets']) {
    assert.ok(keys.includes(k), k);
  }
  // The pet-safety label is held back (not shipped), so it needs no tier yet.
  assert.ok(!keys.includes('FEATURES.toxicity-badge.tier'));
  assert.deepEqual(missingValues(full()), []);
});

test('a shipped feature with no tier is a gap, and is hidden until the tier is set', () => {
  const cfg = clone(OFFER);
  cfg.FEATURES.find((f) => f.id === 'toxicity-badge').shipped = true;
  assert.ok(missingValues(cfg).map((m) => m.key).includes('FEATURES.toxicity-badge.tier'));
  assert.ok(!shownFeatures(cfg, 'free').concat(shownFeatures(cfg, 'pro')).some((f) => f.id === 'toxicity-badge'));
});

test('sold out does not need a payment link', () => {
  const cfg = full(); cfg.SOLD_OUT = true; cfg.STRIPE_PAYMENT_LINK = null;
  assert.deepEqual(missingValues(cfg), []);
});
