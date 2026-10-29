import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Sparkles, Check, X } from 'lucide-react';
import ThumbStrip from './ThumbStrip';

// --- Illustrated do/don't SVGs. Simple, stylized, on-brand. ---

function BaseFrame({ children, tint }) {
  return (
    <svg viewBox="0 0 100 100" width="80" height="80" role="img" aria-hidden="true">
      <rect x="0" y="0" width="100" height="100" rx="10" fill={tint} />
      {children}
    </svg>
  );
}

function LightBad() {
  return (
    <BaseFrame tint="var(--grove-cream)">
      <circle cx="75" cy="20" r="14" fill="var(--grove-sun)" />
      <g fill="var(--grove-sprout)" opacity="0.9">
        <path d="M50 78 C 38 60, 42 48, 48 40 C 56 45, 58 58, 55 72 Z" />
        <path d="M55 72 C 68 60, 72 48, 68 40 C 60 45, 58 58, 55 72 Z" />
      </g>
      <rect x="20" y="20" width="60" height="8" fill="var(--grove-cream)" opacity="0.7" />
    </BaseFrame>
  );
}

function LightGood() {
  return (
    <BaseFrame tint="var(--grove-cream)">
      <rect x="60" y="12" width="30" height="76" fill="var(--grove-cream)" opacity="0.55" />
      <g fill="var(--grove-lime)" opacity="0.95">
        <path d="M50 84 C 36 66, 40 48, 48 40 C 58 46, 60 60, 56 78 Z" />
        <path d="M56 78 C 70 62, 74 48, 70 40 C 60 46, 58 60, 56 78 Z" />
      </g>
      <rect x="38" y="80" width="28" height="8" fill="var(--grove-moss)" rx="1" />
    </BaseFrame>
  );
}

function CropBad() {
  return (
    <BaseFrame tint="var(--grove-cream)">
      <g fill="var(--grove-lime)" opacity="0.95">
        <path d="M50 120 L50 50" stroke="var(--grove-lime)" strokeWidth="3" />
        <path d="M50 90 C 28 70, 40 40, 54 40 C 64 60, 62 84, 50 90 Z" />
      </g>
    </BaseFrame>
  );
}

function CropGood() {
  return (
    <BaseFrame tint="var(--grove-cream)">
      <g opacity="0.95">
        <path d="M50 85 L50 35" stroke="var(--grove-lime)" strokeWidth="2" />
        <path d="M50 60 C 38 50, 42 40, 48 36 C 54 42, 56 52, 52 60 Z" fill="var(--grove-lime)" />
        <path d="M50 60 C 62 50, 58 40, 52 36 C 46 42, 44 52, 48 60 Z" fill="var(--grove-lime)" />
        <rect x="40" y="84" width="20" height="8" fill="var(--grove-moss)" rx="1" />
      </g>
    </BaseFrame>
  );
}

function BackgroundBad() {
  return (
    <BaseFrame tint="var(--grove-cream)">
      <rect x="6" y="6" width="14" height="14" fill="var(--grove-sage)" />
      <rect x="82" y="10" width="12" height="20" fill="var(--grove-sage)" />
      <rect x="12" y="70" width="28" height="8" fill="var(--grove-moss)" />
      <rect x="70" y="78" width="24" height="8" fill="var(--grove-sage)" />
      <g fill="var(--grove-lime)">
        <path d="M50 75 L50 40" stroke="var(--grove-lime)" strokeWidth="2" />
        <path d="M50 55 C 38 45, 42 36, 48 32 C 56 40, 56 52, 50 55 Z" />
      </g>
    </BaseFrame>
  );
}

function BackgroundGood() {
  return (
    <BaseFrame tint="var(--grove-cream)">
      <rect x="0" y="60" width="100" height="40" fill="var(--grove-cream)" />
      <g opacity="0.95">
        <path d="M50 80 L50 38" stroke="var(--grove-lime)" strokeWidth="2" />
        <path d="M50 60 C 36 48, 42 36, 48 30 C 58 38, 58 54, 52 60 Z" fill="var(--grove-lime)" />
        <rect x="42" y="80" width="18" height="6" fill="var(--grove-moss)" rx="1" />
      </g>
    </BaseFrame>
  );
}

