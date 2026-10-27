import React, { useEffect, useRef, useState } from 'react';
import { Leaf } from 'lucide-react';
import { cn } from '../lib/utils';

// A row of small photo previews that stands in for pagination dots under a carousel of plants or
// photos. The current one is outlined and enlarged (never color alone), tapping one jumps to it, and
// the row scrolls sideways when it overflows, keeping the current preview in view.
// `variant` 'dark' is the forest app; 'paper' is Pip's nook (paperGreen outline, because lime fails
// contrast on paper). An item carries `src` (a photo) or `node` (an illustration); with neither, or
// when the photo fails, it shows the Leaf tile.

const VARIANTS = {
  dark: { tile: 'bg-grove-moss text-grove-sprout', current: 'outline-grove-lime', focus: 'focus-visible:ring-grove-cream' },
  paper: { tile: 'bg-grove-paperDeep text-grove-paperGreen', current: 'outline-grove-paperGreen', focus: 'focus-visible:ring-grove-ink' },
};
const SIZES = { md: 'scale-110', lg: 'scale-125' };

const reducedMotion = () => typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function Preview({ item, tileClass }) {
  const [failed, setFailed] = useState(false);
  if (item.node) {
    return <span className="block h-full w-full [&>svg]:h-full [&>svg]:w-full" aria-hidden="true">{item.node}</span>;
  }
  if (!item.src || failed) {
    return (
      <span className={cn('flex h-full w-full items-center justify-center', tileClass)} data-testid="thumb-fallback" aria-hidden="true">
        <Leaf className="h-4 w-4" />
      </span>
    );
  }
  return <img src={item.src} alt="" loading="lazy" onError={() => setFailed(true)} className="h-full w-full object-cover" />;
}

export default function ThumbStrip({ items, activeIndex = 0, onSelect, variant = 'dark', size = 'md', label = 'Choose an item', testId = 'thumb-strip', className }) {
  const stripRef = useRef(null);
  const v = VARIANTS[variant] || VARIANTS.dark;

  // Keep the current preview in view by moving the strip itself, never the page.
  useEffect(() => {
    const strip = stripRef.current;
    const thumb = strip && strip.children[activeIndex + 1];
    if (!thumb || typeof strip.scrollTo !== 'function') return;
    const left = thumb.offsetLeft - (strip.clientWidth - thumb.offsetWidth) / 2;
    strip.scrollTo({ left: Math.max(0, left), behavior: reducedMotion() ? 'auto' : 'smooth' });
  }, [activeIndex, items.length]);

  if (!items || items.length === 0) return null;
  return (
    <div
      ref={stripRef}
      role="group"
      aria-label={label}
      className={cn('flex items-center gap-2 overflow-x-auto px-2 py-2', className)}
      data-testid={testId}
    >
      <span className="sr-only" aria-live="polite">{activeIndex + 1} of {items.length}</span>
      {items.map((item, i) => {
        const current = i === activeIndex;
        return (
          <button
            key={item.id ?? i}
            type="button"
            aria-label={item.label}
            aria-current={current ? 'true' : undefined}
            onClick={() => onSelect && onSelect(i)}
            data-testid={`${testId}-thumb-${i}`}
            className={cn(
              'h-touch min-h-touch w-touch min-w-touch shrink-0 overflow-hidden rounded-chip focus-visible:outline-none focus-visible:ring-2 motion-safe:transition-transform',
              v.focus,
              current ? cn('outline outline-2 outline-offset-2', v.current, SIZES[size] || SIZES.md) : '',
            )}
          >
            <Preview item={item} tileClass={v.tile} />
          </button>
        );
      })}
    </div>
  );
}
