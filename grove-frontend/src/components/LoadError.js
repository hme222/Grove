import React, { useEffect, useRef, useState } from 'react';
import { WifiOff } from 'lucide-react';
import { cn } from '../lib/utils';
import { buttonVariants } from './ui/button';
import { PageHeader } from './PageHeader';
import { Spinner } from './Loading';

// A system fault, said as one: we could not reach the server, nothing the person did caused it, and
// nothing is lost. Always paired with Retry. Never shown as an empty state, a zero, or "all caught up".
// `compact` is the inline version for a part of a screen that failed while the rest works: same words,
// same Try again, a smaller card. `note` adds one reassurance line ("The plant guide below still works.").
// Retry counts survive the card being unmounted and redrawn by a page's own reload, so a second
// failure can say "still".
const RETRIES = new Map();
const recent = (what) => { const r = RETRIES.get(what); return r && Date.now() - r.t < 60000 ? r.n : 0; };

export default function LoadError({ what = 'this page', onRetry, busy = false, compact = false, note, testId = 'load-error' }) {
  const doRetry = onRetry || (() => window.location.reload());
  const [trying, setTrying] = useState(false);
  const [attempts, setAttempts] = useState(() => recent(what));
  const alive = useRef(true);
  const box = useRef(null);
  const btn = useRef(null);
  useEffect(() => () => { alive.current = false; }, []);

  // Try again always answers: the button says it is trying (for at least half a second, so a quick
  // failure is still seen), and a repeat failure says so instead of looking like nothing happened.
  const retry = async () => {
    setTrying(true);
    await new Promise((r) => setTimeout(r, 700));
    RETRIES.set(what, { n: recent(what) + 1, t: Date.now() });
    try { await doRetry(); } finally {
      if (alive.current) {
        setTrying(false);
        setAttempts(recent(what));
        (btn.current || box.current)?.focus();
      }
    }
  };
  const offline = typeof navigator !== 'undefined' && navigator.onLine === false;
  const body = offline
    ? 'You appear to be offline. Reconnect, then try again.'
    : attempts > 0
      ? `Still can\u2019t reach FloraGrove (tried ${attempts + 1} times). Your plants are safe. Try again in a minute.`
      : 'We could not reach FloraGrove. Check your connection, then try again. If it keeps happening, it is on our side.';
  const status = (
    <span role="status" className="sr-only" data-testid="load-retry-status">
      {trying ? 'Trying again' : attempts > 0 ? `Still can\u2019t reach FloraGrove. Tried ${attempts + 1} times` : ''}
    </span>
  );
  const retryButton = (
    <button
      type="button"
      onClick={() => { if (!busy && !trying) retry(); }}
      aria-disabled={busy || trying}
      aria-busy={trying}
      ref={btn}
      data-testid="load-retry"
      className={cn(buttonVariants(), compact ? 'mt-3' : 'mt-5', 'aria-disabled:bg-grove-moss aria-disabled:text-grove-cream')}
    >
      {trying && <Spinner className="mr-2 h-4 w-4" />}
      {trying ? 'Trying again…' : 'Try again'}
    </button>
  );
  if (compact) {
    return (
      <div ref={box} tabIndex={-1} role="alert" aria-live="off" data-testid={testId} className="flex items-start gap-3 focus:outline-none rounded-card border-hairline border-grove-moss bg-grove-canopy px-4 py-3">
        <WifiOff className="mt-0.5 h-5 w-5 shrink-0 text-grove-sage" aria-hidden="true" />
        <div className="min-w-0">
          <h2 className="font-plant text-lg text-grove-cream">Couldn&rsquo;t load {what}</h2>
          <p className="mt-1 font-ui text-sm leading-relaxed text-grove-sage">
            {body}
            {note ? ` ${note}` : ''}
          </p>
          {retryButton}
          {status}
        </div>
      </div>
    );
  }
  return (
    <div ref={box} tabIndex={-1} role="alert" aria-live="off" data-testid={testId} className="mx-auto max-w-form focus:outline-none rounded-card border-hairline border-grove-moss bg-grove-canopy p-5 text-center">
      <WifiOff className="mx-auto h-8 w-8 text-grove-sage" aria-hidden="true" />
      <h2 className="mt-3 font-plant text-2xl text-grove-cream">Couldn&rsquo;t load {what}</h2>
      <p className="mt-2 font-ui text-sm leading-relaxed text-grove-sage">{body}</p>
      {retryButton}
      {status}
    </div>
  );
}

// The same thing as a whole screen, for pages that load before they can draw anything.
export function LoadErrorPage({ title, what, onRetry, back, headerExtra }) {
  return (
    <div className="pb-24">
      <PageHeader title={title} back={back}>{headerExtra}</PageHeader>
      <div className="mx-auto max-w-page px-4 py-6">
        <LoadError what={what || title.toLowerCase()} onRetry={onRetry} />
      </div>
    </div>
  );
}
