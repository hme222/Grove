// Draws the sales page from offer.mjs. Everything is built with textContent, so config values cannot inject markup.
import { OFFER, missingValues } from './offer.mjs';
import { buildPage } from './offer-copy.mjs';

const page = buildPage(OFFER);
const missing = missingValues(OFFER);
const soldOut = !!OFFER.SOLD_OUT;
const $ = (id) => document.getElementById(id);

function el(tag, props, ...kids) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v === undefined || v === null || v === false) continue;
    if (k === 'class') node.className = v;
    else node.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids.flat()) {
    if (kid === undefined || kid === null || kid === false || kid === '') continue;
    node.append(kid instanceof Node ? kid : document.createTextNode(kid));
  }
  return node;
}

// Real screenshots of the working build, in phone frames. Taken from the review demo (fixed fake data for one made-up
// owner), so they show the real screens and not a person's actual plants.
const SHOTS = [
  { src: '/img/today.webp', w: 390, h: 844, alt: 'The Today screen: one plant, Spider Plant, with a main button that reads Check the soil and a Watered button beside it.', caption: 'Today: what each plant needs, and the one next step.' },
  { src: '/img/plant.webp', w: 390, h: 844, alt: 'A plant page for Spider Plant with its status and a pet-safety label.', caption: 'Each plant has its own page.' },
  { src: '/img/learn.webp', w: 390, h: 844, alt: 'The Learn screen with short lessons and the plant guide.', caption: 'Short lessons and a plant guide.' },
];

// The buy button is a plain link to the Stripe-hosted payment link. With no link set it is a disabled button, never a dead link.
function buyButton(extra = '') {
  const label = page.hero.buyLabel;
  if (OFFER.STRIPE_PAYMENT_LINK) return el('a', { class: `buy ${extra}`.trim(), href: OFFER.STRIPE_PAYMENT_LINK, rel: 'noopener' }, label);
  return el('button', { class: `buy ${extra}`.trim(), type: 'button', disabled: true }, label);
}

function renderPill() {
  const t = $('pill-text');
  if (t) t.textContent = page.pill;
}

function renderHero() {
  const slot = $('hero-cta');
  if (!slot) return;
  slot.textContent = '';
  if (soldOut) {
    const block = $('waitlist-block');
    $('waitlist-heading').textContent = page.footer.soldOutWaitlistHeading;
    slot.append(block);
    const emptied = $('waitlist');
    if (emptied) emptied.remove();
    return;
  }
  const waitlistLink = el('a', { class: 'quiet-link', href: '#waitlist' }, page.hero.waitlistLinkLabel);
  waitlistLink.addEventListener('click', () => { setTimeout(() => { const i = $('wl-email'); if (i) i.focus({ preventScroll: true }); }, 350); });
  slot.append(
    buyButton('buy-hero'),
    el('p', { class: 'pay-line' }, page.hero.payLine),
    page.hero.spots ? el('p', { class: 'spots-line' }, page.hero.spots) : null,
    waitlistLink,
  );
}

const section = (id, ...kids) => el('section', { class: 'band', id }, el('div', { class: 'col' }, ...kids));
const list = (items, cls) => el('ul', { class: cls }, items.map((t) => el('li', null, t)));

