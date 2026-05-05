import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from 'lucide-react';
import NotificationBell from './NotificationBell';

export function PageHeader({ title, count, rightContent, children, hideBell, hideProfile }) {
  const navigate = useNavigate();
  return (
    <div className="sticky top-0 z-40 bg-[#F5F0E8] border-b-[0.5px] border-[#D3C9B8]">
      <div className="max-w-[1100px] mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <h1 className="font-plant text-[#1C2E10] text-xl truncate">{title}</h1>
            {count !== undefined && (
              <span className="inline-flex items-center rounded-[20px] border-[0.5px] border-[#D3C9B8] bg-[#EAF3DE] px-2.5 py-0.5 text-xs font-ui text-[#1C2E10]">
                {count}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {rightContent}
            {!hideBell && <NotificationBell />}
            {!hideProfile && (
              <button
                type="button"
                onClick={() => navigate('/profile')}
                aria-label="Open profile"
                data-testid="header-profile-button"
                className="w-9 h-9 rounded-full border-[0.5px] border-[#D3C9B8] bg-[#FDFAF6] text-[#1C2E10] hover:border-[#3B6D11] flex items-center justify-center"
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
    <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-hide">
      {filters.map(({ value, label }) => (
        <button
          key={value}
          onClick={() => onChange(value)}
          data-testid={`filter-chip-${value}`}
          className={`inline-flex items-center whitespace-nowrap rounded-[20px] border-[0.5px] px-3 py-1.5 text-xs font-ui transition-colors duration-150 ${
            active === value
              ? 'border-[#1C2E10] bg-[#1C2E10] text-[#F5F0E8]'
              : 'border-[#D3C9B8] bg-[#EDE5D8] text-[#1A1A17] hover:border-[#2D5016]'
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
    <div className="rounded-[14px] border-[0.5px] border-[#D3C9B8] bg-[#EAF3DE] p-6 text-center my-8 mx-4">
      <p className="font-plant text-[#1C2E10] text-lg mb-1">{title}</p>
      <p className="text-sm font-ui text-[#2B2B26] mb-4">{description}</p>
      {action}
    </div>
  );
}
