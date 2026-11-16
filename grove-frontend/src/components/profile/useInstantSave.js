import { useCallback, useEffect, useRef, useState } from 'react';

export const SAVE_ERROR = 'Couldn’t save that.';

// Usage:
//   const { run, error, retry } = useInstantSave();
//   run(() => setValue(next), () => userAPI.updateMe({ x: next }), () => setValue(old));
//   <SaveError id="x-error" error={error} onRetry={retry} focusAfter={controlRef} />
// retry() replays the FIRST closures passed to run(), so apply and revert must capture the specific old and new
// values (as above), never state read later at click time, or a retry can restore stale values.
// While error shows, set aria-describedby on the control to SaveError's id so screen readers hear it.
//
// Settings save the instant they change. run() applies the new value right away, persists it, and puts the old
// value back if the save fails, leaving an inline error with a retry. A second run while one is in flight is ignored.
export function useInstantSave() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const busyRef = useRef(false);
  const mounted = useRef(true);
  const last = useRef(null);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const run = useCallback(async (apply, persist, revert) => {
    if (busyRef.current) return false;
    busyRef.current = true;
    last.current = { apply, persist, revert };
    if (mounted.current) { setBusy(true); setError(''); }
    try {
      apply();
      await persist();
      return true;
    } catch (_e) {
      revert();
      if (mounted.current) setError(SAVE_ERROR);
      return false;
    } finally {
      busyRef.current = false;
      if (mounted.current) setBusy(false);
    }
  }, []);

  const retry = useCallback(() => {
    if (!last.current) return Promise.resolve(false);
    const { apply, persist, revert } = last.current;
    return run(apply, persist, revert);
  }, [run]);

  // Drops a shown error once it no longer applies (the person put the old value back by hand).
  const clear = useCallback(() => { last.current = null; if (mounted.current) setError(''); }, []);

  return { run, busy, error, retry, clear };
}

export default useInstantSave;
