import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { careAPI } from '../../lib/api';
import { usePipPrefs } from '../../lib/pipPrefs';
import { useFirstRunBlocking } from '../../lib/firstRunGate';
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
const FIELD = 'input, textarea, select, [contenteditable="true"]';

const fieldFocused = () => !!(document.activeElement && document.activeElement.matches && document.activeElement.matches(FIELD));
const dialogOpen = () => !!document.querySelector('[role="dialog"]');

// True while something else owns the screen: a dialog, a text field, or a first-run layer.
function useOtherThingOpen() {
  const gate = useFirstRunBlocking();
  const [other, setOther] = useState(false);
  useEffect(() => {
    const check = () => setOther(dialogOpen() || fieldFocused());
    check();
    document.addEventListener('focusin', check);
    document.addEventListener('focusout', check);
    const observer = new MutationObserver(check);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      document.removeEventListener('focusin', check);
      document.removeEventListener('focusout', check);
      observer.disconnect();
    };
  }, []);
  return gate || other;
}

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

  // Escape hides him when focus is on Pip or the bubble.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && layer.current && layer.current.contains(document.activeElement)) notNow();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [notNow]);

  if (!peeksOn || !pick || phase === 'hidden' || otherOpen || pathname === '/help-my-plant') return null;

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
      className="pointer-events-none fixed inset-x-0 bottom-nav z-sticky flex items-end justify-end gap-2 pb-4"
      data-testid="pip-peek"
    >
      {phase === 'bubble' && <p role="status" className="sr-only">Pip: {message}</p>}
      {(phase === 'bubble' || phase === 'asking') && (
        <div role="group" aria-label="Pip" className="pointer-events-auto w-3/5 rounded-card bg-grove-cream px-4 py-3 font-ui text-sm text-grove-root" data-testid="pip-bubble">
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
      )}
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
        className={cn('pointer-events-auto flex min-h-touch min-w-touch touch-pan-y translate-x-1/3 items-center rounded-l-card bg-grove-canopy pl-1', firstTime && phase === 'bubble' && 'pip-nudge')}
      >
        <PipPanel form={pipForm} scale={3} label="" />
        <ChevronRight className="h-4 w-4 text-grove-sprout" aria-hidden="true" />
      </button>
    </div>
  );
}
