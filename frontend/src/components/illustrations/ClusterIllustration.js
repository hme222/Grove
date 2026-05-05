import React from 'react';

export function ClusterIllustration({ className = '' }) {
  return (
    <svg
      className={className}
      width="120"
      height="120"
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="40" cy="50" r="25" fill="#EAF3DE" stroke="#3B6D11" strokeWidth="1.5" />
      <circle cx="70" cy="40" r="22" fill="#9FE1CB" stroke="#5DCAA5" strokeWidth="1.5" />
      <circle cx="60" cy="75" r="20" fill="#EAF3DE" stroke="#639922" strokeWidth="1.5" />
      <line x1="40" y1="50" x2="60" y2="60" stroke="#639922" strokeWidth="1.2" opacity="0.5" />
      <line x1="70" y1="40" x2="60" y2="60" stroke="#5DCAA5" strokeWidth="1.2" opacity="0.5" />
    </svg>
  );
}
