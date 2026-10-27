import React from 'react';
import { useLocation } from 'react-router-dom';
import AppLink from './AppLink';
import { Leaf, Sun, Users, BookOpen } from 'lucide-react';

const tabs = [
  { path: '/care/today', match: (p) => p === '/' || p.startsWith('/care') || p.startsWith('/help-my-plant') || p.startsWith('/search'), icon: Sun, label: 'Today', testid: 'bottom-tab-care' },
  { path: '/plants', match: (p) => p === '/plants' || p.startsWith('/plants/') || p.startsWith('/bouquets') || p === '/add-plant' || p.startsWith('/wants') || p === '/rooms', icon: Leaf, label: 'Plants', testid: 'bottom-tab-collection' },
  { path: '/greenhouse', match: (p) => p.startsWith('/greenhouse') || p.startsWith('/encyclopedia') || p.startsWith('/species') || p.startsWith('/guilds') || p.startsWith('/lessons'), icon: BookOpen, label: 'Learn', testid: 'bottom-tab-greenhouse' },
  { path: '/feed', match: (p) => p === '/feed' || p.startsWith('/groves') || p.startsWith('/swap') || p.startsWith('/verify') || p.startsWith('/wishlist'), icon: Users, label: 'Community', testid: 'bottom-tab-grove' },
];

export default function BottomNav() {
  const location = useLocation();

  return (
    <nav id="main-nav" tabIndex={-1} aria-label="Main" className="fixed bottom-0 left-0 right-0 z-nav box-border min-h-nav bg-grove-forest border-t-hairline border-grove-moss pb-safe" data-testid="bottom-nav">
      <div className="mx-auto max-w-page px-4">
        <div className="grid grid-cols-4">
          {tabs.map(({ path, match, icon: Icon, label, testid }) => {
            const isActive = match(location.pathname);
            return (
              <AppLink
                key={path}
                to={path}
                data-testid={testid}
                aria-current={isActive ? 'page' : undefined}
                className={`relative flex min-h-row flex-col items-center justify-center gap-1 px-2 py-3 font-ui text-xs transition-colors duration-150 ${
                  isActive ? 'text-grove-cream' : 'text-grove-sage'
                }`}
              >
                {isActive && <span aria-hidden="true" className="absolute inset-x-6 top-0 h-0.5 rounded-pill bg-grove-lime" />}
                <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 1.5} />
                <span className={`text-center leading-tight ${isActive ? 'font-bold' : ''}`}>{label}</span>
              </AppLink>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
