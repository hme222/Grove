import React from 'react';
import { Check, Droplet, CircleAlert, Waves, Moon } from 'lucide-react';

const statusColors = {
  healthy: 'bg-grove-lime',
  needs_water: 'bg-grove-sun',
  urgent: 'bg-grove-bloom',
  propagating: 'bg-grove-sage',
  dormant: 'bg-grove-sage',
};

// Two channels per state: color and a distinct glyph, so the meaning survives color blindness
// and a glance in sunlight.
const statusIcons = {
  healthy: Check,
  needs_water: Droplet,
  urgent: CircleAlert,
  propagating: Waves,
  dormant: Moon,
};

const statusLabels = {
  healthy: 'Healthy',
  needs_water: 'Due soon',
  urgent: 'Check',
  propagating: 'Propagating',
  dormant: 'Dormant',
};

export function StatusDot({ status, size = 'sm', showLabel = false, className = '' }) {
  const sizeClass = size === 'lg' ? 'h-5 w-5' : 'h-4 w-4';
  const Icon = statusIcons[status] || Check;
  const colorClass = statusColors[status] || statusColors.healthy;
  const isPulsing = status === 'urgent' || status === 'needs_water';

  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <span
        className={`${sizeClass} inline-flex items-center justify-center rounded-full ${colorClass} text-grove-root ${isPulsing ? 'status-pulse' : ''}`}
        data-testid={`status-dot-${status}`}
      >
        <Icon className="h-3 w-3" strokeWidth={3} aria-hidden="true" />
      </span>
      {!showLabel && <span className="sr-only">{statusLabels[status] || status}</span>}
      {showLabel && (
        <span className="whitespace-nowrap text-xs font-ui text-grove-cream">{statusLabels[status] || status}</span>
      )}
    </span>
  );
}

export default StatusDot;
