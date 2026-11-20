// The one place every price, date, count and link on the sales page comes from.
// No offer value is written in a component or in index.html.
//
// `null` means "not known yet". The page never invents a value: a missing value hides what depends on it and shows up
// in the draft banner and in `npm run check:offer`, which fails until nothing is missing. Do not publish while it fails.

export const OFFER = {
  OFFER_NAME: 'FloraGrove Founding Member',

  // Money. One-time founding price, the later public annual price, and the founder renewal price.
  PRICE_USD: 29.99,
  PUBLIC_PRICE_USD: 39.99,
  LOYALTY_PRICE_USD: 29.99,
  // If a founder cancels and returns after this many days, the public price applies. The app enforces it: the
  // founders-only product is shown only while founder status is active or lapsed this many days or fewer.
  LOYALTY_LAPSE_DAYS: 30,

  // Spots. The founding price closes when they sell out or at App Store launch, whichever comes first.
  SPOTS_TOTAL: 100,
  SPOTS_REMAINING: 100, // updated by hand, never auto-decremented, never faked
  SOLD_OUT: false, // flip by hand when the spots are gone or the day the app is live on the App Store

  // Links and contact.
  STRIPE_PAYMENT_LINK: null, // MISSING: the Stripe-hosted payment link (https://buy.stripe.com/...)
  CONTACT_EMAIL: null, // MISSING
  TERMS_URL: null, // MISSING
  PRIVACY_URL: null, // MISSING

  // Dates. TestFlight is the founder-confirmed delivery date; the App Store date is a TARGET and is worded as one.
  TESTFLIGHT_DATE: 'Dec 1, 2026',
  APP_STORE_DATE: 'Dec 15, 2026',
  REFUND_DEADLINE: 'Jan 15, 2027', // full refund if TestFlight or App Store delivery is missed

  // Hidden when empty. Never replaced with a made-up line.
  FOUNDER_LINE: '',

  // Lifetime free photo IDs per account. The page reads this number and nothing else; it must match the app's real limit.
  // The backend enforces it (grove-backend/entitlements.py, FREE_ID_ALLOWANCE, default 3) as of 2026-11-20, in code and tests only:
  // not deployed yet. Keep this number equal to the server's setting.
  FREE_ID_ALLOWANCE: 3,

  // Survey facts shown on the page. Recomputed from docs/research/data/grove-concept-survey-2026-anonymized.csv:
  // 12 respondents who described themselves as new to plant care answered "How confident do you feel keeping a plant
  // alive and healthy?" (1 to 5); mean 1.67. 37 people took the survey in total. Convenience sample.
  SURVEY: { newOwners: 12, meanConfidence: 1.7, totalRespondents: 37, year: 2026 },
  // A verbatim excerpt of one answer. The full answer reads "Helpe easily keep plants alive (eg when to water which
  // plant and how much. I'm very new!)"; the leading word is cut and nothing else is changed.
  QUOTE: "easily keep plants alive (eg when to water which plant and how much. I'm very new!)",

  // Features. The "What's inside" section shows only items with shipped: true. `tier` is "free" or "pro".
  // `shipped` and `tier` of null mean unknown: the item is hidden and counted as missing.
  FEATURES: [
    {
      id: 'photo-id',
      label: 'Photo plant ID',
      description: 'Take a photo and get the plant’s name and how to care for it.',
      tier: 'pro',
      shipped: true,
    },
    {
      id: 'diagnosis',
      label: 'Sick-plant diagnosis',
      description: 'Check a photo of a leaf that looks off, and see what it might be.',
      tier: 'pro',
      shipped: true,
    },
    {
      id: 'reminders-why',
      label: 'Reminders that explain why',
      description: 'A gentle nudge to check, with the reason, not just a schedule.',
      tier: 'free',
      shipped: null, // MISSING: confirm reminders work end to end
    },
    {
      id: 'care-toggle',
      label: 'Simple or detailed care guidance',
      description: 'Pick the short step, or add the reason behind it.',
      tier: 'free',
      shipped: true,
    },
    {
      id: 'notification-cap',
      label: 'One reminder a day, with quiet hours',
      description: 'A daily cap on notifications, and hours when the app stays quiet.',
      tier: 'free',
      shipped: true,
    },
    {
      id: 'toxicity-badge',
      label: 'Pet-safety label on every plant',
      description: 'Shows what the ASPCA lists for cats and dogs, when a listing is recorded.',
      tier: null, // MISSING: free or pro
      // Held back, so not shipped: pet-safety labels are off until the ASPCA gives written permission (its terms limit its
      // site to personal, non-commercial use; see grove-backend/species_safety.py, PET_SAFETY_LABELS). While they are off
      // every plant links to the ASPCA's list with no rating. Set to true only once the labels are switched on.
      shipped: false,
    },
  ],

  // FAQ answers that are not built from the values above. `null` means the answer is not written yet: the question is
  // hidden and the gap is listed. Write real answers here; do not paste placeholders.
  FAQ: {
    fairUseCap: null, // MISSING: the real Pro fair-use cap in plain words (the plan suggests about 30 scans a day, 300 a month; not decided)
    renewalEmailDays: null, // MISSING: how many days before the first renewal founders are emailed (the plan suggests 30)
    pets: null, // MISSING: what the pet-safety label does and does not promise
    android: null, // MISSING: Android plans
    data: null, // MISSING: where photos and account data go, from the real privacy policy
    refundAfterLaunch: null, // MISSING: the real refund policy after launch
    founderBio: null, // MISSING: one or two honest sentences from the founder
  },
};

// Where the draft banner and the check script look for gaps. Each entry says what is missing and why it matters.
export function missingValues(cfg = OFFER) {
  const out = [];
  const need = (key, why) => out.push({ key, why });
  if (!cfg.SOLD_OUT && !cfg.STRIPE_PAYMENT_LINK) need('STRIPE_PAYMENT_LINK', 'the buy button has nowhere to go');
  if (!cfg.CONTACT_EMAIL) need('CONTACT_EMAIL', 'the refund promise tells people to email it');
  if (!cfg.TERMS_URL) need('TERMS_URL', 'footer link');
  if (!cfg.PRIVACY_URL) need('PRIVACY_URL', 'footer link');
  for (const f of cfg.FEATURES) {
    if (f.shipped === null || f.shipped === undefined) need(`FEATURES.${f.id}.shipped`, 'unknown whether it works, so it is hidden');
    else if (f.shipped && (f.tier !== 'free' && f.tier !== 'pro')) need(`FEATURES.${f.id}.tier`, 'free or pro is not set, so it is hidden');
  }
  const faqWhy = {
    fairUseCap: 'the fair-use sentence is left out of the Free vs Pro answer',
    renewalEmailDays: 'the renewal-email sentence is left out of the after-your-year answer',
  };
  for (const [k, v] of Object.entries(cfg.FAQ)) {
    if (v === null || v === undefined || v === '') need(`FAQ.${k}`, faqWhy[k] || 'answer not written, so the question is hidden');
  }
  return out;
}
