import { useCallback, useEffect, useRef, useState } from 'react';

export const SAVE_ERROR = 'Couldn’t save that.';

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
    if (busyRef.current) return;
    busyRef.current = true;
    last.current = { apply, persist, revert };
    if (mounted.current) { setBusy(true); setError(''); }
    apply();
    try {
      await persist();
    } catch (_e) {
      revert();
      if (mounted.current) setError(SAVE_ERROR);
    } finally {
      busyRef.current = false;
      if (mounted.current) setBusy(false);
    }
  }, []);

  const retry = useCallback(() => {
    if (!last.current) return undefined;
    const { apply, persist, revert } = last.current;
    return run(apply, persist, revert);
  }, [run]);

  return { run, busy, error, retry };
}

export default useInstantSave;
