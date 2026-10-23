import React from 'react';

const statusColors = {
  healthy: 'bg-grove-lime',
  needs_water: 'bg-[#BA7517]',
  urgent: 'bg-grove-bloom',
  propagating: 'bg-[#185FA5]',
  dormant: 'bg-grove-moss',
};

const statusLabels = {
  healthy: 'Healthy',
  needs_water: 'Due soon',
  urgent: 'Needs a check',
  propagating: 'Propagating',
  dormant: 'Dormant',
};

export function StatusDot({ status, size = 'sm', showLabel = false, className = '' }) {
  const sizeClass = size === 'lg' ? 'h-3 w-3' : 'h-2.5 w-2.5';
  const colorClass = statusColors[status] || statusColors.healthy;
  const isPulsing = status === 'urgent' || status === 'needs_water';

  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <span
        className={`${sizeClass} rounded-full ${colorClass} ring-2 ring-grove-lime ${isPulsing ? 'status-pulse' : ''}`}
        data-testid={`status-dot-${status}`}
      />
      {!showLabel && <span className="sr-only">{statusLabels[status] || status}</span>}
      {showLabel && (
        <span className="text-xs font-ui text-grove-cream">{statusLabels[status] || status}</span>
      )}
    </span>
  );
}

export default StatusDot;
