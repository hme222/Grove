import React from 'react';
import { cn } from '../lib/utils';
import { buttonVariants } from './ui/button';
import { useNavigate, useLocation } from 'react-router-dom';
import { User } from 'lucide-react';
import NotificationBell from './NotificationBell';
import BackButton from './BackButton';
import PhotoBand from './PhotoBand';

// One header for every screen: [Back] Title ... [page action] [bell] [profile].
// `back` is true (step back in history) or { to, where } (go to a named place).
export function PageHeader({ title, rightContent, children, hideBell, hideProfile, back }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const onProfile = pathname === '/profile';

  // One title per screen for the tab strip and screen-reader history (WCAG 2.4.2).
  React.useEffect(() => {
    if (typeof title === 'string' && title) document.title = `${title} · FloraGrove`;
  }, [title]);
  return (
    <header className="sticky top-0 z-sticky bg-grove-forest border-b-hairline border-grove-moss">
      <div className="max-w-page mx-auto px-4 py-3">
        {/* Wraps instead of running off the edge when the reader’s text is large. */}
        <div className="flex flex-wrap items-start justify-between gap-x-2 gap-y-1">
          <div className="flex min-w-0 flex-1 basis-28 items-center gap-2">
            {back && <BackButton {...(back === true ? {} : back)} />}
            <h1 id="page-title" className="flex min-h-touch items-center font-plant text-grove-cream text-2xl leading-tight break-words"><span className="line-clamp-2 overflow-hidden">{title}</span></h1>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            {rightContent}
            {!hideBell && <NotificationBell />}
            {!hideProfile && !onProfile && (
              <button
                type="button"
                onClick={() => navigate('/profile')}
                aria-label="Profile"
                data-testid="header-profile-button"
                className="w-touch h-touch rounded-pill border-hairline border-grove-moss bg-grove-canopy text-grove-cream hover:border-grove-fernLine flex items-center justify-center"
              >
                <User className="h-4 w-4" />
              </button>
            )}
            {onProfile && !hideProfile && <span aria-hidden="true" className="h-touch w-touch" />}
          </div>
        </div>
        {children}
      </div>
    </header>
  );
}

// The one page action in a header: outline, 44px, with an optional leading icon. A filled
// (lime) button is reserved for the main action inside the page body, never the header.
export const HeaderAction = React.forwardRef(function HeaderAction({ icon: Icon, children, pressed, className = '', ...props }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      aria-pressed={pressed}
      className={cn(buttonVariants({ variant: pressed ? 'default' : 'outline' }), 'flex gap-1.5', className)}
      {...props}
    >
      {Icon && <Icon className="h-4 w-4" aria-hidden="true" />}
      {children}
    </button>
  );
});

export function FilterChips({ filters, active, onChange, className = '' }) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {filters.map(({ value, label }) => (
        <button
          key={value}
          onClick={() => onChange(value)}
          aria-pressed={active === value}
          data-testid={`filter-chip-${value}`}
          className={cn(buttonVariants({ variant: 'chip' }))}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export function EmptyState({ title, description, action, photo }) {
  return (
    <div className={`rounded-card border-hairline border-grove-moss bg-grove-moss text-center my-8 ${photo ? 'overflow-hidden' : 'p-5'}`}>
      {photo && <PhotoBand src={photo} className="rounded-none" ratio="band" />}
      <div className={photo ? 'p-5' : ''}>
        <p className="font-plant text-grove-cream text-base mb-1">{title}</p>
        <p className="text-sm font-ui text-grove-cream mb-4">{description}</p>
        {action}
      </div>
    </div>
  );
}
