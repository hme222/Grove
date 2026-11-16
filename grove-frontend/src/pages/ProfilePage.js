import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, HelpCircle, Info, RefreshCw, Settings, BookOpen, RotateCcw, Sprout, Home, Leaf, Bell, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { buttonVariants } from '../components/ui/button';
import { useAuth } from '../contexts/AuthContext';
import { notificationAPI } from '../lib/api';
import { usePipPrefs } from '../lib/pipPrefs';
import { ZIP_ZONE_ENABLED } from '../lib/features';
import { PageHeader } from '../components/PageHeader';
import SettingsSheet from '../components/profile/SettingsSheet';
import TutorialsSheetBody from '../components/profile/TutorialsSheetBody';
import CareStyleSheetBody from '../components/profile/CareStyleSheetBody';
import HomeSheetBody from '../components/profile/HomeSheetBody';
import PipSheetBody from '../components/profile/PipSheetBody';
import AboutSheetBody from '../components/profile/AboutSheetBody';
import tileStates from '../components/profile/tileStates';

// Six tiles. Lessons and Notifications go to their own pages; the rest open a settings sheet.
const TILES = [
  { id: 'lessons', label: 'Lessons', icon: BookOpen, state: 'lessons', to: '/lessons' },
  { id: 'tutorials', label: 'Tutorials', icon: RotateCcw, state: 'tutorials', sheet: 'tutorials' },
  { id: 'care-style', label: 'Care style', icon: Sprout, state: 'careStyle', sheet: 'care-style' },
  { id: 'home', label: 'Your home', icon: Home, state: 'home', sheet: 'home' },
  { id: 'pip', label: 'Pip', icon: Leaf, state: 'pip', sheet: 'pip' },
  { id: 'notifications', label: 'Notifications', icon: Bell, state: 'notifications', to: '/settings/notifications' },
];

const SHEETS = [
  { id: 'tutorials', title: 'Tutorials', Body: TutorialsSheetBody },
  { id: 'care-style', title: 'Care style', Body: CareStyleSheetBody },
  { id: 'home', title: 'Your home', Body: HomeSheetBody },
  { id: 'pip', title: 'Pip', Body: PipSheetBody },
  { id: 'about', title: 'About FloraGrove', Body: AboutSheetBody },
];

