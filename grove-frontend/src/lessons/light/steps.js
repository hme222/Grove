import React from 'react';
import ShadowTestStep from './ShadowTestStep';
import CurtainPair from './CurtainPair';
import StepNext from './StepNext';
import { readingLine } from './lightCopy';

// Maps a light-lesson card's `interactive` key to its step. Returns null for cards without one,
// so the player shows its normal next button. `ctx` is { user, updateUser, nookOn, finish }.
export function renderLightCard(card, helpers, ctx) {
  switch (card.interactive) {
    case 'shadow-test':
      return (
        <ShadowTestStep
          next={helpers.next}
          onSaved={(reading) => ctx.updateUser && ctx.updateUser({ light_reading: reading })}
        />
      );
    case 'reading-note': {
      const line = readingLine(ctx.user?.light_reading);
      return (
        <div className="space-y-3">
          {line && (
            <p className="text-sm font-ui text-[#1A1A17]" data-testid="reading-note">
              {line}
            </p>
          )}
          <StepNext cta={card.cta} onClick={helpers.next} />
        </div>
      );
    }
    case 'curtain':
      return (
        <div className="space-y-3">
          <CurtainPair />
          <StepNext cta={card.cta} onClick={helpers.next} />
        </div>
      );
    default:
      return null;
  }
}
