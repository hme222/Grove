import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';

const clampIndex = (value, count) => (Number.isInteger(value) ? Math.max(0, Math.min(value, count - 1)) : 0);

// Steps through a lesson's cards. The last card hands over to
// `renderFinalCard`, which holds the lesson's "your turn" action. Card text
// comes from Grove's own lesson files and may contain simple HTML.
//   initialIndex  the card to open on, for resuming
//   onAdvance     called with the new card number after the person moves
//   renderCard    (card, { next, back, index, isLast }) => node | null. A node replaces the
//                 card's next button (and the final-card hook on the last card).
export default function LessonPlayer({ cards, renderFinalCard, renderCard, onExit, host, initialIndex, onAdvance }) {
  const [index, setIndex] = useState(() => clampIndex(initialIndex, cards.length));
  const headingRef = useRef(null);
  const card = cards[index];
  const isLast = index === cards.length - 1;
  const Icon = card.icon;

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
      className="flex items-center justify-center gap-1 rounded-[2px] font-plant uppercase tracking-[0.08em] text-xs px-4 py-3 border-[0.5px] border-[#D3C9B8] text-[#1C2E10] hover:border-[#2D5016]"
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
    <div className="min-h-screen bg-[#F5F0E8] flex items-center justify-center px-4 py-8" data-testid="lesson-player">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={onExit}
            className="text-xs font-ui text-[#2B2B26] underline underline-offset-2"
            data-testid="lesson-exit"
          >
            Back to lessons
          </button>
          <p className="text-xs font-ui text-[#2B2B26]" data-testid="lesson-progress">
            Card {index + 1} of {cards.length}
          </p>
        </div>

        {host && (
          <div className="mb-3" data-testid="lesson-host">
            {host}
          </div>
        )}

        <div className={`rounded-[14px] border-[0.5px] border-[#D3C9B8] bg-gradient-to-br ${card.accent || ''} bg-[#FDFAF6] p-6`}>
          {Icon && <Icon className={`h-8 w-8 mb-4 ${card.ring || 'text-[#3B6D11]'}`} strokeWidth={1.75} aria-hidden="true" />}
          <p className="text-[11px] font-ui uppercase tracking-[0.1em] text-[#2B2B26] mb-2">{card.header}</p>
          <h1
            ref={headingRef}
            tabIndex={-1}
            className="font-plant text-[#1C2E10] text-2xl mb-3 focus:outline-none"
            data-testid="lesson-headline"
            dangerouslySetInnerHTML={{ __html: card.headline }}
          />
          <p className="text-sm leading-relaxed text-[#1A1A17]" dangerouslySetInnerHTML={{ __html: card.body }} />
        </div>

        <div className="mt-4">
          {custom ? (
            <>
              {custom}
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
                className="flex-1 flex items-center justify-center gap-2 rounded-[2px] font-plant uppercase tracking-[0.08em] text-xs px-4 py-3 border-[0.5px] bg-[#1C2E10] text-[#F5F0E8] border-[#1C2E10] hover:bg-[#2D5016]"
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
