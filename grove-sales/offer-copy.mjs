// Turns the config in offer.mjs into the words and structure of the sales page.
// Pure functions that return plain data, so the honesty rules can be tested without a browser.

export const usd = (n) => `$${Number(n).toFixed(2)}`;

// "Limited to the first N" until half the spots are gone, then the real count. Both are true; the first just avoids
// advertising an almost-empty counter early on. Hidden when sold out.
export function spotsLine(cfg) {
  if (cfg.SOLD_OUT) return '';
  const { SPOTS_TOTAL: total, SPOTS_REMAINING: left } = cfg;
  return left > total / 2
    ? `Limited to the first ${total} founding members.`
    : `${left} of ${total} founding spots left.`;
}

export const isShown = (f) => f.shipped === true && (f.tier === 'free' || f.tier === 'pro');
export const shownFeatures = (cfg, tier) => cfg.FEATURES.filter((f) => isShown(f) && f.tier === tier);

// One line per feature. The two AI features carry their limits in words; the allowance number comes from config only.
export function featureLine(cfg, f) {
  if (f.id === 'photo-id' && f.tier === 'pro') return `${f.description} Plenty for everyday use. Try ${cfg.FREE_ID_ALLOWANCE} free.`;
  if (f.id === 'diagnosis' && f.tier === 'pro') return `${f.description} Pro only.`;
  return f.description;
}

const list = (labels) => labels.join(', ');

