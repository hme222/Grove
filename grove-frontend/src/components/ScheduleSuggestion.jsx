import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { plantAPI } from '@/lib/api';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { actionErrorMessage } from '@/lib/errors';

// A gentle "try this" under the watering schedule. It appears when the person's own soil checks (or, failing that, the
// room's light) point to a different number of days. Nothing changes until they tap Use it, and Not now hides that
// number until the schedule changes. The reason is always shown, so the number is never a bare command.
// Light-based suggestions are a rule of thumb with no recorded source yet, so the copy says "may", never "will".

export const HEADING_ID = 'watering-schedule-heading';

export default function ScheduleSuggestion({ plantId, days, onAccept }) {
  const [suggestion, setSuggestion] = useState(null);
  const [busy, setBusy] = useState(false);

  // Fetched again whenever the schedule changes, so a stale suggestion never lingers after an edit.
  useEffect(() => {
    let alive = true;
    setSuggestion(null);
    plantAPI.getScheduleSuggestion(plantId)
      .then((res) => { if (alive) setSuggestion(res.data?.suggestion || null); })
      .catch(() => { /* a suggestion is a bonus, so failing quietly is fine */ });
    return () => { alive = false; };
  }, [plantId, days]);

  if (!suggestion) return null;

  const done = () => {
    setSuggestion(null);
    // The card is gone, so put keyboard and screen reader focus back on the section it lived in.
    document.getElementById(HEADING_ID)?.focus();
  };

  const accept = async () => {
    setBusy(true);
    try {
      await onAccept(suggestion.days);
      done();
    } catch { /* onAccept already told the person */ } finally { setBusy(false); }
  };

  const dismiss = async () => {
    setBusy(true);
    try {
      await plantAPI.dismissScheduleSuggestion(plantId, suggestion.days);
      done();
    } catch (e) {
      toast.error(actionErrorMessage(e, 'save that'));
    } finally { setBusy(false); }
  };

  return (
    <section
      aria-labelledby="schedule-suggestion-title"
      data-testid="schedule-suggestion"
      className="mt-3 rounded-inset border-hairline border-grove-fernLine/40 bg-grove-canopy p-3"
    >
      <p id="schedule-suggestion-title" className="font-ui text-sm font-semibold text-grove-cream">
        Try every {suggestion.days} days?
      </p>
      <p className="mt-1 font-ui text-sm text-grove-cream" data-testid="schedule-suggestion-reason">
        {suggestion.reason} It is on {suggestion.current_days} days now.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={accept} disabled={busy} data-testid="schedule-suggestion-accept"
          className={cn(buttonVariants(), 'min-h-touch flex-1 basis-28')}>
          Use {suggestion.days} days
        </button>
        <button type="button" onClick={dismiss} disabled={busy} data-testid="schedule-suggestion-dismiss"
          className={cn(buttonVariants({ variant: 'outline' }), 'min-h-touch flex-1 basis-28')}>
          Not now
        </button>
      </div>
    </section>
  );
}
