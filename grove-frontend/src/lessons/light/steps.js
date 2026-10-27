import React, { useEffect, useState } from 'react';
import ShadowTestStep from './ShadowTestStep';
import CurtainPair from './CurtainPair';
import WindowPickStep from './WindowPickStep';
import WindowRoomStep from './WindowRoomStep';
import FitsStep from './FitsStep';
import ClosingStep from './ClosingStep';
import StepNext from './StepNext';
import { nookAPI } from '../../lib/api';
import { readingLine } from './lightCopy';

// Maps a light-lesson card's `interactive` key to its step. Returns null for cards without one,
// so the player shows its normal next button.
// `ctx` is { user, updateUser, nookOn, window, setWindow, renderMarkDone }, where `window` is the
// window picked earlier in this visit and `renderMarkDone()` is the lesson's finish control.
// The room card needs the person's window. After a resume it was picked in an earlier visit,
// so it is read from the nook state, which carries it for everyone.
function RoomCard({ card, helpers, picked }) {
  const [saved, setSaved] = useState({ loaded: !!picked, window: picked || null });
  useEffect(() => {
    if (picked) return undefined;
    let alive = true;
    nookAPI
      .state()
      .then((res) => alive && setSaved({ loaded: true, window: res.data?.window || null }))
      .catch(() => alive && setSaved({ loaded: true, window: null }));
    return () => {
      alive = false;
    };
  }, [picked]);

  const window = picked || saved.window;
  if (!window && !saved.loaded) return null;
  return (
    <div className="space-y-3">
      {window ? (
        <WindowRoomStep window={window} />
      ) : (
        <p className="font-ui text-sm text-grove-ink" data-testid="room-none">
          Pick your window first and this will fill in.
        </p>
      )}
      <StepNext cta={card.cta} onClick={helpers.next} />
    </div>
  );
}

// "I'll check at noon" leaves a prompt on Care Today. Keep the signed-in user in step with that,
// unless the person already dismissed the prompt for good.
const markPending = (ctx) => () => {
  if (ctx.updateUser && !ctx.user?.light_prompt_dismissed) ctx.updateUser({ light_prompt_pending: true });
};

export function renderLightCard(card, helpers, ctx) {
  switch (card.interactive) {
    case 'shadow-test':
      return (
        <ShadowTestStep
          next={helpers.next}
          onSaved={(reading) => ctx.updateUser && ctx.updateUser({ light_reading: reading, light_prompt_pending: false })}
          onLater={markPending(ctx)}
        />
      );
    case 'reading-note': {
      const line = readingLine(ctx.user?.light_reading);
      return (
        <div className="space-y-3">
          {line && (
            <p className="font-ui text-sm text-grove-ink" data-testid="reading-note">
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
          <CurtainPair hemisphere={ctx.user?.hemisphere} />
          <StepNext cta={card.cta} onClick={helpers.next} />
        </div>
      );
    case 'window-pick':
      return (
        <WindowPickStep
          next={helpers.next}
          initialView={ctx.user?.window_view}
          initialHemisphere={ctx.user?.hemisphere}
          onLater={markPending(ctx)}
          onSaved={(summary) => {
            if (ctx.setWindow) ctx.setWindow(summary);
            if (ctx.updateUser) {
              ctx.updateUser({ window_sun: summary.sun, window_view: summary.view, hemisphere: summary.hemisphere, light_prompt_pending: false });
            }
          }}
        />
      );
    case 'window-room':
      return <RoomCard card={card} helpers={helpers} picked={ctx.window} />;
    case 'fits':
      return <FitsStep next={helpers.next} cta={card.cta} />;
    case 'closing':
      return <ClosingStep nookOn={!!ctx.nookOn} picked={ctx.window} markDone={ctx.renderMarkDone ? ctx.renderMarkDone() : null} />;
    default:
      return null;
  }
}
