import React, { useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { nookAPI } from '../lib/api';

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
      setError('Could not save that. Try again.');
    } finally {
      busy.current = false;
      setSaving(false);
    }
  };

  return (
    <div className="rounded-[14px] border-[0.5px] border-[#D3C9B8] bg-[#EDE5D8] p-4" data-testid="profile-nook">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-plant text-[#1C2E10] text-sm mb-1">Pip&apos;s nook</h3>
          <p className="text-xs font-ui text-[#2B2B26]">
            A small pixel nook that grows as you learn. It never scores your plants. Turning it off keeps everything you&apos;ve earned.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={on}
          aria-label="Pip's nook"
          aria-busy={saving}
          onClick={toggle}
          className={`shrink-0 rounded-[20px] border-[0.5px] px-3 py-1 text-xs font-ui ${on ? 'border-[#1C2E10] bg-[#EAF3DE]' : 'border-[#D3C9B8] bg-[#F5F0E8]'}`}
          data-testid="profile-nook-switch"
        >
          {on ? 'On' : 'Off'}
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-2 text-xs font-ui text-red-700" data-testid="profile-nook-error">
          {error}
        </p>
      )}
    </div>
  );
}
