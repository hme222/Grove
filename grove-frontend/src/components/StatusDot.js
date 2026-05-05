import React from 'react';

const statusColors = {
  healthy: 'bg-[#3B6D11]',
  needs_water: 'bg-[#BA7517]',
  urgent: 'bg-[#E24B4A]',
  propagating: 'bg-[#185FA5]',
  dormant: 'bg-[#D3C9B8]',
};

const statusLabels = {
  healthy: 'Healthy',
  needs_water: 'Due soon',
  urgent: 'Overdue',
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
        className={`${sizeClass} rounded-full ${colorClass} ring-2 ring-[#F5F0E8] ${isPulsing ? 'status-pulse' : ''}`}
        data-testid={`status-dot-${status}`}
      />
      {showLabel && (
        <span className="text-xs font-ui text-[#2B2B26]">{statusLabels[status] || status}</span>
      )}
    </span>
  );
}

export default StatusDot;