function renderSections() {
  const root = $('sections');
  if (!root) return;
  root.textContent = '';
  const p = page;

  root.append(
    section('problem',
      el('h2', null, p.problem.heading),
      p.problem.paragraphs.map((t) => el('p', null, t)),
      el('figure', { class: 'stat' },
        el('p', { class: 'stat-main' }, p.problem.stat),
        el('figcaption', null, p.problem.statSource)),
      p.problem.quote ? el('blockquote', { class: 'quote' }, el('p', null, p.problem.quote), el('cite', null, p.problem.quoteSource)) : null),

    section('what', el('h2', null, p.what.heading), el('p', null, p.what.body)),

    section('inside',
      el('h2', null, p.inside.heading),
      p.inside.free ? el('div', { class: 'group' }, el('h3', null, p.inside.free.heading),
        el('ul', { class: 'features' }, p.inside.free.items.map((i) => el('li', null, el('strong', null, i.label), el('span', null, i.line))))) : null,
      p.inside.pro ? el('div', { class: 'group' }, el('h3', null, p.inside.pro.heading),
        el('ul', { class: 'features' }, p.inside.pro.items.map((i) => el('li', null, el('strong', null, i.label, ' ', el('span', { class: 'pro-badge' }, i.badge)), el('span', null, i.line))))) : null,
      p.inside.foundersLine ? el('p', { class: 'founders-line' }, p.inside.foundersLine) : null,
      el('div', { class: 'shots', tabindex: '0', role: 'region', 'aria-label': 'App screenshots' }, SHOTS.map((s) => el('figure', { class: 'shot' },
        el('div', { class: 'shot-frame' }, el('img', { src: s.src, width: s.w, height: s.h, alt: s.alt, loading: 'lazy', decoding: 'async' })),
        el('figcaption', null, s.caption))))),

    section('audience',
      el('h2', null, p.audience.heading),
      list(p.audience.for, 'plain'),
      el('h3', null, p.audience.notForHeading),
      list(p.audience.notFor, 'plain')),

    section('proof',
      el('h2', null, p.proof.heading),
      p.proof.paragraphs.map((t) => el('p', null, t)),
      p.proof.founderLine ? el('p', { class: 'founder-line' }, p.proof.founderLine) : null),

    el('section', { class: 'band band-offer', id: 'offer' }, el('div', { class: 'col' },
      el('div', { class: 'offer-card' },
        el('p', { class: 'offer-kicker' }, p.offer.name),
        el('p', { class: 'offer-price' }, p.offer.price, ' ', el('span', null, p.offer.priceNote)),
        el('h2', { class: 'offer-h' }, 'What you get'),
        list(p.offer.gets, 'gets'),
        p.offer.spots && !soldOut ? el('p', { class: 'spots-line' }, p.offer.spots) : null,
        el('p', null, p.offer.afterPay),
        el('p', { class: 'promise' }, p.offer.promise),
        el('p', null, p.offer.nameClause),
        soldOut ? null : buyButton('buy-card')))),

    el('section', { class: 'band', id: 'faq' }, el('div', { class: 'col' },
      el('h2', null, p.faqHeading),
      p.faq.map((f) => el('details', { class: 'qa' }, el('summary', null, f.q), el('p', null, f.a))))),
  );
}

function renderFooter() {
  const links = $('footer-links');
  if (links) {
    links.textContent = '';
    const items = [];
    if (OFFER.TERMS_URL) items.push(el('a', { href: OFFER.TERMS_URL, rel: 'noopener' }, 'Terms'));
    if (OFFER.PRIVACY_URL) items.push(el('a', { href: OFFER.PRIVACY_URL, rel: 'noopener' }, 'Privacy'));
    if (OFFER.CONTACT_EMAIL) items.push(el('a', { href: `mailto:${OFFER.CONTACT_EMAIL}` }, OFFER.CONTACT_EMAIL));
    items.forEach((a, i) => { if (i) links.append(' · '); links.append(a); });
  }
  const tag = $('footer-tagline');
  if (tag) tag.textContent = page.footer.tagline;
  if (!soldOut) $('waitlist-heading').textContent = page.footer.waitlistHeading;
}

// A fixed bar with the same button on phones, once the hero button has scrolled away. It steps aside for the FAQ and the footer form.
function renderSticky() {
  if (soldOut) return;
  const bar = el('div', { class: 'sticky', id: 'sticky', 'aria-hidden': 'true' }, buyButton('buy-sticky'));
  document.body.append(bar);
  const hero = document.querySelector('.buy-hero');
  const blockers = [$('faq'), $('waitlist')].filter(Boolean);
  if (!hero || !('IntersectionObserver' in window)) return;
  let pastHero = false;
  let blocked = 0;
  const update = () => {
    const show = pastHero && blocked === 0;
    bar.classList.toggle('on', show);
    bar.setAttribute('aria-hidden', show ? 'false' : 'true');
    bar.querySelectorAll('a,button').forEach((n) => { n.tabIndex = show ? 0 : -1; });
  };
  new IntersectionObserver(([e]) => { pastHero = !e.isIntersecting && e.boundingClientRect.top < 0; update(); }).observe(hero);
  const seen = new Set();
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) { if (e.isIntersecting) seen.add(e.target); else seen.delete(e.target); }
    blocked = seen.size; update();
  });
  blockers.forEach((b) => io.observe(b));
  update();
}

// While anything is missing the page says so, at the top, so a draft is never mistaken for a finished page.
function renderDraftBanner() {
  if (!missing.length) return;
  const banner = el('aside', { class: 'draft', id: 'draft-banner', role: 'status' },
    el('strong', null, `Draft: ${missing.length} value${missing.length === 1 ? ' is' : 's are'} missing from offer.mjs.`),
    ' ',
    missing.map((m) => m.key).join(', '),
    '. Run npm run check:offer. Do not publish until it passes.');
  document.body.prepend(banner);
}

renderPill();
renderHero();
renderSections();
renderFooter();
renderSticky();
renderDraftBanner();
