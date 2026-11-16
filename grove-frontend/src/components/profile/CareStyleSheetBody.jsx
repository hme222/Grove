import React, { useRef, useState } from 'react';
import CareTextToggle from '../CareTextToggle';
import SwitchRow from '../SwitchRow';
import SaveError from './SaveError';
import useInstantSave from './useInstantSave';
import { useAuth } from '../../contexts/AuthContext';
import { userAPI } from '../../lib/api';
import { useCareTextDetail } from '../../lib/careTextMode';
import { showDailyTrivia, writeTriviaFlag } from '../../lib/dailyTrivia';

// Body of the "Care style" sheet: care tip detail, the daily plant tip, and skipping AI identification.
// Each setting saves the instant it changes.
export default function CareStyleSheetBody() {
  const { user, updateUser } = useAuth();
  const text = useCareTextDetail();
  const textRef = useRef(null);
  const manual = useInstantSave();
  const manualRef = useRef(null);
  const [savingTrivia, setSavingTrivia] = useState(false);

  const manualOn = !!user?.prefer_manual_plant_entry;
  const toggleManual = () => {
    const previous = manualOn;
    const next = !previous;
    manual.run(
      () => updateUser({ prefer_manual_plant_entry: next }),
      () => userAPI.updateMe({ prefer_manual_plant_entry: next }),
      () => updateUser({ prefer_manual_plant_entry: previous }),
    );
  };

  // Local first: the choice is kept on this device, and the server copy catches up on the next save.
  const toggleTrivia = async () => {
    if (savingTrivia) return;
    const next = !showDailyTrivia(user);
    setSavingTrivia(true);
    writeTriviaFlag(next);
    updateUser({ show_daily_trivia: next });
    try {
      await userAPI.updateMe({ show_daily_trivia: next });
    } catch {
      // Kept on this device already.
    } finally {
      setSavingTrivia(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <CareTextToggle
          value={text.mode}
          onChange={text.setMode}
          disabled={text.busy}
          describedBy={text.error ? 'care-text-error' : undefined}
          focusRef={textRef}
        />
        <SaveError id="care-text-error" error={text.error} onRetry={text.retry} testId="care-text-error" focusAfter={textRef} />
      </div>
      <div className="border-t-hairline border-grove-moss pt-4">
        <SwitchRow
          label="Show a daily plant tip on Today"
          help="One short plant fact a day. Off unless you want it."
          checked={showDailyTrivia(user)}
          disabled={savingTrivia}
          onChange={toggleTrivia}
          testId="profile-daily-trivia-toggle"
        />
      </div>
      <div className="border-t-hairline border-grove-moss pt-4">
        <SwitchRow
          label="Skip AI identification"
          help="Always open manual entry when adding a plant."
          checked={manualOn}
          disabled={manual.busy}
          onChange={toggleManual}
          testId="profile-prefer-manual-toggle"
          describedBy={manual.error ? 'manual-entry-error' : undefined}
          buttonRef={manualRef}
        />
        <SaveError id="manual-entry-error" error={manual.error} onRetry={manual.retry} testId="manual-entry-error" focusAfter={manualRef} />
      </div>
    </div>
  );
}
