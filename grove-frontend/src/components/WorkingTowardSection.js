import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Target, ArrowRight } from 'lucide-react';
import { goalAPI } from '../lib/api';
import { BadgeIcon } from './BadgeIcon';

/**
 * Phase 14C.4 — "Working toward" section on Care/Today.
 *
 * Renders the user's pinned goals (locked badges they're tracking) with
 * progress bars. The section stays hidden when there are no pinned goals
 * — never shows empty placeholders, per the spec.
 *
 * Goals auto-unpin server-side when earned. The component re-fetches on
 * mount so freshly-completed goals disappear on navigation back to Care.
 */
export default function WorkingTowardSection() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await goalAPI.list();
        if (alive) setItems(res.data.items || []);
      } catch (e) {
        if (alive) setError(true);
      }
    })();
    return () => { alive = false; };
  }, []);

  // Stay hidden until we have data and at least one pinned goal
  if (error) return null;
  if (items === null) return null;
  if (items.length === 0) return null;

  return (
    <section
      className="rounded-[14px] border-[0.5px] border-grove-moss bg-grove-canopy p-4 mb-3"
      data-testid="care-working-toward"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-plant text-grove-cream text-sm inline-flex items-center gap-2">
          <Target className="h-4 w-4 text-grove-sprout" />
          Working toward
        </h3>
        <Link
          to="/badges"
          data-testid="care-working-toward-manage"
          className="font-plant text-xs text-grove-sage hover:text-grove-sprout inline-flex items-center gap-1"
        >
          Manage <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <ul className="space-y-2.5">
        {items.map((g) => {
          const p = g.progress || { current: 0, target: 1, pct: 0, label: '' };
          const pctClamped = Math.max(0, Math.min(1, p.pct || 0));
          const pctDisplay = Math.round(pctClamped * 100);
          return (
            <li
              key={g.slug}
              className="flex items-center gap-3"
              data-testid={`goal-${g.slug}`}
            >
              <span
                className="flex-shrink-0 w-9 h-9 rounded-full bg-grove-moss flex items-center justify-center"
                aria-hidden="true"
              >
                <BadgeIcon name={g.icon} className="h-4 w-4 text-grove-sprout" />
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2 mb-1">
                  <p className="font-plant text-[13px] text-grove-cream truncate">
                    {g.name}
                  </p>
                  <p
                    className="font-mono text-[12px] text-grove-sage flex-shrink-0"
                    data-testid={`goal-${g.slug}-progress`}
                  >
                    {p.current} / {p.target}{' '}
                    <span className="font-latin italic text-xs">
                      {p.label}
                    </span>
                  </p>
                </div>
                <div
                  className="h-1.5 rounded-full bg-grove-moss overflow-hidden"
                  role="progressbar"
                  aria-valuenow={pctDisplay}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div
                    className="h-full bg-grove-lime transition-all duration-300 ease-out"
                    style={{ width: `${pctDisplay}%` }}
                  />
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
