import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { useAuth } from '../contexts/AuthContext';
import { nookAPI } from '../lib/api';
import { lessonPath } from '../lessons/lessonMeta';
import NookCanvas from '../nook/NookCanvas';
import ReadinessPanel from '../nook/ReadinessPanel';
import { buildView } from '../nook/buildView';
import { pipMood } from '../nook/pipMood';
import { CONDITION_LABELS, PLANT_SOURCE, QUIET_LESSON, pipLine, unlockedItems } from '../nook/nookCopy';

// Pip's nook. The picture is for sighted users, so everything it shows is also written below it.
export default function NookPage() {
  const navigate = useNavigate();
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
    const res = await act(() => nookAPI.settings({ enabled: true }), 'Could not turn the nook on. Try again.');
    if (res && updateUser) updateUser(res.data);
  };

  const view = useMemo(() => {
    if (!state || !state.enabled) return null;
    const mood = pipMood({ hour: new Date().getHours(), quiet: state.quiet, celebrating: state.level_up });
    return buildView(state, mood);
  }, [state]);

  if (failed && !state) {
    return (
      <div>
        <PageHeader title="Pip's nook" />
        <div className="max-w-[640px] mx-auto px-4 py-4">
          <p role="alert" className="text-sm font-ui text-red-700 mb-2">
            Could not load the nook.
          </p>
          <button type="button" onClick={load} className="text-sm underline text-[#2D5016]" data-testid="nook-retry">
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!state) {
    return (
      <div>
        <PageHeader title="Pip's nook" />
        <p className="max-w-[640px] mx-auto px-4 py-4 text-sm font-ui text-[#2B2B26]">Loading…</p>
      </div>
    );
  }

  if (!state.enabled) {
    return (
      <div>
        <PageHeader title="Pip's nook" />
        <div className="max-w-[640px] mx-auto px-4 py-4">
          <section className="rounded-[14px] border-[0.5px] border-[#D3C9B8] bg-[#EDE5D8] p-4" data-testid="nook-off">
            <h2 className="font-plant text-[#1C2E10] text-lg mb-1">Pip&apos;s nook is off</h2>
            <p className="text-sm text-[#1A1A17] mb-3">A small pixel nook that grows as you learn. It never scores your plants.</p>
            {error && (
              <p role="alert" className="mb-2 text-xs font-ui text-red-700">
                {error}
              </p>
            )}
            <button
              type="button"
              onClick={turnOn}
              aria-busy={busy}
              className="rounded-[2px] font-plant uppercase tracking-[0.08em] text-xs px-4 py-3 border-[0.5px] bg-[#1C2E10] text-[#F5F0E8] border-[#1C2E10]"
              data-testid="nook-turn-on"
            >
              Turn on Pip&apos;s nook
            </button>
          </section>
        </div>
      </div>
    );
  }

  const items = unlockedItems(state.unlocked);
  const days = state.weekly_days;
  const choosePlant = (event) => act(() => nookAPI.settings({ hero_plant_id: event.target.value }), 'Could not change that. Try again.');

  return (
    <div>
      <PageHeader title="Pip's nook" />
      <div className="max-w-[640px] mx-auto px-4 py-4 space-y-4">
        <div className="rounded-[12px] bg-[#EDE5D8] p-2">
          <NookCanvas view={view} label={`Pip's nook, ${state.level_name.toLowerCase()}. Pip is on the ${state.pip.location}.`} />
        </div>

        <section className="rounded-[14px] border-[0.5px] border-[#D3C9B8] bg-[#FDFAF6] p-4" data-testid="nook-pip">
          <p className="text-[11px] font-ui uppercase tracking-[0.1em] text-[#2B2B26]">Pip says</p>
          <p className="text-base text-[#1A1A17]" data-testid="nook-pip-line">
            {pipLine(state)}
          </p>
          {state.quiet && (
            <button
              type="button"
              onClick={() => navigate(lessonPath(QUIET_LESSON))}
              className="mt-2 text-sm underline text-[#2D5016]"
              data-testid="nook-quiet-lesson"
            >
              Open the Plant ER lesson
            </button>
          )}
        </section>

        <section className="rounded-[14px] border-[0.5px] border-[#D3C9B8] bg-[#FDFAF6] p-4 space-y-1" data-testid="nook-summary">
          <h2 className="font-plant text-[#1C2E10] text-lg">Your nook: {state.level_name}</h2>
          <p className="text-sm text-[#1A1A17]" data-testid="nook-rhythm">
            You showed up on {days} {days === 1 ? 'day' : 'days'} this week.
          </p>
          <p className="text-sm text-[#1A1A17]" data-testid="nook-next">
            {state.next_unlock ? `Next: ${state.next_unlock}.` : 'Everything is unlocked.'}
          </p>
          <p className="text-sm text-[#1A1A17]" data-testid="nook-items">
            {items.length > 0 ? `In the nook: ${items.join(', ')}.` : 'Nothing is unlocked yet.'}
          </p>
        </section>

        {state.plants.length > 0 && (
          <section className="rounded-[14px] border-[0.5px] border-[#D3C9B8] bg-[#FDFAF6] p-4" data-testid="nook-plants">
            <h2 className="font-plant text-[#1C2E10] text-lg mb-2">Your plants</h2>
            {state.plants.length > 1 && (
              <label className="block text-xs font-ui text-[#2B2B26] mb-3">
                Plant on the table
                <select
                  value={state.hero ? state.hero.id : ''}
                  onChange={choosePlant}
                  className="mt-1 w-full rounded-[8px] border-[0.5px] border-[#D3C9B8] bg-[#F5F0E8] px-3 py-2 text-sm"
                  data-testid="nook-hero-select"
                >
                  {state.plants.map((plant) => (
                    <option key={plant.id} value={plant.id}>
                      {plant.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <ul className="space-y-2">
              {state.plants.map((plant) => (
                <li key={plant.id} className="flex items-center justify-between gap-3" data-testid={`nook-plant-${plant.id}`}>
                  <span>
                    <span className="block text-sm font-ui text-[#1A1A17]">{plant.name}</span>
                    <span className="block text-xs font-ui text-[#2B2B26]" data-testid={`nook-condition-${plant.id}`}>
                      {CONDITION_LABELS[plant.condition]}
                      {plant.looks_off ? ', marked as looking off' : ''}
                    </span>
                  </span>
                  <button
                    type="button"
                    aria-pressed={plant.looks_off}
                    onClick={() => act(() => nookAPI.looksOff(plant.id, !plant.looks_off), 'Could not save that. Try again.')}
                    className="rounded-[20px] border-[0.5px] border-[#D3C9B8] px-3 py-1 text-xs font-ui text-[#1A1A17] aria-pressed:bg-[#EAF3DE]"
                    data-testid={`nook-looks-off-${plant.id}`}
                  >
                    Looks off
                  </button>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs font-ui text-[#2B2B26]" data-testid="nook-source">
              {PLANT_SOURCE}
            </p>
          </section>
        )}

        {(!state.hero || state.readiness) && (
          <ReadinessPanel
            readiness={state.readiness}
            busy={busy}
            onStart={(speciesId) => act(() => nookAPI.startReadiness(speciesId), 'Could not save that. Try again.')}
            onStep={(stepId) => act(() => nookAPI.completeStep(stepId), 'Could not save that. Try again.')}
          />
        )}

        {error && (
          <p role="alert" className="text-xs font-ui text-red-700" data-testid="nook-error">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
