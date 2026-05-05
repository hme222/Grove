import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { userAPI } from '../lib/api';
import { Sprout, X } from 'lucide-react';
import { impactLight } from '../lib/haptics';

// Visible if:
//   - user.created_at within last 24 hours
//   - user.first_session_banner_dismissed is not true
// Server-persisted dismissal so it doesn't reappear on other devices.
export default function FirstSessionBanner() {
  const { user, updateUser } = useAuth();
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    setHidden(false);
  }, [user?.id]);

  if (!user || hidden) return null;
  if (user.first_session_banner_dismissed) return null;

  const createdAt = user.created_at ? new Date(user.created_at).getTime() : 0;
  const ageMs = Date.now() - createdAt;
  const within24h = ageMs >= 0 && ageMs <= 24 * 60 * 60 * 1000;
  if (!within24h) return null;

  const handleDismiss = async (e) => {
    impactLight(e.currentTarget);
    setHidden(true); // optimistic
    try {
      await userAPI.dismissFirstSessionBanner();
      if (updateUser) updateUser({ first_session_banner_dismissed: true });
    } catch {
      // banner stays gone for this session even if server hiccups
    }
  };

  const displayName = user.display_name || user.username || 'there';

  return (
    <div
      data-testid="first-session-banner"
      className="max-w-[1100px] mx-auto px-4 pt-3"
    >
      <div className="relative overflow-hidden rounded-[14px] border-[0.5px] border-[#3B6D11]/40 bg-[#1C2E10] text-[#F5F0E8] px-4 py-3 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-[#2D5016] flex items-center justify-center flex-shrink-0">
          <Sprout className="h-5 w-5 text-[#9FE1CB]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-plant uppercase tracking-[0.1em] text-[10px] text-[#9FE1CB]">
            Welcome to Grove, {displayName}
          </p>
          <p className="font-ui text-sm leading-snug">
            Your first 90 seconds: add a plant, log one care action, take one photo. That's the loop. Everything else grows from there.
          </p>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss welcome banner"
          data-testid="first-session-banner-dismiss"
          className="relative overflow-hidden flex-shrink-0 w-8 h-8 rounded-full border-[0.5px] border-[#5DCAA5]/30 text-[#9FE1CB] hover:bg-[#2D5016] flex items-center justify-center"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
