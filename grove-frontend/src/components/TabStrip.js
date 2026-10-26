import React from 'react';
import { cn } from '../lib/utils';
import { TAB_STRIP_CLASS, tabClass } from './tabStyles';

// A strip of button tabs that switch a view in place (Plants and Bouquets). Each tab is a
// toggle button with aria-pressed, as the segmented control it replaces was. Radix tab sets use
// ui/tabs.jsx, which shares the same look. `items` is [{ value, label, count?, testid? }].
export function TabStrip({ label, items, value, onChange, className, testid }) {
  return (
    <div role="group" aria-label={label} data-testid={testid} className={cn(TAB_STRIP_CLASS, className)}>
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(item.value)}
            data-testid={item.testid}
            className={tabClass(active)}
          >
            {item.label}
            {item.count !== undefined && <span>{item.count}</span>}
          </button>
        );
      })}
    </div>
  );
}

export default TabStrip;