function AngleBad() {
  return (
    <BaseFrame tint="var(--grove-cream)">
      <rect x="20" y="55" width="60" height="30" fill="var(--grove-moss)" />
      <ellipse cx="50" cy="55" rx="30" ry="5" fill="var(--grove-moss)" />
      <path d="M50 55 L50 20" stroke="var(--grove-lime)" strokeWidth="2" />
      <path d="M50 30 C 38 24, 42 16, 48 12 C 56 18, 56 26, 50 30 Z" fill="var(--grove-lime)" />
    </BaseFrame>
  );
}

function AngleGood() {
  return (
    <BaseFrame tint="var(--grove-cream)">
      <path d="M50 80 L50 30" stroke="var(--grove-lime)" strokeWidth="2" />
      <path d="M50 50 C 36 40, 42 28, 48 24 C 58 32, 58 48, 52 50 Z" fill="var(--grove-lime)" />
      <path d="M50 50 C 64 40, 58 28, 52 24 C 46 32, 46 48, 50 50 Z" fill="var(--grove-lime)" />
      <rect x="42" y="80" width="18" height="6" fill="var(--grove-moss)" rx="1" />
    </BaseFrame>
  );
}

function FocusBad() {
  return (
    <BaseFrame tint="var(--grove-cream)">
      <g filter="url(#blur)">
        <path d="M50 80 L50 32" stroke="var(--grove-lime)" strokeWidth="3" />
        <path d="M50 55 C 36 44, 42 32, 48 28 C 58 36, 58 52, 52 55 Z" fill="var(--grove-lime)" />
      </g>
      <defs>
        <filter id="blur"><feGaussianBlur stdDeviation="2.4" /></filter>
      </defs>
    </BaseFrame>
  );
}

function FocusGood() {
  return (
    <BaseFrame tint="var(--grove-cream)">
      <path d="M50 80 L50 32" stroke="var(--grove-lime)" strokeWidth="2" />
      <path d="M50 55 C 36 44, 42 32, 48 28 C 58 36, 58 52, 52 55 Z" fill="var(--grove-lime)" />
      <path d="M50 55 C 64 44, 58 32, 52 28 C 46 36, 46 52, 50 55 Z" fill="var(--grove-lime)" />
      <rect x="42" y="80" width="18" height="6" fill="var(--grove-moss)" rx="1" />
    </BaseFrame>
  );
}

function HeroShot() {
  return (
    <svg viewBox="0 0 180 100" width="170" height="95" aria-hidden="true">
      <rect x="0" y="0" width="180" height="100" rx="10" fill="var(--grove-cream)" />
      <rect x="0" y="58" width="180" height="42" fill="var(--grove-lichen)" opacity="0.5" />
      <path d="M90 82 L90 32" stroke="var(--grove-lime)" strokeWidth="2" />
      <path d="M90 60 C 70 48, 78 30, 86 24 C 100 34, 102 56, 94 62 Z" fill="var(--grove-lime)" />
      <path d="M90 60 C 110 48, 102 30, 94 24 C 80 34, 78 56, 88 62 Z" fill="var(--grove-lime)" />
      <rect x="78" y="82" width="24" height="10" fill="var(--grove-moss)" rx="1.5" />
      <circle cx="160" cy="22" r="6" fill="var(--grove-sun)" opacity="0.6" />
    </svg>
  );
}

const CARDS = [
  {
    title: 'Natural light is everything',
    body: "Shoot near a window but out of direct sunlight. Morning light is softest. Avoid flash — it washes out the green.",
    BadLabel: 'Harsh direct sun',
    GoodLabel: 'Soft indirect',
    Bad: LightBad, Good: LightGood,
  },
  {
    title: 'Show the whole plant',
    body: "Step back enough to include all leaves and the pot. Leave a little space around the edges. Don’t crop the top.",
    BadLabel: 'Cropped',
    GoodLabel: 'Full plant',
    Bad: CropBad, Good: CropGood,
  },
  {
    title: 'Keep the background simple',
    body: "Move the plant in front of a plain wall or backdrop. The plant should be the only thing in the frame.",
    BadLabel: 'Cluttered',
    GoodLabel: 'Clean wall',
    Bad: BackgroundBad, Good: BackgroundGood,
  },
  {
    title: 'Angle matters',
    body: "Shoot at the plant’s height or slightly above. Looking down at a 45° angle shows the full shape beautifully.",
    BadLabel: 'From below',
    GoodLabel: 'Eye level',
    Bad: AngleBad, Good: AngleGood,
  },
  {
    title: 'Keep it sharp',
    body: "Tap the plant on your screen to focus on it. Portrait mode or Live Focus blurs the background beautifully.",
    BadLabel: 'Blurry',
    GoodLabel: 'Sharp',
    Bad: FocusBad, Good: FocusGood,
  },
  {
    title: 'Make it theirs',
    body: "This photo will be the first entry in your plant’s story. Take a moment to make it a good one. You’ll be glad you did when you look back in a year.",
    hero: true,
  },
];

