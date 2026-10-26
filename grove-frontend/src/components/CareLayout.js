import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTooltips } from '@/contexts/TooltipContext';
import { SUBTABS } from './CareTabs';


export default function CareLayout({ children }) {
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

  return <div className="min-h-screen bg-grove-forest">{children}</div>;
}
