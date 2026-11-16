import React, { useRef, useState } from 'react';
import SwitchRow from './SwitchRow';
import SaveError from './profile/SaveError';
import { usePipPrefs } from '../lib/pipPrefs';

// The profile switches for Pip. "Pip" turns him off everywhere (the Help button stays, with a leaf in his place).
// The second switch is only his "need help?" visits, so someone can keep him in lessons and still stop the peeks.
export default function PipSettings({ bare = false }) {
  const { pipOn, peeksPref, save } = usePipPrefs();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const busy = useRef(false);
  const lastPatch = useRef(null);
  const pipRef = useRef(null);
  const peeksRef = useRef(null);
  const focusRef = useRef(null);

  // Resolves true when the save went through, so SaveError can move focus back to the control.
  const change = async (patch, control) => {
    if (busy.current) return false;
    lastPatch.current = { patch, control };
    focusRef.current = control.current;
    busy.current = true;
    setSaving(true);
    setError('');
    try {
      await save(patch);
      return true;
    } catch (_e) {
      setError('Couldn’t save that.');
      return false;
    } finally {
      busy.current = false;
      setSaving(false);
    }
  };

  const retry = () => (lastPatch.current ? change(lastPatch.current.patch, lastPatch.current.control) : Promise.resolve(false));
  const describedBy = error ? 'profile-pip-error' : undefined;

  return (
    <div className={bare ? '' : 'rounded-card border-hairline border-grove-moss bg-grove-moss p-5'} data-testid="profile-pip">
      {!bare && <h3 className="mb-2 font-plant text-base font-semibold text-grove-cream">Pip</h3>}
      <SwitchRow
        label="Show Pip"
        help="Pip guides you around the app. Turn off to remove him everywhere. The Help button stays."
        checked={pipOn}
        disabled={saving}
        onChange={(next) => change({ pip_enabled: next }, pipRef)}
        describedBy={describedBy}
        buttonRef={pipRef}
        testId="profile-pip-toggle"
      />
      <SwitchRow
        label="Pip peeks in when a plant is overdue"
        help={pipOn ? 'A short note offering quick checks. Once a day per plant at most.' : 'Turn Pip on to use this.'}
        checked={peeksPref}
        disabled={saving || !pipOn}
        onChange={(next) => change({ pip_peeks_enabled: next }, peeksRef)}
        describedBy={describedBy}
        buttonRef={peeksRef}
        testId="profile-pip-peeks-toggle"
        className="mt-1"
      />
      <SaveError id="profile-pip-error" error={error} onRetry={retry} testId="profile-pip-error" focusAfter={focusRef} />
    </div>
  );
}
