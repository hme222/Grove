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
  if (state && state.quiet) note = 'Pip is here when you want a quiet look at your plants.';
  else if (card) note = card.body;

  return (
    <section
      className={embedded ? 'flex flex-wrap gap-3 items-center py-4' : 'rounded-small border-hairline border-grove-paperBorder bg-grove-paperDeep px-4 py-3 flex flex-wrap gap-3 items-center'}
      data-testid="pip-note"
    >
      {view && (
        <button
          type="button"
          onClick={() => navigate('/nook')}
          className="min-h-touch max-w-full shrink-0 overflow-hidden rounded-inset"
          aria-label="Open Pip’s nook"
          data-testid="pip-note-thumb"
        >
          <NookCanvas view={view} animate={false} scale={1} className="max-w-full" label="A small picture of Pip’s nook" />
        </button>
      )}
      <div className="min-w-0 max-w-full flex-1 basis-40">
        <p className={`font-ui text-sm ${embedded ? 'text-grove-sage' : 'text-grove-inkSoft'}`}>Pip&rsquo;s note</p>
        {card && !(state && state.quiet) && (
          <p className={`font-plant text-base ${embedded ? 'text-grove-cream' : 'text-grove-root'}`} data-testid="pip-note-headline">{card.headline}</p>
        )}
        <p className={`text-sm ${embedded ? 'text-grove-cream' : 'text-grove-ink'}`} data-testid="pip-note-body">{note}</p>
      </div>
    </section>
  );
}
