import { useEffect, useState } from 'react';
import { nookAPI } from '../lib/api';

// Pip's current form, so lessons can show him as he is now. Falls back to the seed form.
export function usePipForm(enabled) {
  const [form, setForm] = useState('seed');
  useEffect(() => {
    if (!enabled) return undefined;
    let alive = true;
    nookAPI
      .state()
      .then((res) => {
        if (alive) setForm(res.data?.pip?.form || 'seed');
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [enabled]);
  return form;
}
