import React, { useRef, useState } from 'react';
import SwitchRow from './SwitchRow';
import { usePipPrefs } from '../lib/pipPrefs';

// The profile switches for Pip. "Pip" turns him off everywhere (the Help button stays, with a leaf in his place).
// The second switch is only his "need help?" visits, so someone can keep him in lessons and still stop the peeks.
export default function PipSettings() {
  const { pipOn, peeksPref, save } = usePipPrefs();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const busy = useRef(false);

  const change = async (patch) => {
    if (busy.current) return;
    busy.current = true;
    setSaving(true);
    setError('');
    try {
      await save(patch);
    } catch (_e) {
      setError('Couldn’t save that. Try again.');
    } finally {
      busy.current = false;
      setSaving(false);
    }
  };

  return (
    <div className="rounded-card border-hairline border-grove-moss bg-grove-moss p-5" data-testid="profile-pip">
      <h3 className="mb-2 font-plant text-base font-semibold text-grove-cream">Pip</h3>
      <SwitchRow
        label="Show Pip"
        help="Pip guides you around the app. Turn off to remove him everywhere. The Help button stays."
        checked={pipOn}
        disabled={saving}
        onChange={(next) => change({ pip_enabled: next })}
        testId="profile-pip-toggle"
      />
      <SwitchRow
        label="Pip peeks in when a plant is overdue"
        help={pipOn ? 'A short note offering quick checks. Once a day per plant at most.' : 'Turn Pip on to use this.'}
        checked={peeksPref}
        disabled={saving || !pipOn}
        onChange={(next) => change({ pip_peeks_enabled: next })}
        testId="profile-pip-peeks-toggle"
        className="mt-1"
      />
      {error && <p role="alert" className="mt-2 font-ui text-sm text-destructive" data-testid="profile-pip-error">{error}</p>}
    </div>
  );
}
