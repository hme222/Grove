import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { nookAPI, triviaAPI } from '../lib/api';
import NookCanvas from '../nook/NookCanvas';
import { buildView } from '../nook/buildView';
import { pipMood } from '../nook/pipMood';

// Care Today's daily note for people who turned the nook on. It shows today's trivia
// card (Grove's existing deck includes care tips) in Pip's slot, with a small picture
// of the nook that opens it. People without the nook keep the plain trivia card.
export default function PipNoteCard({ embedded = false }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const enabled = !!user?.nook_enabled;
  const [state, setState] = useState(null);
  const [trivia, setTrivia] = useState(null);

  useEffect(() => {
    if (!enabled) return undefined;
    let alive = true;
    const tzOffset = -new Date().getTimezoneOffset();
    nookAPI.state().then((res) => alive && setState(res.data)).catch(() => {});
    triviaAPI.today(tzOffset).then((res) => alive && setTrivia(res.data)).catch(() => {});
    return () => {
      alive = false;
    };
  }, [enabled]);

  const view = useMemo(() => {
    if (!state) return null;
    return buildView(state, pipMood({ hour: new Date().getHours(), quiet: state.quiet }));
  }, [state]);

  if (!enabled) return null;

  const card = trivia && !trivia.dismissed ? trivia.card : null;
  let note = 'Pip is here when you want a quiet moment with your plants.';
  if (state && state.quiet) note = 'Pip is keeping quiet. A plant of yours may need you.';
  else if (card) note = card.body;

  return (
    <section
      className={embedded ? 'flex gap-3 items-center py-4' : 'rounded-[14px] border-[0.5px] border-[#D3C9B8] bg-[#EDE5D8] p-3 flex gap-3 items-center'}
      data-testid="pip-note"
    >
      {view && (
        <button
          type="button"
          onClick={() => navigate('/nook')}
          className="shrink-0 rounded-[8px] overflow-hidden"
          aria-label="Open Pip's nook"
          data-testid="pip-note-thumb"
        >
          <NookCanvas view={view} animate={false} scale={1} label="A small picture of Pip's nook" />
        </button>
      )}
      <div>
        <p className={`text-[11px] font-ui uppercase tracking-[0.1em] ${embedded ? 'text-grove-sage' : 'text-[#2B2B26]'}`}>Pip&apos;s note</p>
        {card && !(state && state.quiet) && (
          <p className={`font-plant text-base ${embedded ? 'text-grove-cream' : 'text-[#1C2E10]'}`} data-testid="pip-note-headline">{card.headline}</p>
        )}
        <p className={`text-sm ${embedded ? 'text-grove-cream' : 'text-[#1A1A17]'}`} data-testid="pip-note-body">{note}</p>
      </div>
    </section>
  );
}
