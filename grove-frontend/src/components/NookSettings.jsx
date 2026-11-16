import React, { useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { nookAPI } from '../lib/api';
import SaveError from './profile/SaveError';
import { useInstantSave } from './profile/useInstantSave';
import { PAPER_PANEL } from '../nook/paperStyles';

// The profile switch for Pip's nook. Turning it off hides it. Nothing earned is removed.
export default function NookSettings({ bare = false }) {
  const { user, updateUser } = useAuth();
  const { run, busy: saving, error, retry } = useInstantSave();
  const switchRef = useRef(null);
  const on = !!user?.nook_enabled;

  // The switch changes only once the server answers, so there is nothing to apply or put back. Try again replays
  // this same value, not whatever the switch reads at click time.
  const toggle = () => {
    const next = !on;
    return run(
      () => {},
      async () => {
        const res = await nookAPI.settings({ enabled: next });
        if (updateUser) updateUser(res.data);
      },
      () => {},
    );
  };

  return (
    <div className={bare ? '' : PAPER_PANEL} data-testid="profile-nook">
      <div className="flex items-start justify-between gap-3">
        <div>
          {bare ? <p className="mb-1 font-plant text-base text-grove-cream">Pip&rsquo;s nook</p> : <h3 className="mb-1 font-plant text-base text-grove-root">Pip&rsquo;s nook</h3>}
          <p className={`font-ui text-sm ${bare ? 'text-grove-sage' : 'text-grove-inkSoft'}`}>
            A small pixel nook that grows as you learn. It never scores your plants. Turning it off keeps everything you&rsquo;ve earned.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={on}
          aria-label="Pip’s nook"
          aria-busy={saving}
          aria-describedby={error ? 'profile-nook-error' : undefined}
          ref={switchRef}
          onClick={toggle}
          className={`min-h-touch min-w-touch shrink-0 rounded-pill border-hairline px-3 py-1 font-ui text-sm text-grove-ink ${on ? 'border-grove-root bg-grove-paperPale' : 'border-grove-paperGreen bg-grove-paper'}`}
          data-testid="profile-nook-switch"
        >
          {on ? 'On' : 'Off'}
        </button>
      </div>
      <SaveError tone={bare ? 'dark' : 'paper'} id="profile-nook-error" error={error} onRetry={retry} testId="profile-nook-error" focusAfter={switchRef} />
    </div>
  );
}
