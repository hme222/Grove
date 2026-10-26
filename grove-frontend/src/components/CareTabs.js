import React from 'react';
import AppLink from './AppLink';
import { useLocation } from 'react-router-dom';
import { TAB_STRIP_CLASS, tabClass } from './tabStyles';

export const SUBTABS = [
  { path: '/care/today', label: 'To do', testid: 'care-today-tab', tooltipId: 'care_today_first_visit' },
  { path: '/care/growth', label: 'Progress', testid: 'care-growth-tab', tooltipId: 'care_growth_first_visit' },
  // Goals are pinned locked badges on /care/today and managed from /badges. Old deep links to
  // /care/goals redirect to /care/today (see App.js).
];

// The two Care views, shown inside the page header under the title so the h1 sits where it does
// on every other screen.
export function CareTabs() {
  const location = useLocation();
  return (
    <nav aria-label="Care views" className={`mt-1 ${TAB_STRIP_CLASS}`} data-testid="care-subtabs">
      {SUBTABS.map((tab) => {
        const active = location.pathname.startsWith(tab.path);
        return (
          <AppLink
            key={tab.path}
            to={tab.path}
            data-testid={tab.testid}
            aria-current={active ? 'page' : undefined}
            className={tabClass(active)}
          >
            {tab.label}
          </AppLink>
        );
      })}
    </nav>
  );
}
