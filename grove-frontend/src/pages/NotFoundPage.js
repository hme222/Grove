import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { cn } from '../lib/utils';
import { buttonVariants } from '../components/ui/button';

// Shown for any address the app does not know, instead of silently redirecting.
export default function NotFoundPage({ title = 'Page not found', heading = 'We can\u2019t find that page', message = 'The link may be old or mistyped. Your plants and everything you saved are safe.', to = '/care/today', toLabel = 'Go to Today' }) {
  const navigate = useNavigate();
  return (
    <div className="pb-24" data-testid="not-found-page">
      <PageHeader title={title} back={to !== '/care/today' ? { to, where: toLabel.replace(/^Back to /, '') } : true} />
      <div className="mx-auto max-w-page px-4 py-6">
        <div className="mx-auto max-w-form rounded-card border-hairline border-grove-moss bg-grove-canopy p-5 text-center">
          <Compass className="mx-auto h-8 w-8 text-grove-sage" aria-hidden="true" />
          <h2 className="mt-3 font-plant text-2xl text-grove-cream">{heading}</h2>
          <p className="mt-2 font-ui text-sm leading-relaxed text-grove-sage">
            {message}
          </p>
          <button
            type="button"
            onClick={() => navigate(to, { replace: true })}
            data-testid="not-found-home"
            className={cn(buttonVariants(), "mt-5")}
          >
            {toLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