// One preview per card: the good example, or the hero shot on the last card.
const THUMBS = CARDS.map((c, i) => ({
  id: `guide-${i}`,
  node: c.hero ? <HeroShot /> : <c.Good />,
  label: `Show card ${i + 1} of ${CARDS.length}: ${c.title}`,
}));

export default function PhotoGuideCards({ defaultIndex = 0 }) {
  const [index, setIndex] = useState(defaultIndex);
  const scrollerRef = useRef(null);

  // Sync index -> scroll position
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const target = el.children[index];
    if (target && target.scrollIntoView) {
      target.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }, [index]);

  // Observe scroll to update index when user swipes
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const onScroll = () => {
      const w = el.clientWidth;
      const best = Math.round(el.scrollLeft / w);
      if (best !== index) setIndex(Math.max(0, Math.min(CARDS.length - 1, best)));
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="w-full" data-testid="photo-guide-cards">
      <div
        ref={scrollerRef}
        className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 no-scrollbar"
        style={{ scrollBehavior: 'smooth' }}
      >
        {CARDS.map((c, i) => (
          <article
            key={i}
            data-testid={`photo-guide-card-${i}`}
            className="snap-center shrink-0 w-full max-w-note rounded-control border-hairline border-grove-moss bg-grove-forest p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-grove-sprout" />
              <h4 className="font-ui text-xs font-medium text-grove-cream">{c.title}</h4>
            </div>

            {c.hero ? (
              <div className="rounded-chip overflow-hidden border-hairline border-grove-moss mb-2">
                <HeroShot />
              </div>
            ) : (
              <div className="flex items-center gap-3 mb-2">
                <figure className="flex-1 text-center">
                  <div className="relative inline-block">
                    <c.Bad />
                    <span className="absolute inset-0 rounded-chip bg-grove-bloom/15 pointer-events-none" />
                  </div>
                  <figcaption className="mt-1 font-latin text-xs inline-flex items-center gap-1 text-destructive">
                    <X className="h-3 w-3" aria-hidden="true" />{c.BadLabel}
                  </figcaption>
                </figure>
                <figure className="flex-1 text-center">
                  <div className="relative inline-block">
                    <c.Good />
                    <span className="absolute inset-0 rounded-chip bg-grove-lime/15 pointer-events-none" />
                  </div>
                  <figcaption className="mt-1 font-latin text-xs inline-flex items-center gap-1 text-grove-sprout">
                    <Check className="h-3 w-3" aria-hidden="true" />{c.GoodLabel}
                  </figcaption>
                </figure>
              </div>
            )}

            <p className="font-ui text-xs text-grove-sage leading-reading">{c.body}</p>
            <p className="font-latin text-xs text-grove-lichen mt-2">{i + 1} of {CARDS.length}</p>
          </article>
        ))}
      </div>

      {/* Thumbnail strip + arrows */}
      <div className="mt-1 flex items-center gap-1" data-testid="photo-guide-pagination">
        <button
          type="button"
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          aria-label="Previous card"
          data-testid="photo-guide-prev"
          disabled={index === 0}
          className="flex h-touch min-h-touch w-touch min-w-touch shrink-0 items-center justify-center rounded-pill border-hairline border-grove-moss bg-grove-forest text-grove-cream disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <ThumbStrip
          className="min-w-0 flex-1 no-scrollbar"
          testId="photo-guide-thumbs"
          label="Photo guide cards"
          items={THUMBS}
          activeIndex={index}
          onSelect={setIndex}
        />
        <button
          type="button"
          onClick={() => setIndex((i) => Math.min(CARDS.length - 1, i + 1))}
          aria-label="Next card"
          data-testid="photo-guide-next"
          disabled={index === CARDS.length - 1}
          className="flex h-touch min-h-touch w-touch min-w-touch shrink-0 items-center justify-center rounded-pill border-hairline border-grove-moss bg-grove-forest text-grove-cream disabled:opacity-40"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
