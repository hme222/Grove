import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, X, BookOpen } from 'lucide-react';
import { triviaAPI } from '../lib/api';

/**
 * Phase 14C.4 — Daily plant trivia card on the Care/Today tab
 * (Supplement v1 Part D.7).
 *
 * Surfaces today's trivia card. The card is shared community-wide for the
 * day (deterministic deck rotation). Users can dismiss for the day —
 * tomorrow's card replaces it automatically at local midnight.
 *
 * Renders nothing if:
 *   - the user has dismissed today's card
 *   - the deck is empty (shouldn't happen post-seed)
 *   - the request errored
 */

const CATEGORY_LABELS = {
  care: 'Care tip',
  biology: 'Plant biology',
  native: 'Native plants',
  propagation: 'Propagation',
  light: 'Light science',
  pollinator: 'Pollinator fact',
};

export default function DailyTriviaCard({ embedded = false }) {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let alive = true;
    const tzOffset = -new Date().getTimezoneOffset();
    triviaAPI.today(tzOffset)
      .then((res) => {
        if (!alive) return;
        setData(res.data);
        if (res.data?.dismissed) setHidden(true);
      })
      .catch(() => { if (alive) setHidden(true); });
    return () => { alive = false; };
  }, []);

  if (hidden || !data?.card) return null;
  const card = data.card;
  const linked = card.linked_species;

  const handleDismiss = async () => {
    setHidden(true); // optimistic
    try {
      const tzOffset = -new Date().getTimezoneOffset();
      await triviaAPI.dismiss(tzOffset);
    } catch (e) {
      // non-fatal — card stays hidden locally
    }
  };

  const handleReadMore = () => {
    // The guide opens species by id; fall back to the guide's list.
    navigate(linked?.id ? `/greenhouse/${linked.id}` : '/greenhouse');
  };

  return (
    <article
      className={embedded ? 'relative py-4' : 'rounded-card border-hairline border-grove-fernLine/40 bg-grove-canopy p-5 mb-3 relative'}
      data-testid="daily-trivia-card"
      data-category={card.category}
    >
      <button
        type="button"
        onClick={handleDismiss}
        data-testid="daily-trivia-dismiss"
        aria-label="Dismiss for today"
        className={`absolute right-0 flex h-touch w-touch items-center justify-center rounded-tag text-grove-lichen hover:bg-grove-moss hover:text-grove-cream transition-colors duration-150 ${embedded ? 'top-1' : 'top-2'}`}
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-start gap-3">
        <span className="flex-shrink-0 w-9 h-9 rounded-full bg-grove-moss flex items-center justify-center mt-0.5">
          <Sparkles className="h-4 w-4 text-grove-sprout" />
        </span>
        <div className="flex-1 min-w-0 pr-6">
          <p className="font-ui text-xs font-medium text-grove-sprout mb-1">
            Daily {CATEGORY_LABELS[card.category] || 'plant fact'}
          </p>
          <h4
            className="font-ui text-sm font-medium text-grove-cream leading-snug mb-1"
            data-testid="daily-trivia-headline"
          >
            {card.headline}
          </h4>
          <p
            className="font-ui text-xs text-grove-cream leading-relaxed"
            data-testid="daily-trivia-body"
          >
            {card.body}
          </p>
          <button
            type="button"
            onClick={handleReadMore}
            data-testid="daily-trivia-read-more"
            className="mt-2 inline-flex items-center gap-1 font-ui text-xs font-medium text-grove-sprout hover:text-grove-sprout"
          >
            <BookOpen className="h-3 w-3" />
            {linked
              ? `Read more about ${linked.common_name || 'this species'}`
              : 'Read more in Learn'}
          </button>
        </div>
      </div>
    </article>
  );
}
