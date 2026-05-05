import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { TOOLTIPS } from '@/constants/tooltips';
import { X } from 'lucide-react';
import { useAuth } from './AuthContext';
import { userAPI } from '../lib/api';

const TooltipContext = createContext();

export function useTooltips() {
  const context = useContext(TooltipContext);
  if (!context) {
    throw new Error('useTooltips must be used within TooltipProvider');
  }
  return context;
}

// Phase 14A.2 — Global 30-day tooltip window per Supplement v2 Part A.
// Day 0 = signup. Tooltips show for 30 days, individually dismissable. On day
// 31 they all auto-disable. A Settings toggle re-enables (and clears dismissed).
const TOOLTIP_WINDOW_DAYS = 30;

function daysSinceSignup(user) {
  if (!user?.created_at) return Infinity;
  try {
    const created = new Date(user.created_at).getTime();
    return (Date.now() - created) / (1000 * 60 * 60 * 24);
  } catch {
    return Infinity;
  }
}

function Tooltip({ tooltip, targetRect, onDismiss }) {
  const position = tooltip.position || 'top';
  const MAX_WIDTH = 220;
  const tipRef = React.useRef(null);

  // Dismiss on any tap/keypress anywhere (except inside the tooltip itself).
  React.useEffect(() => {
    const onAnyClick = (e) => {
      if (tipRef.current && tipRef.current.contains(e.target)) return;
      onDismiss();
    };
    const onEsc = (e) => { if (e.key === 'Escape') onDismiss(); };
    document.addEventListener('pointerdown', onAnyClick, true);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('pointerdown', onAnyClick, true);
      document.removeEventListener('keydown', onEsc);
    };
  }, [onDismiss]);

  let style = { position: 'fixed', zIndex: 9999, maxWidth: `${MAX_WIDTH}px` };
  const viewportW = typeof window !== 'undefined' ? window.innerWidth : 0;

  if (position === 'top') {
    style.left = Math.max(8, Math.min(viewportW - 8, targetRect.left + targetRect.width / 2));
    style.top = targetRect.top - 12;
    style.transform = 'translate(-50%, -100%)';
  } else if (position === 'bottom') {
    style.left = Math.max(8, Math.min(viewportW - 8, targetRect.left + targetRect.width / 2));
    style.top = targetRect.bottom + 12;
    style.transform = 'translate(-50%, 0)';
  }

  return (
    <div
      ref={tipRef}
      className="rounded-[10px] border-[0.5px] border-[#2D5016] bg-[#1C2E10] p-3"
      style={style}
      data-testid={`tooltip-${tooltip.id}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1 flex-1 min-w-0">
          <h4 className="font-plant text-[13px] leading-tight text-[#EAF3DE] font-medium">
            {tooltip.title}
          </h4>
          <p className="font-ui text-[11px] leading-[1.5] text-[#9FE1CB]">{tooltip.body}</p>
        </div>
        <button
          onClick={onDismiss}
          className="text-[#9FE1CB] hover:text-[#EAF3DE] transition-colors shrink-0 -mt-0.5"
          data-testid={`tooltip-dismiss-${tooltip.id}`}
          aria-label="Dismiss tooltip"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

export function TooltipProvider({ children }) {
  const { user } = useAuth();

  // Server-tracked dismissed list, fall back to localStorage for pre-auth.
  const [serverDismissed, setServerDismissed] = useState([]);
  const [activeTooltip, setActiveTooltip] = useState(null);
  const [targetRect, setTargetRect] = useState(null);

  useEffect(() => {
    if (user?.tooltips_dismissed) {
      setServerDismissed(user.tooltips_dismissed);
    }
  }, [user?.tooltips_dismissed]);

  const days = daysSinceSignup(user);
  const tooltipsEnabled = user?.tooltips_enabled !== false; // default true
  const withinWindow = days <= TOOLTIP_WINDOW_DAYS;
  const tooltipsActive = tooltipsEnabled && withinWindow;

  const dismissedSet = useMemo(() => {
    let local = [];
    try {
      const stored = localStorage.getItem('grove_dismissed_tooltips');
      const parsed = stored ? JSON.parse(stored) : [];
      local = Array.isArray(parsed) ? parsed : [];
    } catch { /* empty */ }
    return new Set([...(serverDismissed || []), ...local]);
  }, [serverDismissed]);

  const showTooltip = useCallback((tooltipId) => {
    if (!tooltipsActive) return;
    if (dismissedSet.has(tooltipId)) return;

    const tooltip = TOOLTIPS.find(t => t.id === tooltipId);
    if (!tooltip) return;

    const targetElement = document.querySelector(`[data-testid="${tooltip.target}"]`);
    if (!targetElement) return;

    const rect = targetElement.getBoundingClientRect();
    setTargetRect(rect);
    setActiveTooltip(tooltip);
  }, [tooltipsActive, dismissedSet]);

  const dismissTooltip = useCallback(async (tooltipId) => {
    // Optimistic local persistence first
    try {
      const stored = localStorage.getItem('grove_dismissed_tooltips');
      const local = stored ? JSON.parse(stored) : [];
      if (!local.includes(tooltipId)) {
        local.push(tooltipId);
        localStorage.setItem('grove_dismissed_tooltips', JSON.stringify(local));
      }
    } catch { /* empty */ }
    setServerDismissed((prev) => prev.includes(tooltipId) ? prev : [...prev, tooltipId]);
    setActiveTooltip(null);
    setTargetRect(null);
    if (user) {
      try { await userAPI.dismissTooltip(tooltipId); } catch { /* non-blocking */ }
    }
  }, [user]);

  const resetAll = useCallback(async () => {
    try { localStorage.removeItem('grove_dismissed_tooltips'); } catch { /* empty */ }
    setServerDismissed([]);
    if (user) {
      try { await userAPI.resetTooltips(); } catch { /* non-blocking */ }
    }
  }, [user]);

  const handleDismiss = () => {
    if (activeTooltip) {
      dismissTooltip(activeTooltip.id);
    }
  };

  const value = useMemo(() => ({
    showTooltip,
    dismissTooltip,
    dismissedTooltips: Array.from(dismissedSet),
    tooltipsActive,
    daysSinceSignup: days,
    daysRemaining: Math.max(0, Math.ceil(TOOLTIP_WINDOW_DAYS - days)),
    resetAll,
  }), [showTooltip, dismissTooltip, dismissedSet, tooltipsActive, days, resetAll]);

  return (
    <TooltipContext.Provider value={value}>
      {children}
      {activeTooltip && targetRect && (
        <Tooltip tooltip={activeTooltip} targetRect={targetRect} onDismiss={handleDismiss} />
      )}
    </TooltipContext.Provider>
  );
}
