import React, { useEffect, useRef } from 'react';
import { Sparkles, X } from 'lucide-react';
import { userAPI } from '../lib/api';
import { success, impactLight } from '../lib/haptics';

// One-time overlay shown the first time a user logs ANY care action.
// Triggered by parent when a care log response includes _meta.first_care_pending=true.
// On confirm/dismiss, we POST /users/me/celebrate-first-care to mark it permanently.
export default function FirstCareCelebration({ open, onClose }) {
  const hasFiredHaptic = useRef(false);

  useEffect(() => {
    if (!open || hasFiredHaptic.current) return;
    hasFiredHaptic.current = true;
    // success haptic on overlay open
    try { success(document.body); } catch (_e) { /* no-op */ }
    // call backend idempotently
    (async () => {
      try { await userAPI.celebrateFirstCare(); } catch (_e) { /* no-op */ }
    })();
  }, [open]);

  if (!open) return null;

  const handleClose = (e) => {
    impactLight(e?.currentTarget || document.body);
    onClose && onClose();
  };

  // Generate a few burst leaves at random angles for the celebration
  const bursts = Array.from({ length: 12 }).map((_, i) => {
    const angle = (i / 12) * Math.PI * 2;
    const radius = 70 + (i % 3) * 12;
    const dx = Math.round(Math.cos(angle) * radius);
    const dy = Math.round(Math.sin(angle) * radius);
    const rot = Math.round((i * 47) % 90 - 45);
    const color = i % 3 === 0 ? '#5DCAA5' : i % 3 === 1 ? '#C0DD97' : '#9FE1CB';
    return { dx, dy, rot, color, delay: (i % 6) * 35 };
  });

  return (
    <div
      data-testid="first-care-celebration"
      className="fixed inset-0 z-[80] flex items-center justify-center px-4 grove-celebrate-fade"
      style={{ background: 'rgba(28, 46, 16, 0.78)' }}
      role="dialog"
      aria-modal="true"
    >
      <div className="relative max-w-[420px] w-full rounded-[18px] border-[0.5px] border-[#5DCAA5]/40 bg-[#FDFAF6] px-6 py-7 grove-celebrate-pop">
        {/* Burst leaves around the central icon */}
        <div className="absolute inset-0 pointer-events-none flex items-start justify-center">
          <div className="relative" style={{ width: 1, height: 1, marginTop: 70 }}>
            {bursts.map((b, i) => (
              <span
                key={i}
                className="grove-leaf-burst"
                style={{
                  left: 0, top: 0,
                  background: b.color,
                  borderRadius: '50% 0 50% 0',
                  animationDelay: `${b.delay}ms`,
                  '--grove-burst-x': `${b.dx}px`,
                  '--grove-burst-y': `${b.dy}px`,
                  '--grove-burst-r': `${b.rot}deg`,
                }}
              />
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={handleClose}
          aria-label="Close"
          data-testid="first-care-celebration-close-x"
          className="absolute top-3 right-3 w-8 h-8 rounded-full border-[0.5px] border-[#D3C9B8] text-[#5F5E5A] hover:bg-[#EAF3DE] flex items-center justify-center"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-[#1C2E10] text-[#9FE1CB] flex items-center justify-center mb-4">
            <Sparkles className="h-7 w-7" />
          </div>
          <p className="font-plant uppercase tracking-[0.1em] text-[10px] text-[#3B6D11]">
            First care logged
          </p>
          <h2 className="font-plant text-[#1C2E10] text-2xl mt-1">
            Your grove remembers.
          </h2>
          <p className="font-ui text-sm text-[#2B2B26] mt-2 leading-relaxed">
            That's the loop. Every drop, every photo, every small note from now on becomes part of your plant's living timeline.
          </p>
          <button
            type="button"
            onClick={handleClose}
            data-testid="first-care-celebration-cta"
            className="relative overflow-hidden mt-5 rounded-[2px] font-plant uppercase tracking-[0.08em] text-xs px-5 py-3 bg-[#1C2E10] text-[#F5F0E8] border-[0.5px] border-[#1C2E10] hover:bg-[#2D5016] transition-colors duration-150"
          >
            Keep going
          </button>
        </div>
      </div>
    </div>
  );
}
