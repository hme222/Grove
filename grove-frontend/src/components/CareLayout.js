import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTooltips } from '@/contexts/TooltipContext';

const SUBTABS = [
  { path: '/care/today', label: 'Today', testid: 'care-today-tab', tooltipId: 'care_today_first_visit' },
  { path: '/care/growth', label: 'Growth', testid: 'care-growth-tab', tooltipId: 'care_growth_first_visit' },
  // Phase 14C.4 — Goals tab removed. Goals are now pinned locked badges
  // surfaced in the "Working toward" section on /care/today, and managed
  // from the badge gallery at /badges. Old deep links (/care/goals,
  // notifications) redirect to /care/today (see App.js routes).
];

export default function CareLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { showTooltip } = useTooltips();

  // First-visit tooltip for the currently active sub-tab.
  useEffect(() => {
    const active = SUBTABS.find((t) => location.pathname.startsWith(t.path));
    if (!active) return;
    const timer = setTimeout(() => {
      showTooltip(active.tooltipId);
    }, 500);
    return () => clearTimeout(timer);
  }, [location.pathname, showTooltip]);

  return (
    <div className="min-h-screen bg-[#F5F0E8]">
      {/* Sub-tab bar */}
      <div className="sticky top-0 z-30 bg-[#F5F0E8] border-b-[0.5px] border-[#D3C9B8]">
        <div className="max-w-[1100px] mx-auto px-4">
          <div className="flex items-center gap-1 overflow-x-auto" data-testid="care-subtabs">
            {SUBTABS.map(tab => {
              const active = location.pathname.startsWith(tab.path);
              return (
                <button
                  key={tab.path}
                  onClick={() => navigate(tab.path)}
                  data-testid={tab.testid}
                  className={`flex-shrink-0 px-3 py-3 text-xs font-plant uppercase tracking-[0.1em] border-b-2 transition-colors duration-150 ${
                    active
                      ? 'border-[#3B6D11] text-[#1C2E10]'
                      : 'border-transparent text-[#2B2B26] hover:text-[#1C2E10]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {children}
    </div>
  );
}
