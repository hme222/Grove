import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import { LoadErrorPage } from '../components/LoadError';
import Loading from '../components/Loading';
import AppLink from '../components/AppLink';
import { useAuth } from '../contexts/AuthContext';
import { nookAPI } from '../lib/api';
import { lessonPath } from '../lessons/lessonMeta';
import NookCanvas from '../nook/NookCanvas';
import ReadinessPanel from '../nook/ReadinessPanel';
import PlantTiles from '../nook/PlantTiles';
import { PAPER_BUTTON, PAPER_ERROR, PAPER_FIELD, PAPER_LABEL, PAPER_LINK } from '../nook/paperStyles';
import { buildView } from '../nook/buildView';
import { windowSentence } from '../nook/windowLight';
import { pipMood } from '../nook/pipMood';
import { PLANT_SOURCE, QUIET_LESSON, pipLine, unlockedItems } from '../nook/nookCopy';

// Pip's nook. The room sits on a dark band at the top, Pip's note is a light speech bubble over its
// bottom edge, and the rest of the page is warm paper. The picture is for sighted users, so
// everything it shows is also written below it.
export default function NookPage() {
  const { updateUser } = useAuth();
  const [state, setState] = useState(null);
  const [failed, setFailed] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const seenSent = useRef(false);
  const working = useRef(false);

  const load = useCallback(async () => {
    try {
      const res = await nookAPI.state();
      setState(res.data);
      setFailed(false);
    } catch (_e) {
      setFailed(true);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Tell the server what was shown, so "your nook grew" appears once.
  useEffect(() => {
    if (state && state.enabled && (state.grew || state.level_up) && !seenSent.current) {
      seenSent.current = true;
      nookAPI.seen().catch(() => {});
    }
  }, [state]);

  const act = async (request, fallback) => {
    if (working.current) return;
    working.current = true;
    setBusy(true);
    setError('');
    try {
      const res = await request();
      if (res && res.data && res.data.level) setState(res.data);
      else await load();
      return res;
    } catch (_e) {
      setError(fallback);
      return undefined;
    } finally {
      working.current = false;
      setBusy(false);
    }
  };

  const turnOn = async () => {
    const res = await act(() => nookAPI.settings({ enabled: true }), 'Couldn’t turn the nook on. Try again.');
    if (res && updateUser) updateUser(res.data);
  };

  const view = useMemo(() => {
    if (!state || !state.enabled) return null;
    const mood = pipMood({ hour: new Date().getHours(), quiet: state.quiet, celebrating: state.level_up });
    return buildView(state, mood);
  }, [state]);

  if (failed && !state) {
    return <LoadErrorPage title="Pip’s nook" what="Pip’s nook" onRetry={load} />;
  }

  if (!state) {
    return (
      <div>
        <PageHeader title="Pip’s nook" />
        <Loading label="Loading Pip’s nook" />
      </div>
    );
  }

  if (!state.enabled) {
    return (
      <div>
        <PageHeader title="Pip’s nook" />
        <div className="mx-auto max-w-sheet px-4 py-4">
          <section className="rounded-card border-hairline border-grove-paperBorder bg-grove-paperDeep p-5" data-testid="nook-off">
            <h2 className="mb-1 font-plant text-base font-semibold text-grove-root">Pip&rsquo;s nook is off</h2>
            <p className="mb-3 font-ui text-sm text-grove-ink">A small pixel nook that grows as you learn. It never scores your plants.</p>
            {error && (
              <p role="alert" className={`mb-2 ${PAPER_ERROR}`}>
                {error}
              </p>
            )}
            <button type="button" onClick={turnOn} aria-busy={busy} className={PAPER_BUTTON} data-testid="nook-turn-on">
              Turn on Pip&rsquo;s nook
            </button>
          </section>
        </div>
      </div>
    );
  }

  const items = unlockedItems(state.unlocked);
  const choosePlant = (event) => act(() => nookAPI.settings({ hero_plant_id: event.target.value }), 'Couldn’t change that. Try again.');
  const toggleLooksOff = (plant) => act(() => nookAPI.looksOff(plant.id, !plant.looks_off), 'Couldn’t save that. Try again.');

  return (
    <div className="min-h-screen bg-grove-paper">
      <PageHeader title="Pip’s nook" />

      <div className="bg-grove-forest pb-2 pt-2">
        <div className="mx-auto max-w-sheet">
          <NookCanvas view={view} label={`Pip’s nook, ${state.level_name.toLowerCase()}. Pip is on the ${state.pip.location}.`} />
        </div>
      </div>

      <div className="mx-auto max-w-sheet px-4 pb-6">
        <section
          aria-label="Pip’s note"
          className="relative z-raised -mt-10 rounded-card border-hairline border-grove-paperBorder bg-grove-paperCard p-5 shadow-lift"
          data-testid="nook-pip"
        >
          <span aria-hidden="true" className="absolute -top-1.5 left-8 h-3 w-3 rotate-45 border-l-hairline border-t-hairline border-grove-paperBorder bg-grove-paperCard" />
          <p className={PAPER_LABEL}>Pip’s note</p>
          <p className="font-ui text-base text-grove-ink" data-testid="nook-pip-line">
            {pipLine(state)}
          </p>
          {state.quiet && (
            <AppLink to={lessonPath(QUIET_LESSON)} className={`mt-1 ${PAPER_LINK}`} data-testid="nook-quiet-lesson">
              Open the Plant ER lesson
            </AppLink>
          )}
        </section>

        <section className="mt-5 space-y-1 border-b-hairline border-grove-paperBorder pb-5" data-testid="nook-summary">
          <h2 className="font-plant text-xl text-grove-root">
            <span className="sr-only">Your nook: </span>
            {state.level_name}
          </h2>
          <p className="font-ui text-sm text-grove-ink" data-testid="nook-next">
            {state.next_unlock ? `Next in your nook: ${state.next_unlock}.` : 'Everything is unlocked.'}
          </p>
          {state.window && (
            <p className="font-ui text-sm text-grove-inkSoft" data-testid="nook-window">
              {windowSentence(state.window)}
            </p>
          )}
          <p className="font-ui text-sm text-grove-inkSoft" data-testid="nook-items">
            {items.length > 0 ? `In the nook: ${items.join(', ')}.` : 'Nothing is unlocked yet.'}
          </p>
        </section>

        {state.plants.length > 0 && (
          <section className="pt-5" data-testid="nook-plants">
            <div className="mb-3 flex items-baseline justify-between gap-3">
              <h2 className="font-plant text-xl text-grove-root">Your plants</h2>
              {state.plants.length > 1 && <span className="font-ui text-sm text-grove-inkSoft">Swipe</span>}
            </div>
            {state.plants.length > 1 && (
              <label className={`mb-3 block ${PAPER_LABEL}`}>
                Plant on the table
                <select value={state.hero ? state.hero.id : ''} onChange={choosePlant} className={`${PAPER_FIELD} normal-case tracking-normal`} data-testid="nook-hero-select">
                  {state.plants.map((plant) => (
                    <option key={plant.id} value={plant.id}>
                      {plant.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <PlantTiles plants={state.plants} onToggleLooksOff={toggleLooksOff} />
            <p className="mt-2 font-ui text-sm text-grove-inkSoft" data-testid="nook-source">
              {PLANT_SOURCE}
            </p>
          </section>
        )}

        {(!state.hero || state.readiness) && (
          <div className="mt-5">
            <ReadinessPanel
              readiness={state.readiness}
              busy={busy}
              onStart={(speciesId) => act(() => nookAPI.startReadiness(speciesId), 'Couldn’t save that. Try again.')}
              onStep={(stepId) => act(() => nookAPI.completeStep(stepId), 'Couldn’t save that. Try again.')}
            />
          </div>
        )}

        {error && (
          <p role="alert" className={`mt-3 ${PAPER_ERROR}`} data-testid="nook-error">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
