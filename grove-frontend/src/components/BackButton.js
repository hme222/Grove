import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

// The only back control in the app. Visible text is "Back"; `to` names where it goes so the
// accessible name reads "Back to Profile" (it contains the visible label). Without `to` it
// steps back in history.
//   inline  – sits in a page header, left of the title
//   overlay – round button over a hero photo
export default function BackButton({ to, where, onClick, variant = 'inline', testId, className = '' }) {
  const navigate = useNavigate();
  const go = () => (onClick ? onClick() : to ? navigate(to) : navigate(-1));
  if (variant === 'overlay') {
    return (
      <button
        type="button"
        onClick={go}
        data-testid={testId || 'back-button'}
        className={`flex min-h-touch min-w-touch items-center justify-center rounded-full bg-grove-night/65 text-grove-cream backdrop-blur-sm transition-colors duration-150 hover:bg-grove-night/85 ${className}`}
      >
        <ChevronLeft className="h-5 w-5" aria-hidden="true" />
        <span className="sr-only">Back{where ? ` to ${where}` : ''}</span>
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={go}
      data-testid={testId || 'back-button'}
      className={`-ml-2 flex min-h-touch shrink-0 items-center gap-0.5 rounded-control px-2 font-ui text-sm text-grove-cream hover:text-grove-sprout ${className}`}
    >
      <ChevronLeft className="h-5 w-5" aria-hidden="true" />
      <span>Back</span>
      {where && <span className="sr-only"> to {where}</span>}
    </button>
  );
}
