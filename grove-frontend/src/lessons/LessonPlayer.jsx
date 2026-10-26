import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import BackButton from '../components/BackButton';
import { cn } from '../lib/utils';
import { buttonVariants } from '../components/ui/button';

// Steps through a lesson's cards. The last card hands over to
// `renderFinalCard`, which holds the lesson's "your turn" action. Card text
// comes from Grove's own lesson files and may contain simple HTML.
export default function LessonPlayer({ cards, renderFinalCard, onExit }) {
  const [index, setIndex] = useState(0);
  const headingRef = useRef(null);
  const card = cards[index];
  const isLast = index === cards.length - 1;
  const Icon = card.icon;

  // Move focus to the new card's headline so keyboard and screen reader users land on it.
  useEffect(() => {
    if (headingRef.current) headingRef.current.focus();
  }, [index]);

  return (
    <div className="min-h-screen bg-grove-forest flex items-start justify-center px-4 py-4" data-testid="lesson-player">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <BackButton onClick={onExit} where="lessons" testId="lesson-exit" />
          <p className="text-xs font-ui text-grove-cream" data-testid="lesson-progress">
            Card {index + 1} of {cards.length}
          </p>
        </div>

        <div className={`rounded-card border-hairline border-grove-moss bg-gradient-to-br ${card.accent || ''} bg-grove-canopy p-5`}>
          {Icon && <Icon className={`h-8 w-8 mb-4 ${card.ring || 'text-grove-sprout'}`} strokeWidth={1.75} aria-hidden="true" />}
          <p className="text-xs font-ui text-grove-cream mb-2">{String(card.header || '').replace(/^Card \d+ of \d+ · /, '')}</p>
          <h1
            id="page-title"
            ref={headingRef}
            tabIndex={-1}
            className="font-plant text-grove-cream text-2xl mb-3 focus:outline-none"
            data-testid="lesson-headline"
            dangerouslySetInnerHTML={{ __html: card.headline }}
          />
          <p className="text-sm leading-relaxed text-grove-cream" dangerouslySetInnerHTML={{ __html: card.body }} />
        </div>

        <div className="mt-4">
          {isLast && renderFinalCard ? (
            renderFinalCard(card)
          ) : (
            <div className="flex gap-2">
              {index > 0 && (
                <button
                  type="button"
                  onClick={() => setIndex((i) => i - 1)}
                  className={cn(buttonVariants({ variant: 'outline' }), "flex gap-1")}
                  data-testid="lesson-back"
                >
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back
                </button>
              )}
              <button
                type="button"
                onClick={() => setIndex((i) => Math.min(i + 1, cards.length - 1))}
                className={cn(buttonVariants(), "flex-1 flex")}
                data-testid="lesson-next"
              >
                <span dangerouslySetInnerHTML={{ __html: card.cta || 'Next' }} />
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
