import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Leaf, Droplets, Users, BookOpen } from 'lucide-react';

const tabs = [
  { path: '/', match: (p) => p === '/' || p.startsWith('/plants') || p.startsWith('/bouquets') || p === '/add-plant' || p.startsWith('/wishlist'), icon: Leaf, label: 'Collection', testid: 'bottom-tab-collection' },
  { path: '/care/today', match: (p) => p.startsWith('/care'), icon: Droplets, label: 'Care', testid: 'bottom-tab-care' },
  { path: '/feed', match: (p) => p === '/feed' || p.startsWith('/groves') || p.startsWith('/swap'), icon: Users, label: 'Grove', testid: 'bottom-tab-grove' },
  { path: '/greenhouse', match: (p) => p.startsWith('/greenhouse') || p.startsWith('/encyclopedia') || p.startsWith('/species'), icon: BookOpen, label: 'Greenhouse', testid: 'bottom-tab-greenhouse' },
];

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#F5F0E8] border-t-[0.5px] border-[#D3C9B8]" data-testid="bottom-nav">
      <div className="mx-auto max-w-[1100px] px-4">
        <div className="flex items-center justify-around">
          {tabs.map(({ path, match, icon: Icon, label, testid }) => {
            const isActive = match(location.pathname);
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                data-testid={testid}
                className={`flex flex-col items-center justify-center gap-1 py-3 px-4 text-[11px] font-ui min-w-[64px] transition-colors duration-150 ${
                  isActive ? 'text-[#1C2E10]' : 'text-[#2B2B26] opacity-60'
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