const ROW = cn(buttonVariants({ variant: 'outline' }), 'flex w-full justify-start');

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { pipOn, peeksPref } = usePipPrefs();
  const [notifPrefs, setNotifPrefs] = useState(null);
  const [openSheet, setOpenSheet] = useState(null);
  const titleRef = useRef(null);
  // One ref per opener (each tile that opens a sheet, and the About row), so focus goes back to it on close.
  const openers = useRef(null);
  if (!openers.current) openers.current = Object.fromEntries(SHEETS.map((s) => [s.id, React.createRef()]));

  // Only for the Notifications state line. Nothing waits on it; a failure keeps the plain description.
  useEffect(() => {
    let alive = true;
    Promise.resolve(notificationAPI.getPreferences())
      .then((res) => { if (alive && res && res.data) setNotifPrefs(res.data); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  const states = tileStates(user, { pipOn, peeksPref, notifPrefs, zipZone: ZIP_ZONE_ENABLED });
  const closeSheet = () => setOpenSheet(null);
  const isPro = user?.tier === 'pro' || user?.tier === 'florist_pro';

  return (
    <div>
      <PageHeader title="Profile" titleRef={titleRef} />

      <div className="max-w-column mx-auto px-4 py-4 space-y-4">
        <div className="rounded-card border-hairline border-grove-moss bg-grove-moss p-5" data-testid="profile-identity-card">
          <div className="flex items-center gap-4">
            <div aria-hidden="true" className="w-16 h-16 shrink-0 rounded-pill bg-grove-moss flex items-center justify-center border-hairline border-grove-moss">
              <span className="font-plant text-grove-sprout text-2xl">
                {(user?.display_name || user?.username || 'G')[0].toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <h2 className="font-plant text-grove-cream text-xl break-words">{user?.display_name || user?.username}</h2>
              <p className="font-latin text-xs text-grove-cream break-words">@{user?.username}</p>
              {user?.location && <p className="font-ui text-xs text-grove-cream mt-0.5 break-words">{user.location}</p>}
            </div>
          </div>
        </div>

        {/* Layout rule, not a token value: the 10rem minimum is in rem so the grid is two columns at default text
            and drops to one column at 200% text. */}
        <div className="grid gap-3 grid-cols-[repeat(auto-fit,minmax(10rem,1fr))]" data-testid="profile-tiles">
          {TILES.map(({ id, label, icon: Icon, state, to, sheet }) => (
            <button
              key={id}
              type="button"
              ref={sheet ? openers.current[sheet] : undefined}
              onClick={() => (to ? navigate(to) : setOpenSheet(sheet))}
              data-testid={`profile-tile-${id}`}
              className="flex min-h-touch flex-col items-start gap-1 rounded-card border-hairline border-grove-moss bg-grove-canopy p-4 text-left hover:border-grove-fernLine transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-grove-lime"
            >
              <Icon className="h-5 w-5 shrink-0 text-grove-sprout" aria-hidden="true" />
              <span data-testid={`profile-tile-${id}-label`} className="font-plant text-base text-grove-cream break-words">{label}</span>
              <span data-testid={`profile-tile-${id}-state`} className="font-ui text-xs text-grove-sage break-words">{states[state]}</span>
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <button type="button" onClick={() => navigate('/help')} data-testid="profile-help-button" className={ROW}>
            <HelpCircle className="h-4 w-4" aria-hidden="true" />
            Help and tutorial
            <ChevronRight className="ml-auto h-4 w-4 text-grove-sage" aria-hidden="true" />
          </button>
          <button
            type="button"
            ref={openers.current.about}
            onClick={() => setOpenSheet('about')}
            data-testid="profile-about-tile"
            className={ROW}
          >
            <Info className="h-4 w-4" aria-hidden="true" />
            About FloraGrove
            <ChevronRight className="ml-auto h-4 w-4 text-grove-sage" aria-hidden="true" />
          </button>
        </div>

        <button
          type="button"
          onClick={logout}
          data-testid="profile-logout-button"
          className={cn(buttonVariants({ variant: 'outline' }), 'w-full gap-2')}
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          Sign out
        </button>

        {isPro && (
          <div className="rounded-card border-hairline border-grove-moss bg-grove-canopy p-5">
            <h3 className="font-plant text-grove-cream text-base font-semibold mb-3">Florist Pro</h3>
            <button
              type="button"
              onClick={() => navigate('/florist')}
              data-testid="profile-florist-button"
              className="w-full rounded-control font-ui text-xs px-4 py-3 bg-grove-sun text-grove-root hover:bg-grove-sprout transition-colors duration-150"
            >
              Portfolio & Insights
            </button>
          </div>
        )}

        {user?.is_admin && (
          <div className="rounded-card border-hairline border-grove-bloom bg-grove-bloom/15 p-5">
            <h3 className="font-plant text-grove-blush text-base font-semibold mb-3">Admin</h3>
            <div className="flex flex-col gap-2">
              {/* The slides, the quiz, then the first lesson. */}
              <button
                type="button"
                onClick={() => navigate('/first-run')}
                data-testid="profile-replay-onboarding-button"
                className={cn(buttonVariants({ variant: 'outline' }), 'flex')}
              >
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                Replay first-run
              </button>
              <button
                type="button"
                onClick={() => navigate('/admin/demo')}
                data-testid="profile-admin-button"
                className="w-full rounded-control font-ui text-xs px-4 py-3 bg-grove-bloom text-grove-root hover:bg-grove-blush transition-colors duration-150 flex items-center justify-center gap-2"
              >
                <Settings className="h-4 w-4" aria-hidden="true" />
                Demo Admin Panel
              </button>
            </div>
          </div>
        )}
      </div>

      {SHEETS.map(({ id, title, Body }) => (
        <SettingsSheet
          key={id}
          open={openSheet === id}
          onClose={closeSheet}
          title={title}
          testId={`${id}-sheet`}
          opener={openers.current[id]}
          fallbackFocus={titleRef}
        >
          <Body />
        </SettingsSheet>
      ))}
    </div>
  );
}
