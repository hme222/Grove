import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from 'lucide-react';
import NotificationBell from './NotificationBell';

export function PageHeader({ title, count, rightContent, children, hideBell, hideProfile }) {
  const navigate = useNavigate();
  return (
    <div className="sticky top-0 z-40 bg-grove-forest border-b-[0.5px] border-grove-moss">
      <div className="max-w-[1100px] mx-auto px-4 py-3">
        {/* Wraps instead of running off the edge when the reader's text is large. */}
        <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
          <div className="flex min-w-0 flex-1 basis-28 items-center gap-2">
            <h1 className="font-plant text-grove-cream text-xl truncate">{title}</h1>
            {count !== undefined && (
              <span className="inline-flex items-center rounded-[20px] border-[0.5px] border-grove-moss bg-grove-moss px-2.5 py-0.5 text-xs font-ui text-grove-cream">
                {count}
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            {rightContent}
            {!hideBell && <NotificationBell />}
            {!hideProfile && (
              <button
                type="button"
                onClick={() => navigate('/profile')}
                aria-label="Open profile"
                data-testid="header-profile-button"
                className="w-11 h-11 rounded-full border-[0.5px] border-grove-moss bg-grove-canopy text-grove-cream hover:border-grove-fernLine flex items-center justify-center"
              >
                <User className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}

export function FilterChips({ filters, active, onChange }) {
  return (
    <div className="mt-3 flex flex-wrap gap-2 pb-1">
      {filters.map(({ value, label }) => (
        <button
          key={value}
          onClick={() => onChange(value)}
          data-testid={`filter-chip-${value}`}
          className={`inline-flex min-h-[44px] items-center whitespace-nowrap rounded-[20px] border-[0.5px] px-3 py-1.5 text-xs font-ui transition-colors duration-150 ${
            active === value
              ? 'border-grove-fernLine bg-grove-lime text-grove-root'
              : 'border-grove-moss bg-grove-moss text-grove-cream hover:border-grove-fernLine'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export function EmptyState({ title, description, action }) {
  return (
    <div className="rounded-[14px] border-[0.5px] border-grove-moss bg-grove-moss p-6 text-center my-8 mx-4">
      <p className="font-plant text-grove-cream text-lg mb-1">{title}</p>
      <p className="text-sm font-ui text-grove-cream mb-4">{description}</p>
      {action}
    </div>
  );
}
