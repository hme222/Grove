import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Leaf, Sun, Users, BookOpen } from 'lucide-react';

const tabs = [
  { path: '/care/today', match: (p) => p === '/' || p.startsWith('/care') || p.startsWith('/help-my-plant') || p.startsWith('/search'), icon: Sun, label: 'Today', testid: 'bottom-tab-care' },
  { path: '/plants', match: (p) => p === '/plants' || p.startsWith('/plants/') || p.startsWith('/bouquets') || p === '/add-plant' || p.startsWith('/wishlist') || p.startsWith('/wants') || p === '/rooms', icon: Leaf, label: 'Plants', testid: 'bottom-tab-collection' },
  { path: '/greenhouse', match: (p) => p.startsWith('/greenhouse') || p.startsWith('/encyclopedia') || p.startsWith('/species') || p.startsWith('/guilds') || p.startsWith('/lessons'), icon: BookOpen, label: 'Learn', testid: 'bottom-tab-greenhouse' },
  { path: '/feed', match: (p) => p === '/feed' || p.startsWith('/groves') || p.startsWith('/swap') || p.startsWith('/verify'), icon: Users, label: 'Community', testid: 'bottom-tab-grove' },
];

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav aria-label="Main" className="fixed bottom-0 left-0 right-0 z-50 bg-grove-forest border-t-[0.5px] border-grove-moss pb-[env(safe-area-inset-bottom)]" data-testid="bottom-nav">
      <div className="mx-auto max-w-[1100px] px-4">
        <div className="flex items-center justify-around">
          {tabs.map(({ path, match, icon: Icon, label, testid }) => {
            const isActive = match(location.pathname);
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                data-testid={testid}
                aria-current={isActive ? 'page' : undefined}
                className={`flex flex-col items-center justify-center gap-1 py-3 px-4 text-[12px] font-ui min-w-[64px] min-h-[56px] transition-colors duration-150 ${
                  isActive ? 'text-grove-cream' : 'text-grove-cream opacity-60'
                }`}
              >
                <Icon className="h-5 w-5" strokeWidth={isActive ? 2.2 : 1.5} />
                <span className={isActive ? 'font-medium' : ''}>{label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
