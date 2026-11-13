import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { careAPI } from '../../lib/api';
import { usePipPrefs } from '../../lib/pipPrefs';
import { useOtherThingOpen } from './useOtherThingOpen';
import { usePipForm } from '../../nook/usePipForm';
import PipPanel from '../../nook/PipPanel';
import { useHelpSheet } from './helpSheetContext';
import {
  pickPeek, dismissToday, dismissCount, bumpDismissCount, hasSeenFirstPeek, markFirstPeekSeen,
  askedToStop, markAskedToStop, bubbleShownToday, markBubbleShown,
} from '../../lib/pipNudges';
import { cn } from '../../lib/utils';
import { buttonVariants } from '../ui/button';

// Pip peeking in from the right edge when a plant is overdue. He states a schedule fact and offers the quick checks; he never
// says what is wrong. The bubble shows once a day per plant and then collapses to his head. "Not now" (or a swipe toward the
// edge) hides him for that plant until tomorrow. Only Pip and the bubble catch touches, so nothing else on the screen is affected.

const COLLAPSE_MS = 8000;
const REFETCH_MS = 60000;
const SWIPE_PX = 40;
export default function PipPeek() {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const { peeksOn, save } = usePipPrefs();
  const sheet = useHelpSheet();
  const pipForm = usePipForm(!!(user && user.nook_enabled));
  const otherOpen = useOtherThingOpen();

  const [plants, setPlants] = useState([]);
  const [pick, setPick] = useState(null);
  const [phase, setPhase] = useState('hidden'); // hidden | bubble | head | asking
  const [firstTime, setFirstTime] = useState(false);
  const [askError, setAskError] = useState(false);
  const fetchedAt = useRef(0);
  const swiped = useRef(false);
  const startX = useRef(null);
  const layer = useRef(null);

  // Ask for the due plants now and then (not on every tab change).
  useEffect(() => {
    if (!peeksOn) { setPick(null); setPhase('hidden'); return undefined; }
    let alive = true;
    const stale = Date.now() - fetchedAt.current > REFETCH_MS;
    const decide = (list) => {
      const next = pickPeek(list);
      setPick(next);
      if (!next) { setPhase('hidden'); return; }
      if (bubbleShownToday(next.plantId)) { setPhase('head'); return; }
      markBubbleShown(next.plantId);
      setFirstTime(!hasSeenFirstPeek());
      markFirstPeekSeen();
      setPhase('bubble');
    };
    if (!stale) { decide(plants); return undefined; }
    fetchedAt.current = Date.now();
    Promise.resolve(careAPI.getDueToday())
      .then((res) => {
        if (!alive) return;
        const list = Array.isArray(res && res.data) ? res.data : [];
        setPlants(list);
        decide(list);
      })
      .catch(() => { if (alive) { setPick(null); setPhase('hidden'); } });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, peeksOn]);

  // The bubble collapses to Pip's head after a few seconds, unless focus is inside it.
  useEffect(() => {
    if (phase !== 'bubble') return undefined;
    const timer = setTimeout(() => {
      if (layer.current && layer.current.contains(document.activeElement)) return;
      setPhase('head');
    }, COLLAPSE_MS);
    return () => clearTimeout(timer);
  }, [phase]);

  const notNow = useCallback(() => {
    if (!pick) return;
    dismissToday(pick.plantId);
    bumpDismissCount();
    if (dismissCount() >= 3 && !askedToStop()) { markAskedToStop(); setPhase('asking'); return; }
    setPhase('hidden');
  }, [pick]);

  const shown = !!(peeksOn && pick && phase !== 'hidden' && !otherOpen && pathname !== '/help-my-plant');

  // Sit just above the real tab bar, which grows with large text. The 72px token would let it cover the bubble.
  useEffect(() => {
    const nav = document.getElementById('main-nav');
    if (!shown || !nav || !layer.current) return undefined;
    const place = () => {
      if (layer.current) layer.current.style.setProperty('--pip-bottom', `${nav.getBoundingClientRect().height}px`);
    };
    place();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(place);
    observer.observe(nav);
    return () => observer.disconnect();
  }, [shown]);

  // Escape hides him when focus is on Pip or the bubble.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && layer.current && layer.current.contains(document.activeElement)) notNow();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [notNow]);

  if (!shown) return null;

  const openHelp = () => {
    if (swiped.current) { swiped.current = false; return; }
    setPhase('head');
    if (sheet) sheet.open();
  };
  const stopPeeks = async () => {
    setAskError(false);
    try { await save({ pip_peeks_enabled: false }); setPhase('hidden'); } catch { setAskError(true); }
  };
  const message = `${pick.name} is ${pick.days} ${pick.days === 1 ? 'day' : 'days'} overdue. Want a quick check?`;

  return (
    <div
      ref={layer}
      className="pip-layer pointer-events-none fixed inset-x-0 z-sticky flex flex-col items-end gap-2 px-3"
      data-testid="pip-peek"
    >
      {phase === 'bubble' && <p role="status" className="sr-only">Pip: {message}</p>}
      {(phase === 'bubble' || phase === 'asking') && (
        <div role="group" aria-label="Pip" className="pip-say pointer-events-auto w-4/5 max-w-dialog rounded-card bg-grove-cream font-ui text-sm text-grove-root" data-testid="pip-bubble">
          <div className="max-h-panel overflow-y-auto px-4 py-3">
          {phase === 'asking' ? (
            <>
              <p>Want me to stop popping in?</p>
              {askError && <p role="alert" className="mt-1 text-xs">Couldn’t save that. You can turn it off in Profile.</p>}
              <div className="mt-2 flex flex-wrap gap-2">
                <button type="button" onClick={stopPeeks} data-testid="pip-stop-yes" className={cn(buttonVariants(), 'min-h-touch')}>Yes</button>
                <button type="button" onClick={() => setPhase('hidden')} data-testid="pip-stop-no" className="min-h-touch px-3 underline underline-offset-4">No</button>
              </div>
            </>
          ) : (
            <>
              <p data-testid="pip-bubble-text">{message}</p>
              {firstTime && <p className="mt-1 text-xs" data-testid="pip-swipe-hint">Swipe me aside any time.</p>}
              <div className="mt-2 flex flex-wrap gap-2">
                <button type="button" onClick={openHelp} data-testid="pip-help" className={cn(buttonVariants(), 'min-h-touch')}>Help me check</button>
                <button type="button" onClick={notNow} data-testid="pip-not-now" className="min-h-touch px-3 underline underline-offset-4">Not now</button>
              </div>
            </>
          )}
          </div>
        </div>
      )}
      {/* Pip himself, standing on the tab bar. He walks in from the right with the bubble, then stays small. */}
      <button
        type="button"
        aria-label="Pip. Open help"
        data-testid="pip-head"
        onClick={openHelp}
        onPointerDown={(e) => { startX.current = e.clientX; swiped.current = false; }}
        onPointerUp={(e) => {
          if (startX.current !== null && e.clientX - startX.current > SWIPE_PX) { swiped.current = true; notNow(); }
          startX.current = null;
        }}
        className={cn('pointer-events-auto -mb-1 flex min-h-touch min-w-touch touch-pan-y items-end justify-center', phase === 'bubble' && 'pip-walk-in')}
      >
        <PipPanel form={pipForm} scale={phase === 'head' ? 3 : 4} label="" bare />
      </button>
    </div>
  );
}