export function buildPage(cfg) {
  const free = shownFeatures(cfg, 'free');
  const pro = shownFeatures(cfg, 'pro');
  const hasPro = pro.length > 0;
  const price = usd(cfg.PRICE_USD);
  const publicPrice = usd(cfg.PUBLIC_PRICE_USD);
  const loyaltyPrice = usd(cfg.LOYALTY_PRICE_USD);
  const photoId = pro.find((f) => f.id === 'photo-id');
  const diagnosis = pro.find((f) => f.id === 'diagnosis');
  const spots = spotsLine(cfg);
  const survey = cfg.SURVEY;

  const surveyFact = `We asked ${survey.totalRespondents} people about plant care. The ${survey.newOwners} who were new to it rated their confidence in keeping a plant alive at ${survey.meanConfidence} out of 5 on average.`;

  // Pro features named in the offer card: only shipped ones, so nothing unbuilt is promised.
  const proNames = [];
  if (photoId) proNames.push('photo plant ID, plenty for everyday use');
  if (diagnosis) proNames.push('sick-plant diagnosis');
  for (const f of pro) if (f.id !== 'photo-id' && f.id !== 'diagnosis') proNames.push(f.label.toLowerCase());

  const faq = [];
  {
    let a = '';
    if (free.length) a += `Free in the app: ${list(free.map((f) => f.label.toLowerCase()))}. `;
    if (hasPro) {
      a += `Included with Pro: ${list(pro.map((f) => f.label.toLowerCase()))}. `;
      if (photoId) a += `You get ${cfg.FREE_ID_ALLOWANCE} free photo plant IDs to try it; Pro gives you plenty for everyday use. `;
      if (cfg.FAQ.fairUseCap) a += `${cfg.FAQ.fairUseCap} `;
      a += 'Founding members get a year of Pro.';
    }
    faq.push({ q: 'What’s free and what’s Pro?', a: a.trim() });
  }
  {
    let a = `After your year, your membership renews at ${loyaltyPrice} a year, even when the public price is ${publicPrice} or higher, for as long as you keep it active. Your first renewal happens in the app, through the App Store, at the founder price. `;
    if (cfg.FAQ.renewalEmailDays) a += `We’ll email you ${cfg.FAQ.renewalEmailDays} days before it so there are no surprises. `;
    a += `If you cancel and rejoin more than ${cfg.LOYALTY_LAPSE_DAYS} days later, the public price applies.`;
    faq.push({ q: 'What happens after my year?', a });
  }
  if (cfg.FEATURES.find((f) => f.id === 'notification-cap' && isShown(f))) {
    faq.push({ q: 'Will it nag me?', a: 'No. Notifications default to one a day, with quiet hours you control.' });
  }
  if (hasPro) {
    faq.push({ q: 'Is the AI accurate?', a: 'It can be wrong. Treat a photo result as a good guess and check it against your plant before you act on it.' });
  }
  if (cfg.FAQ.pets) faq.push({ q: 'What about my pets?', a: cfg.FAQ.pets });
  if (cfg.FAQ.android) faq.push({ q: 'Is it on Android?', a: cfg.FAQ.android });
  if (cfg.FAQ.data) faq.push({ q: 'Where does my data go?', a: cfg.FAQ.data });
  faq.push({
    q: 'What if you don’t ship?',
    a: `You get a full refund. If FloraGrove isn’t in TestFlight by ${cfg.TESTFLIGHT_DATE} and on the App Store by ${cfg.REFUND_DEADLINE}, ${cfg.CONTACT_EMAIL ? `email ${cfg.CONTACT_EMAIL} and ` : ''}you get your money back.`,
  });
  if (cfg.FAQ.refundAfterLaunch) faq.push({ q: 'Can I get a refund after launch?', a: cfg.FAQ.refundAfterLaunch });
  if (cfg.FAQ.founderBio) faq.push({ q: 'Who’s behind this?', a: cfg.FAQ.founderBio });

  return {
    title: 'FloraGrove — plant care that explains itself',
    description: 'FloraGrove tells you what each plant needs today, and why. Become a founding member and get a year of Pro.',
    pill: `Coming to iPhone · targeted ${cfg.APP_STORE_DATE}`,

    hero: {
      buyLabel: `Become a founding member — ${price}`,
      payLine: `Pay once. Your year of Pro starts the day the app launches. Full refund if we miss ${cfg.REFUND_DEADLINE}.`,
      waitlistLinkLabel: 'Not ready? Get the launch email',
      spots,
    },
    soldOut: {
      heading: 'Founding spots are gone. Join the waitlist for launch.',
    },

    problem: {
      heading: 'You bought the plant. Now you’re guessing.',
      paragraphs: [
        'Water or wait? More light or less? Most plant apps give you a schedule and no reasons, then nag you until you delete them.',
      ],
      stat: `In our survey, ${survey.newOwners} new plant owners rated their confidence in keeping a plant alive at ${survey.meanConfidence} out of 5.`,
      statSource: `Survey of ${survey.totalRespondents} people, ${survey.year}. Small sample.`,
      quote: cfg.QUOTE ? `“…${cfg.QUOTE}”` : '',
      quoteSource: '— survey respondent',
    },

    what: {
      heading: 'What it is',
      body: 'FloraGrove is plant care that explains itself. It tells you what each plant needs today, and why, in plain language. No guessing, no nagging.',
    },

    inside: {
      heading: 'What’s inside',
      // A group with nothing shipped in it is null, so its heading cannot appear on its own.
      free: free.length ? { heading: 'Free in the app', items: free.map((f) => ({ label: f.label, line: featureLine(cfg, f) })) } : null,
      pro: hasPro ? { heading: 'Included with Pro', items: pro.map((f) => ({ label: f.label, line: featureLine(cfg, f), badge: 'Pro' })) } : null,
      foundersLine: hasPro ? 'Founding members get a full year of Pro.' : '',
    },

    audience: {
      heading: 'Who it’s for',
      for: ['New plant owners who want calm, explained guidance.', 'People who have lost a plant and want to stop.'],
      notForHeading: 'Not for (yet)',
      notFor: ['Collectors who want deep analytics.', 'Florists.', 'Anyone looking for a plant marketplace.'],
    },

    proof: {
      heading: 'What we have so far',
      paragraphs: [
        `FloraGrove is new, so there are no reviews to show yet. What we have is research: ${surveyFact} It is a small convenience sample, so read it as a signal, not a verdict.`,
      ],
      founderLine: cfg.FOUNDER_LINE || '',
    },

    offer: {
      name: cfg.OFFER_NAME,
      price,
      priceNote: 'paid once',
      gets: [
        `A full year of FloraGrove Pro, starting the day the app launches on the App Store, not the day you pay.${hasPro ? ` Pro includes ${list(proNames)}.` : ''}`,
        `Early beta access through TestFlight from ${cfg.TESTFLIGHT_DATE}${hasPro ? ', including the Pro features during the beta' : ''}.`,
        'A direct line to me for feedback.',
        `The founding price is ${price} for the first ${cfg.SPOTS_TOTAL} members only. When the spots are gone, or when the app launches on the App Store (whichever comes first), the price is ${publicPrice} a year.`,
        `Founding loyalty price: your membership renews at ${loyaltyPrice} a year, not the public price, for as long as your subscription stays active. If you cancel and come back after more than ${cfg.LOYALTY_LAPSE_DAYS} days, the public price applies.`,
      ],
      spots,
      afterPay: `You’ll get a receipt from Stripe right away. Your TestFlight invite arrives by ${cfg.TESTFLIGHT_DATE}, or within 24 hours if you join after that date. Your year of Pro starts when the app launches on the App Store, targeted for ${cfg.APP_STORE_DATE}.`,
      promise: `If FloraGrove isn’t in TestFlight by ${cfg.TESTFLIGHT_DATE} and on the App Store by ${cfg.REFUND_DEADLINE}, you get a full refund.${cfg.CONTACT_EMAIL ? ` Just email ${cfg.CONTACT_EMAIL}.` : ''}`,
      nameClause: 'If the app’s name changes before launch, your founding membership carries over.',
    },

    faqHeading: 'Questions',
    faq,

    footer: {
      waitlistHeading: 'Not ready to buy? Get the launch email.',
      soldOutWaitlistHeading: 'Founding spots are gone. Join the waitlist for launch.',
      tagline: 'FloraGrove · plant care that explains itself',
    },
  };
}

// Words and symbols the page must never contain. Used by the tests and by the check script.
export function copyProblems(text) {
  const problems = [];
  if (/unlimited/i.test(text)) problems.push('uses the word "unlimited"');
  if (/[™®]/.test(text)) problems.push('uses a trademark symbol');
  if (/\[[^\]]*\]/.test(text)) problems.push('has text in square brackets');
  if (/undefined|null|NaN/.test(text)) problems.push('prints undefined, null or NaN');
  return problems;
}

// Every string in a built page, flattened.
export function allStrings(value, out = []) {
  if (typeof value === 'string') out.push(value);
  else if (Array.isArray(value)) value.forEach((v) => allStrings(v, out));
  else if (value && typeof value === 'object') Object.values(value).forEach((v) => allStrings(v, out));
  return out;
}
