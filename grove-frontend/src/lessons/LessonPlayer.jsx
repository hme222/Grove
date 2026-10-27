import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import Disclosure from '../components/Disclosure';
import BackButton from '../components/BackButton';
import { cn } from '../lib/utils';
import { sanitizeLessonHtml } from '../lib/safeHtml';
import { buttonVariants } from '../components/ui/button';

const clampIndex = (value, count) => (Number.isInteger(value) ? Math.max(0, Math.min(value, count - 1)) : 0);

// Steps through a lesson's cards. The last card hands over to
// `renderFinalCard`, which holds the lesson's "your turn" action. Card text
// comes from Grove's own lesson files and may contain simple HTML.
//   initialIndex  the card to open on, for resuming
//   onAdvance     called with the new card number after the person moves
//   renderCard    (card, { next, back, index, isLast }) => node | null. A node replaces the
//                 card's next button (and the final-card hook on the last card).
//   host          shown above the card (Pip, for people who turned the nook on)
//   notice        a calm status line under the card (such as "Progress isn't saving right now")
export default function LessonPlayer({ cards, renderFinalCard, renderCard, onExit, sources, host, initialIndex, onAdvance, notice }) {
  const [index, setIndex] = useState(() => clampIndex(initialIndex, cards.length));
  const headingRef = useRef(null);
  const card = cards[index];
  const isLast = index === cards.length - 1;
  const Icon = card.icon;
  // The light lessons (the paper family) draw their cards and steps on paper; every other lesson stays dark forest.
  const paper = !!card.paper;

  const go = (target) => {
    const next = clampIndex(target, cards.length);
    if (next === index) return;
    setIndex(next);
    if (onAdvance) onAdvance(next);
  };
  const next = () => go(index + 1);
  const back = () => go(index - 1);
  const custom = renderCard ? renderCard(card, { next, back, index, isLast }) : null;
  const backButton = index > 0 && (
    <button
      type="button"
      onClick={back}
      className={cn(buttonVariants({ variant: 'outline' }), "flex gap-1")}
      data-testid="lesson-back"
    >
      <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back
    </button>
  );

  // Move focus to the new card's headline so keyboard and screen reader users land on it.
  useEffect(() => {
    if (headingRef.current) headingRef.current.focus();
  }, [index]);

  return (
    <div className="min-h-screen bg-grove-forest flex items-start justify-center px-4 pb-4" data-testid="lesson-player">
      <div className="w-full max-w-md">
        {/* Back and the card count stay in view on a long card (the window-map page is over 1100px tall). */}
        <div className="sticky top-0 z-sticky -mx-4 mb-4 flex items-center justify-between gap-2 bg-grove-forest px-4 py-3" data-testid="lesson-chrome">
          <BackButton onClick={onExit} where="lessons" testId="lesson-exit" />
          <p className="text-xs font-ui text-grove-cream" data-testid="lesson-progress">
            Card {index + 1} of {cards.length}
          </p>
        </div>

        {host && (
          <div className="mb-3" data-testid="lesson-host">
            {host}
          </div>
        )}

        <div className={paper ? `rounded-card border-hairline border-grove-paperBorder bg-gradient-to-br ${card.accent || ''} p-5` : `rounded-card border-hairline border-grove-moss bg-gradient-to-br ${card.accent || ''} bg-grove-canopy p-5`}>
          {Icon && <Icon className={`h-8 w-8 mb-4 ${card.ring || 'text-grove-sprout'}`} strokeWidth={1.75} aria-hidden="true" />}
          <p className={cn('mb-2 font-ui text-sm', paper ? 'text-grove-inkSoft' : 'text-grove-sage')}>{String(card.header || '').replace(/^Card \d+ of \d+ · /, '')}</p>
          <h1
            id="page-title"
            ref={headingRef}
            tabIndex={-1}
            className={cn('font-plant text-2xl mb-3 focus:outline-none', paper ? 'text-grove-root' : 'text-grove-cream')}
            data-testid="lesson-headline"
            dangerouslySetInnerHTML={{ __html: sanitizeLessonHtml(card.headline) }}
          />
          <p className={cn('text-sm leading-relaxed', paper ? 'text-grove-ink' : 'text-grove-cream')} dangerouslySetInnerHTML={{ __html: sanitizeLessonHtml(card.body) }} />
        </div>

        <div className="mt-4">
          {custom ? (
            <>
              {paper ? (
                <div className="rounded-card border-hairline border-grove-paperBorder bg-grove-paperCard p-5" data-testid="lesson-step-tile">
                  {custom}
                </div>
              ) : (
                custom
              )}
              {index > 0 && <div className="mt-2">{backButton}</div>}
            </>
          ) : isLast && renderFinalCard ? (
            renderFinalCard(card)
          ) : (
            <div className="flex gap-2">
              {backButton}
              <button
                type="button"
                onClick={next}
                className={cn(buttonVariants(), "flex-1 flex")}
                data-testid="lesson-next"
              >
                <span dangerouslySetInnerHTML={{ __html: sanitizeLessonHtml(card.cta || 'Next') }} />
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          )}
        </div>
        <p role="status" className={notice ? 'mt-3 font-ui text-sm text-grove-cream' : 'sr-only'} data-testid="lesson-notice">{notice}</p>
        {sources && (sources.sources?.length > 0 || sources.gaps?.length > 0) && (
          <Disclosure title="Sources for this lesson" testId="lesson-sources" className="mt-6">
            <ul className="space-y-3">
              {sources.sources.map((src) => (
                <li key={src.url} className="font-ui text-sm text-grove-sage">
                  <a
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-touch items-center text-grove-cream underline underline-offset-2"
                  >
                    {src.publisher}: {src.title}
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                  <p className="mt-0.5 leading-snug">{src.supports}</p>
                </li>
              ))}
            </ul>
            {sources.gaps?.map((g) => (
              <p key={g} className="mt-3 font-ui text-sm leading-snug text-grove-sage">{g}</p>
            ))}
          </Disclosure>
        )}
      </div>
    </div>
  );
}
