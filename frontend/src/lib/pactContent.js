// Phase 14C.3.a — Grove community pact content (Supplement v2 Part C, v1.0)
//
// IMPORTANT: This text is rendered VERBATIM in the verification flow and the
// read-only "Read community guidelines" view. Do not paraphrase, condense, or
// restructure. If the pact ever changes, bump PACT_VERSION here AND on the
// backend (CURRENT_PACT_VERSION), so existing verified users are required to
// re-verify against the new version before their next swap.

export const PACT_VERSION = '1.0';

export const WELCOME_COPY = {
  heading: 'Welcome to Grove swaps',
  body: [
    "Swaps are the heart of Grove's community. They're how plants travel between people who'll care for them — how a cutting from someone's living room becomes a thriving plant in yours, with a story attached.",
    'For swaps to work, the people doing them have to be real, honest, and committed to the plants and to each other. That\'s what verification is for.',
    "This will take about 3 minutes. Once you're verified, you can swap anytime.",
  ],
  cta: 'Continue',
};

export const IDENTITY_COPY = {
  heading: "Confirm it's you",
  intro: 'We just need a quick check that the account is real:',
  emailLabel: 'Email',
  emailDescription: 'confirm the email on your account is one you check',
  phoneLabel: 'Phone',
  phoneDescription:
    'adding a phone number makes it easier for swap partners to reach you. Never shared publicly.',
  phoneOptional: '(optional)',
};

export const PACT_INTRO = {
  heading: 'The Grove community pact',
  body: "Before your first swap, please read and agree to how we do things here. This isn't legal — it's how we keep the community good.",
};

export const PACT_SECTIONS = [
  {
    number: 1,
    title: 'The plant comes first',
    body: [
      "Every plant you swap is a living thing. Pack it carefully. Use proper materials for the season — heat packs in winter, ventilation in summer. If a plant isn't healthy enough to travel, don't send it. If a plant arrives stressed, contact the sender — most growers want to help it recover.",
    ],
    acknowledgement:
      "I understand I'm responsible for the wellbeing of any plant I send.",
  },
  {
    number: 2,
    title: 'Be honest about what you\'re sending',
    body: [
      'Show real photos taken in the last 7 days. Disclose any pests, diseases, or recent treatments. If a plant is a cutting rather than an established plant, say so. If you\'re not 100% certain of the species, say "I think it\'s…" rather than promising.',
    ],
    acknowledgement:
      "I'll be honest about what I'm offering — species, condition, and history.",
  },
  {
    number: 3,
    title: 'Respect the people',
    body: [
      "Swap partners are real humans, often putting time and trust into the exchange. Reply to messages within a few days. If you can't follow through, say so. Don't ghost. Don't pressure. Don't haggle on something agreed.",
    ],
    acknowledgement:
      "I'll communicate honestly and respect my swap partners' time.",
  },
  {
    number: 4,
    title: 'Ship and receive responsibly',
    body: [
      'Ship within 7 days of agreeing to a swap (sooner if weather demands it)',
      'Use tracking — both sides should know where the plant is',
      'Open and inspect promptly when you receive a plant; let the sender know it arrived',
      'Respect quarantine — keep new arrivals separate from your collection for 2+ weeks',
    ],
    bodyAsList: true,
    acknowledgement:
      "I'll ship promptly, track shipments, and quarantine new arrivals.",
  },
  {
    number: 5,
    title: "Don't cross legal lines",
    body: [
      "Some plants can't legally cross state, country, or continent lines — endangered species, agricultural pests, regulated cultivars. Know the rules for your region before swapping. Grove won't be a route for plants that shouldn't be moving.",
    ],
    acknowledgement:
      "I'll only swap plants that are legal to send and receive in my region.",
  },
  {
    number: 6,
    title: 'Knowledge is shared, not hoarded',
    body: [
      "If you've grown a tricky plant successfully, share what worked. If you've struggled, share what didn't. Grove gets better when growers help each other. The community benefits from your honesty more than from your perfection.",
    ],
    acknowledgement: "I'll share what I've learned to help others succeed.",
  },
  {
    number: 7,
    title: 'If something goes wrong',
    body: [
      "Plants die in transit sometimes. People miss messages. Misunderstandings happen. When they do, talk it through directly first. If you can't resolve it, contact Grove support — we'll help mediate. Don't take disagreements public unless something serious happened.",
    ],
    acknowledgement:
      "I'll handle disputes directly and constructively, with Grove's help if needed.",
  },
  {
    number: 8,
    title: "Grove's role",
    body: [
      "Grove facilitates connections; we don't broker the swap itself. We don't take a cut. We don't ship plants. We give you tools to find each other and a record of the swap. The trust between you and your swap partner is yours to build and protect.",
    ],
    acknowledgement:
      'I understand Grove provides the platform, not the plant or the shipping.',
  },
];

export const FINAL_COPY = {
  heading: 'One last thing',
  intro: 'By becoming a verified swapper, you\'re saying:',
  oath:
    "I'll be honest, treat plants and people with care, ship responsibly, share what I know, and help keep this community a place worth being part of.",
  outro:
    "Grove's mission is to honour the science and the soul of growing things. Swaps are how that mission travels between us.",
  ctaAgree: 'I agree — verify me',
  ctaDecline: 'Not yet',
};

export const SUCCESS_COPY = {
  heading: "You're verified",
  body:
    'Welcome to the swappers. The first swap is the most exciting one — go find something to grow.',
  badgeLabel: 'Badge earned',
  badgeName: 'Verified',
  cta: 'Browse swaps',
};
