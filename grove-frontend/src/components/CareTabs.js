import React from 'react';
import AppLink from './AppLink';
import { useLocation } from 'react-router-dom';
import { TAB_STRIP_CLASS, tabClass } from './tabStyles';
import { useAuth } from '../contexts/AuthContext';
import PipMark from '../nook/PipMark';

export const SUBTABS = [
  { path: '/care/today', label: 'To do', testid: 'care-today-tab', tooltipId: 'care_today_first_visit' },
  { path: '/care/growth', label: 'Progress', testid: 'care-growth-tab', tooltipId: 'care_growth_first_visit' },
  // Goals are pinned locked badges on /care/today and managed from /badges. Old deep links to
  // /care/goals redirect to /care/today (see App.js).
];

// Pip's nook sits beside Progress once the person has answered the "Pip has a room" offer (yes, or not now): a first-run
// owner sees only the two care views, and someone who said "not now" still has a way back. /nook is its own page,
// so this tab is a link to it, and the strip is shown there too with Pip marked as the current view.
const PIP_TAB = { path: '/nook', label: 'Pip', testid: 'care-pip-tab' };

// The Care views, shown inside the page header under the title so the h1 sits where it does
// on every other screen.
export function CareTabs() {
  const location = useLocation();
  const { user } = useAuth();
  const showPip = !!(user?.nook_enabled || user?.nook_offered_at);
  const tabs = showPip ? [...SUBTABS, PIP_TAB] : SUBTABS;
  return (
    <nav aria-label="Care views" className={`mt-1 ${TAB_STRIP_CLASS}`} data-testid="care-subtabs">
      {tabs.map((tab) => {
        const active = location.pathname.startsWith(tab.path);
        return (
          <AppLink
            key={tab.path}
            to={tab.path}
            data-testid={tab.testid}
            aria-current={active ? 'page' : undefined}
            className={tabClass(active)}
          >
            {tab === PIP_TAB && <PipMark />}
            {tab.label}
          </AppLink>
        );
      })}
    </nav>
  );
}
