import React, { useEffect, useMemo, useState } from 'react';
import NookCanvas from '../../nook/NookCanvas';
import { buildView } from '../../nook/buildView';
import { windowSentence, directionName } from '../../nook/windowLight';
import { nookAPI } from '../../lib/api';
import { lessonView } from './lessonView';
import { canvasSupported, saveKeepsake } from './keepsake';

const PIP_LINE = "I'm Pip. I'm your guide, not a plant. I'll sit where your light is good.";

const keepsakeSentence = (window) =>
  window.lamp
    ? 'No window here, so a lamp lights the room.'
    : `Facing ${directionName(window.direction)}, in ${window.season}. ${window.arrives || ''}`.trim();

// Part 2, card 4. People who turned the nook on see their nook lit their way, with Pip's line.
// Everyone else gets a picture of the room to keep, with no Pip and no nudge toward the nook.
// `markDone` is the lesson's finish control, passed in by the lesson page.
export default function ClosingStep({ nookOn, picked, markDone }) {
  const [state, setState] = useState({ loaded: false, data: null });
  const [saveError, setSaveError] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!nookOn && picked) return undefined;
    let alive = true;
    nookAPI
      .state()
      .then((res) => alive && setState({ loaded: true, data: res.data }))
      .catch(() => alive && setState({ loaded: true, data: null }));
    return () => {
      alive = false;
    };
  }, [nookOn, picked]);

  const window = picked || state.data?.window || null;
  const nookView = useMemo(() => (nookOn && state.data ? buildView(state.data, 'calm') : null), [nookOn, state.data]);
  const roomView = useMemo(() => (window ? lessonView(window) : null), [window]);
  const waiting = !picked && !state.loaded;
  if (waiting) return null;

  const keep = () => {
    if (saved) return;
    const ok = saveKeepsake(window);
    setSaved(ok);
    setSaveError(!ok);
  };

  if (nookOn) {
    return (
      <div className="space-y-3" data-testid="closing-step">
        {nookView && (
          <div className="rounded-[12px] bg-[#EDE5D8] p-2">
            <NookCanvas view={nookView} label="Your nook, lit by your window." />
          </div>
        )}
        {window && (
          <p className="text-sm text-[#1A1A17]" data-testid="closing-text">
            {windowSentence(window)}
          </p>
        )}
        <p className="font-plant text-[#1C2E10] text-lg" data-testid="closing-pip-line">
          {PIP_LINE}
        </p>
        {markDone}
      </div>
    );
  }

  return (
    <div className="space-y-3" data-testid="closing-step">
      {window ? (
        <>
          <div className="rounded-[12px] bg-[#EDE5D8] p-2">
            <NookCanvas view={roomView} animate={false} label="My window light." />
          </div>
          <p className="text-sm text-[#1A1A17]" data-testid="keepsake-text">
            Roughly where the light falls. {keepsakeSentence(window)}
          </p>
          {canvasSupported() && (
            <button
              type="button"
              onClick={keep}
              className="w-full min-h-[44px] rounded-[2px] font-plant uppercase tracking-[0.08em] text-xs px-4 py-3 border-[0.5px] border-[#D3C9B8] text-[#1C2E10] hover:border-[#2D5016]"
              data-testid="keepsake-save"
            >
              Save as an image
            </button>
          )}
          {saveError && (
            <p role="alert" className="text-xs font-ui text-red-700" data-testid="keepsake-error">
              Could not save the picture on this device.
            </p>
          )}
        </>
      ) : (
        <p className="text-sm text-[#1A1A17]" data-testid="closing-none">
          You haven&apos;t picked a window yet. Pick one whenever you like.
        </p>
      )}
      {markDone}
    </div>
  );
}
