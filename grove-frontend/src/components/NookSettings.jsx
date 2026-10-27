import React, { useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { nookAPI } from '../lib/api';
import { PAPER_ERROR, PAPER_PANEL } from '../nook/paperStyles';

// The profile switch for Pip's nook. Turning it off hides it. Nothing earned is removed.
export default function NookSettings() {
  const { user, updateUser } = useAuth();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const busy = useRef(false);
  const on = !!user?.nook_enabled;

  const toggle = async () => {
    if (busy.current) return;
    busy.current = true;
    setSaving(true);
    setError('');
    try {
      const res = await nookAPI.settings({ enabled: !on });
      if (updateUser) updateUser(res.data);
    } catch (_e) {
      setError('Couldn’t save that. Try again.');
    } finally {
      busy.current = false;
      setSaving(false);
    }
  };

  return (
    <div className={PAPER_PANEL} data-testid="profile-nook">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="mb-1 font-plant text-base text-grove-root">Pip&rsquo;s nook</h3>
          <p className="font-ui text-sm text-grove-inkSoft">
            A small pixel nook that grows as you learn. It never scores your plants. Turning it off keeps everything you&rsquo;ve earned.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={on}
          aria-label="Pip’s nook"
          aria-busy={saving}
          onClick={toggle}
          className={`min-h-touch min-w-touch shrink-0 rounded-pill border-hairline px-3 py-1 font-ui text-sm text-grove-ink ${on ? 'border-grove-root bg-grove-paperPale' : 'border-grove-paperGreen bg-grove-paper'}`}
          data-testid="profile-nook-switch"
        >
          {on ? 'On' : 'Off'}
        </button>
      </div>
      {error && (
        <p role="alert" className={`mt-2 ${PAPER_ERROR}`} data-testid="profile-nook-error">
          {error}
        </p>
      )}
    </div>
  );
}
