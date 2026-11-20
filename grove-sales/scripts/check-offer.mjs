// Run before publishing: `npm run check:offer`. Exits 1 while anything is missing or breaks a page rule.
import { OFFER, missingValues } from '../offer.mjs';
import { buildPage, allStrings, copyProblems } from '../offer-copy.mjs';

const problems = [];
const missing = missingValues(OFFER);

const date = (s) => Date.parse(s);
if (!(date(OFFER.TESTFLIGHT_DATE) < date(OFFER.APP_STORE_DATE))) problems.push('APP_STORE_DATE must be after TESTFLIGHT_DATE');
if (!(date(OFFER.APP_STORE_DATE) < date(OFFER.REFUND_DEADLINE))) problems.push('REFUND_DEADLINE must be after APP_STORE_DATE');
if (!(OFFER.SPOTS_REMAINING >= 0 && OFFER.SPOTS_REMAINING <= OFFER.SPOTS_TOTAL)) problems.push('SPOTS_REMAINING must be between 0 and SPOTS_TOTAL');
if (!Number.isInteger(OFFER.FREE_ID_ALLOWANCE) || OFFER.FREE_ID_ALLOWANCE < 0) problems.push('FREE_ID_ALLOWANCE must be a whole number');
if (OFFER.STRIPE_PAYMENT_LINK && !/^https:\/\/buy\.stripe\.com\//.test(OFFER.STRIPE_PAYMENT_LINK)) problems.push('STRIPE_PAYMENT_LINK must be a https://buy.stripe.com/ link');

for (const text of allStrings(buildPage(OFFER))) {
  for (const p of copyProblems(text)) problems.push(`${p}: "${text.slice(0, 80)}"`);
}

if (missing.length) {
  console.log(`MISSING (${missing.length}):`);
  for (const m of missing) console.log(`  - ${m.key}: ${m.why}`);
}
if (problems.length) {
  console.log('PROBLEMS:');
  for (const p of problems) console.log(`  - ${p}`);
}
if (!missing.length && !problems.length) console.log('Offer config is complete and every page rule passes.');
console.log('Reminder: FREE_ID_ALLOWANCE must equal the FREE_ID_ALLOWANCE setting on the deployed server (default 3), and that server has to be deployed first.');
process.exit(missing.length || problems.length ? 1 : 0);
