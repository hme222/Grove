import React, { useRef } from 'react';
import SwitchRow from './SwitchRow';
import SaveError from './profile/SaveError';
import { useInstantSave } from './profile/useInstantSave';
import { usePipPrefs } from '../lib/pipPrefs';

// The profile switches for Pip. "Pip" turns him off everywhere (the Help button stays, with a leaf in his place).
// The second switch is only his "need help?" visits, so someone can keep him in lessons and still stop the peeks.
export default function PipSettings({ bare = false }) {
  const { pipOn, peeksPref, save } = usePipPrefs();
  const { run, busy: saving, error, retry } = useInstantSave();
  const pipRef = useRef(null);
  const peeksRef = useRef(null);
  const focusRef = useRef(null); // the switch that was changed, for SaveError to focus after a retry

  // save() updates the switches itself once it goes through, so there is nothing to apply or put back here.
  const change = (patch, control) => run(
    () => { focusRef.current = control.current; },
    () => save(patch),
    () => {},
  );

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
