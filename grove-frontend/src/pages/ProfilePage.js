import { LoadErrorPage } from '../components/LoadError';
import Loading from '../components/Loading';
import React, { useState, useEffect } from 'react';
import { cn } from '../lib/utils';
import { buttonVariants } from '../components/ui/button';
import SwitchRow from '../components/SwitchRow';
import { showDailyTrivia, writeTriviaFlag } from '../lib/dailyTrivia';
import { Dialog, DialogContent, DialogTitle } from '../components/ui/dialog';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { userAPI, statsAPI, zoneAPI, verificationAPI, badgeAPI } from '../lib/api';
import { useTooltips } from '../contexts/TooltipContext';
import { PageHeader } from '../components/PageHeader';
import { TUTORIAL_COPY } from '../components/SectionTutorial';
import { toast } from 'sonner';
import { LogOut, Sparkles, Leaf, Droplets, Sprout, HelpCircle, RefreshCw, Bell, Settings, Flower2, Trophy, RotateCcw, MapPin, Pencil, Check, ShieldCheck, BookOpen, X, ChevronRight } from 'lucide-react';
import { GROVE_BRAND } from '@/constants/brand';
import { PACT_VERSION, PACT_INTRO, PACT_SECTIONS, FINAL_COPY } from '../lib/pactContent';
import { BadgeIcon } from '../components/BadgeIcon';
import NookSettings from '../components/NookSettings';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuth();
  const [stats, setStats] = useState(null);
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [generatingPersonality, setGeneratingPersonality] = useState(false);
  const [savingPref, setSavingPref] = useState(false);

  const [savingPets, setSavingPets] = useState(false);
  const savePets = async (value) => {
    if (savingPets || user?.has_pets === value) return;
    const previous = user?.has_pets ?? null;
    updateUser({ has_pets: value });
    setSavingPets(true);
    try {
      await userAPI.updateMe({ has_pets: value });
    } catch (e) {
      updateUser({ has_pets: previous });
      toast.error("Couldn’t save that. Try again.");
    } finally {
      setSavingPets(false);
    }
  };

  const handleManualToggle = async () => {
    if (savingPref) return;
    const next = !user?.prefer_manual_plant_entry;
    setSavingPref(true);
    try {
      await userAPI.updateMe({ prefer_manual_plant_entry: next });
      updateUser({ prefer_manual_plant_entry: next });
      toast.success(next ? 'Manual entry is now your default' : 'AI identification is back on');
    } catch (e) {
      toast.error('Failed to save preference');
    } finally {
      setSavingPref(false);
    }
  };

  // Daily plant tip on Today: off until chosen. Stored on the user and mirrored locally (see lib/dailyTrivia.js).
  const [savingTrivia, setSavingTrivia] = useState(false);
  const handleTriviaToggle = async () => {
    if (savingTrivia) return;
    const next = !showDailyTrivia(user);
    setSavingTrivia(true);
    writeTriviaFlag(next);
    updateUser({ show_daily_trivia: next });
    try {
      await userAPI.updateMe({ show_daily_trivia: next });
    } catch {
      // The choice is already kept on this device; the server copy catches up on the next save.
    } finally {
      setSavingTrivia(false);
    }
    toast.success(next ? 'A daily plant tip will show on Today' : 'The daily plant tip is hidden');
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadError(false);
        const [statsRes, badgesRes] = await Promise.all([
          statsAPI.getStats(),
          userAPI.getBadges(),
        ]);
        setStats(statsRes.data);
        setBadges(badgesRes.data);
      } catch (e) {
        setLoadError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleGeneratePersonality = async () => {
    setGeneratingPersonality(true);
    try {
      const res = await userAPI.generatePersonality();
      updateUser({ personality_title: res.data.title, personality_body: res.data.body });
      toast.success('Personality generated!');
    } catch (e) {
      toast.error('Failed to generate personality');
    } finally {
      setGeneratingPersonality(false);
    }
  };

  // The slides, the quiz, then the first lesson. Replays for any account.
  const handleReplayOnboarding = () => navigate('/first-run');

  if (loadError) {
    return <LoadErrorPage title="Profile" onRetry={() => window.location.reload()} />;
  }
  if (loading) {
    return (
      <Loading label="Loading your profile" />
    );
  }

  return (
    <div>
      <PageHeader
        title="Profile"
      />

      <div className="max-w-column mx-auto px-4 py-4 space-y-4">
        {/* Identity card */}
        <div className="rounded-card border-hairline border-grove-moss bg-grove-moss p-5" data-testid="profile-identity-card">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-pill bg-grove-moss flex items-center justify-center border-hairline border-grove-moss">
              <span className="font-plant text-grove-sprout text-2xl">
                {(user?.display_name || user?.username || 'G')[0].toUpperCase()}
              </span>
            </div>
            <div>
              <h2 className="font-plant text-grove-cream text-xl">{user?.display_name || user?.username}</h2>
              <p className="font-latin text-xs text-grove-cream">@{user?.username}</p>
              <p className="font-ui text-xs text-grove-cream mt-0.5">
                {user?.tier === 'free' ? 'Free' : user?.tier?.replace('_', ' ')} tier
                {user?.location && ` · ${user.location}`}
              </p>
            </div>
          </div>
        </div>

        {/* At-a-glance: plants, care logs and this week's check-ins. No daily streak. Full stats live under Care > Growth. */}
        <div className="grid grid-cols-2 gap-2" data-testid="profile-stats-card">
          {[
            { label: 'Plants', value: stats?.total_plants || 0, icon: Leaf },
            { label: 'Care logs', value: stats?.total_care_logs || 0, icon: Droplets },
            { label: 'Check-ins this week', value: `${stats?.check_ins?.this_week || 0} of ${stats?.check_ins?.weekly_goal || 3}`, icon: Sprout, wide: true },
          ].map(({ label, value, icon: Icon, wide }) => (
            <div key={label} className={`${wide ? 'col-span-2 ' : ''}rounded-card border-hairline border-grove-moss bg-grove-moss p-5 text-center`}>
              <Icon className="h-4 w-4 mx-auto text-grove-sprout mb-1" />
              <p className="font-plant text-grove-cream text-lg">{value}</p>
              <p className="font-ui text-xs text-grove-cream">{label}</p>
            </div>
          ))}
        </div>

        {/* Personality card */}
        <div className="rounded-card border-hairline border-grove-fernLine/40 bg-grove-canopy p-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-plant text-grove-cream text-base font-semibold">Plant personality</h3>
            <button
              onClick={handleGeneratePersonality}
              disabled={generatingPersonality}
              data-testid="generate-personality-button"
              className={cn(buttonVariants({ variant: 'outline' }), "gap-1.5")}
            >
              <Sparkles className="h-3 w-3" />
              {generatingPersonality ? 'Analyzing…' : user?.personality_title ? 'Refresh' : 'Generate'}
            </button>
          </div>
          {user?.personality_title ? (
            <>
              <p className="font-plant text-grove-cream text-lg mb-1">{user.personality_title}</p>
              <p className="font-ui text-sm text-grove-sprout leading-relaxed">{user.personality_body}</p>
              <p className="mt-2 font-ui text-xs text-grove-sage">Written by AI from your care history. It is a guess, not a measurement.</p>
            </>
          ) : (
            <p className="font-ui text-xs text-grove-sage">Generate your plant personality based on your care data.</p>
          )}
        </div>

        {/* Badges — Phase 14C.3.b: 3-slot picker + link to full gallery */}
        <div
          className="rounded-card border-hairline border-grove-moss bg-grove-moss p-5"
          data-testid="profile-badges"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-plant text-grove-cream text-base font-semibold ">Featured badges</h3>
            <button
              type="button"
              onClick={() => navigate('/badges')}
              data-testid="profile-badges-view-all"
              className={cn(buttonVariants({ variant: 'outline' }))}
            >
              View all{badges.length > 0 ? ` (${badges.length})` : ''}
            </button>
          </div>
          <ProfileFeaturedBadges allBadges={badges} />
        </div>

        {/* Quick links */}
        <div className="rounded-card border-hairline border-grove-moss bg-grove-moss p-5">
          <h3 className="font-plant text-grove-cream text-base font-semibold  mb-3">Quick links</h3>
          <div className="grid grid-cols-1 gap-2">
            <button
              onClick={() => navigate('/bouquets')}
              data-testid="profile-bouquets-link"
              className={cn(buttonVariants({ variant: 'outline' }), "flex justify-start")}
            >
              <Flower2 className="h-4 w-4 text-grove-blush" />
              Bouquets
              <ChevronRight className="ml-auto h-4 w-4 text-grove-sage" aria-hidden="true" />
            </button>
                                    <button
              onClick={() => navigate('/challenges')}
              data-testid="profile-challenges-link"
              className={cn(buttonVariants({ variant: 'outline' }), "flex justify-start")}
            >
              <Trophy className="h-4 w-4 text-grove-sprout" />
              Challenges
              <ChevronRight className="ml-auto h-4 w-4 text-grove-sage" aria-hidden="true" />
            </button>
            <button
              onClick={() => navigate('/settings/notifications')}
              data-testid="profile-notifications-button"
              className={cn(buttonVariants({ variant: 'outline' }), "flex justify-start")}
            >
              <Bell className="h-4 w-4" />
              Notification Settings
              <ChevronRight className="ml-auto h-4 w-4 text-grove-sage" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Tier info */}
        <div className="rounded-card border-hairline border-grove-moss bg-grove-moss p-5">
          <h3 className="font-plant text-grove-cream text-base font-semibold  mb-2">Your tier</h3>
          <p className="font-ui text-sm text-grove-cream capitalize">{user?.tier?.replace('_', ' ') || 'Free'}</p>
          {user?.tier === 'free' && (
            <p className="font-ui text-xs text-grove-cream mt-1">
              Free tier: 15 plants, 2 active bouquets, basic care. Upgrade for unlimited plants, AI biographies, and advanced analytics.
            </p>
          )}
        </div>

        {/* Preferences */}
        <div className="rounded-card border-hairline border-grove-moss bg-grove-moss p-5" data-testid="profile-preferences">
          <h3 className="font-plant text-grove-cream text-base font-semibold  mb-3">Plant identification</h3>
          <SwitchRow
            label="Skip AI identification"
            help="Always open manual entry when adding a plant."
            checked={!!user?.prefer_manual_plant_entry}
            disabled={savingPref}
            onChange={handleManualToggle}
            testId="profile-prefer-manual-toggle"
          />
          <p className="italic font-ui text-xs font-medium text-grove-sage mt-3 leading-snug">
            For experienced growers who know their plants and prefer to enter details directly.
          </p>
        </div>

        <div className="rounded-card border-hairline border-grove-moss bg-grove-moss p-5" data-testid="profile-today-preferences">
          <h3 className="font-plant text-grove-cream text-base font-semibold mb-3">Today</h3>
          <SwitchRow
            label="Show a daily plant tip on Today"
            help="One short plant fact a day. Off unless you want it."
            checked={showDailyTrivia(user)}
            disabled={savingTrivia}
            onChange={handleTriviaToggle}
            testId="profile-daily-trivia-toggle"
          />
        </div>

        {/* Pets at home: pet owners see pet safety on their plants */}
        <div className="rounded-card border-hairline border-grove-moss bg-grove-moss p-5" data-testid="profile-pets">
          <h3 id="pets-heading" className="font-plant text-grove-cream text-base font-semibold ">Pets at home</h3>
          <p className="mt-1 font-ui text-xs text-grove-sage">If pets share your home, each plant shows whether it is safe for them.</p>
          <div role="group" aria-labelledby="pets-heading" className="mt-3 flex gap-2">
            {[[true, 'Yes, I have pets'], [false, 'No pets']].map(([value, label]) => {
              const active = user?.has_pets === value;
              return (
                <button
                  key={String(value)}
                  type="button"
                  aria-pressed={active}
                  disabled={savingPets}
                  onClick={() => savePets(value)}
                  data-testid={value ? 'profile-pets-yes' : 'profile-pets-no'}
                  className={buttonVariants({ variant: 'chip' })}
                    aria-pressed={active}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Hardiness zone — Phase 14C */}
        <div className="rounded-card border-hairline border-grove-moss bg-grove-moss p-5" data-testid="profile-zone">
          <h3 className="font-plant text-grove-cream text-base font-semibold  mb-3">Where you grow</h3>
          <HardinessZoneControls />
        </div>

        {/* Verification status — Phase 14C.3 */}
        <div className="rounded-card border-hairline border-grove-moss bg-grove-moss p-5" data-testid="profile-verification">
          <h3 className="font-plant text-grove-cream text-base font-semibold  mb-3">Verification status</h3>
          <VerificationStatusCard />
        </div>

        {/* Tutorials and tips — Phase 14A.2 */}
        <div className="rounded-card border-hairline border-grove-moss bg-grove-moss p-5" data-testid="profile-tutorials">
          <h3 className="font-plant text-grove-cream text-base font-semibold  mb-3">Tutorials and tips</h3>
          <TutorialsAndTipsControls />
        </div>

        <NookSettings />

        {/* About FloraGrove */}
        <div className="rounded-card border-hairline border-grove-moss bg-grove-moss p-5">
          <h3 className="font-plant text-grove-cream text-base font-semibold  mb-2">About FloraGrove</h3>
          <p className="font-ui text-sm text-grove-cream leading-relaxed mb-3">{GROVE_BRAND.mission}</p>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => navigate('/help')}
              data-testid="profile-help-button"
              className={cn(buttonVariants({ variant: 'outline' }), "flex")}
            >
              <HelpCircle className="h-4 w-4" />
              Help and tutorial
            </button>
            {user?.is_admin && (
            <button
                onClick={handleReplayOnboarding}
                data-testid="profile-replay-onboarding-button"
                className={cn(buttonVariants({ variant: 'outline' }), "flex")}
              >
                <RefreshCw className="h-4 w-4" />
                Replay first-run
              </button>
            )}
          </div>
        </div>

        {/* Florist Pro (conditional) */}
        {(user?.tier === 'pro' || user?.tier === 'florist_pro') && (
          <div className="rounded-card border-hairline border-grove-moss bg-grove-canopy p-5">
            <h3 className="font-plant text-grove-cream text-base font-semibold  mb-3">Florist Pro</h3>
            <button
              onClick={() => navigate('/florist')}
              data-testid="profile-florist-button"
              className="w-full rounded-control font-ui text-xs px-4 py-3 bg-grove-sun text-grove-root hover:bg-grove-sprout transition-colors duration-150"
            >
              Portfolio & Insights
            </button>
          </div>
        )}

        {/* Admin Panel (conditional) */}
        {user?.is_admin && (
          <div className="rounded-card border-hairline border-grove-bloom bg-grove-bloom/15 p-5">
            <h3 className="font-plant text-grove-blush text-base font-semibold  mb-3">Admin</h3>
            <button
              onClick={() => navigate('/admin/demo')}
              data-testid="profile-admin-button"
              className="w-full rounded-control font-ui text-xs px-4 py-3 bg-grove-bloom text-grove-root hover:bg-grove-blush transition-colors duration-150 flex items-center justify-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Demo Admin Panel
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={logout}
          data-testid="profile-logout-button"
          className={cn(buttonVariants({ variant: 'outline' }), "w-full gap-2")}
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          Sign out
        </button>
      </div>
    </div>
  );
}

// Phase 14A.2 — Tutorials and tips card content. Lives at the bottom of the
// file so the main component stays compact.
function TutorialsAndTipsControls() {
  const { user, refreshUser } = useAuth();
  const { tooltipsActive, daysRemaining, resetAll } = useTooltips();
  const [savingTip, setSavingTip] = useState(false);
  const [replayingId, setReplayingId] = useState(null);

  const tooltipsOn = user?.tooltips_enabled !== false;
  const seen = user?.tutorials_seen || [];

  const handleTooltipToggle = async () => {
    if (savingTip) return;
    setSavingTip(true);
    try {
      const nextEnabled = !tooltipsOn;
      // When re-enabling, also wipe the dismissed list so the user sees them again.
      await userAPI.updateMe({ tooltips_enabled: nextEnabled });
      if (nextEnabled) {
        await resetAll();
      }
      if (refreshUser) await refreshUser();
      toast.success(nextEnabled ? 'Tooltips on' : 'Tooltips off');
    } catch {
      toast.error('Failed to save preference');
    } finally {
      setSavingTip(false);
    }
  };

  const handleReplay = async (tutorialId) => {
    setReplayingId(tutorialId);
    try {
      await userAPI.replayTutorial(tutorialId);
      if (refreshUser) await refreshUser();
      toast.success(`${TUTORIAL_COPY[tutorialId].title} will show next time you open it`);
    } catch {
      toast.error('Failed to replay tutorial');
    } finally {
      setReplayingId(null);
    }
  };

  return (
    <>
      {/* Tooltips toggle */}
      <SwitchRow
        label="Show tooltips"
        help={tooltipsActive
          ? `${daysRemaining} day${daysRemaining === 1 ? '' : 's'} of training-wheel hints left.`
          : tooltipsOn
            ? 'Auto-hidden after your first 30 days. Turn on to bring them back.'
            : 'Turn on to see contextual hints again.'}
        checked={!!tooltipsOn}
        disabled={savingTip}
        onChange={handleTooltipToggle}
        testId="profile-tooltips-toggle"
      />

      {/* Section tutorials replay */}
      <div className="mt-4 pt-4 border-t-hairline border-grove-moss">
        <p className="font-ui text-grove-cream text-xs font-medium mb-2">Replay a section tutorial</p>
        <div className="space-y-1.5">
          {Object.keys(TUTORIAL_COPY).map((tid) => {
            const meta = TUTORIAL_COPY[tid];
            const Icon = meta.icon;
            const wasSeen = seen.includes(tid);
            return (
              <button
                key={tid}
                type="button"
                onClick={() => handleReplay(tid)}
                disabled={replayingId === tid}
                data-testid={`profile-replay-${tid}`}
                className="w-full flex items-center gap-3 rounded-small border-hairline border-grove-moss bg-grove-canopy px-4 py-3 hover:border-grove-fernLine disabled:opacity-50 transition-colors duration-150"
              >
                <span
                  className="w-8 h-8 rounded-inset flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${meta.accent}20` }}
                >
                  <Icon className="h-4 w-4" style={{ color: meta.accent }} />
                </span>
                <span className="flex-1 min-w-0 text-left">
                  <span className="font-ui text-xs font-medium text-grove-cream block">{meta.title}</span>
                  <span className="font-ui text-xs text-grove-sage block">
                    {wasSeen ? 'Tap to replay' : 'Not seen yet'}
                  </span>
                </span>
                <RotateCcw className="h-3 w-3 text-grove-sage" />
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}

// Phase 14C — Hardiness zone display + manual override.
function HardinessZoneControls() {
  const { user, refreshUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [country, setCountry] = useState(user?.location_country || 'US');
  const [postcode, setPostcode] = useState(user?.location_postcode || '');
  const [previewing, setPreviewing] = useState(false);
  const [preview, setPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [overriding, setOverriding] = useState(false);
  const [manualZone, setManualZone] = useState(user?.hardiness_zone || '');

  useEffect(() => {
    setCountry(user?.location_country || 'US');
    setPostcode(user?.location_postcode || '');
    setManualZone(user?.hardiness_zone || '');
  }, [user]);

  const previewZone = async () => {
    if (!postcode) return;
    setPreviewing(true);
    try {
      const res = await zoneAPI.lookup(country, postcode);
      setPreview(res.data);
    } catch (_e) { /* swallow */ }
    finally { setPreviewing(false); }
  };

  const saveLocation = async () => {
    setSaving(true);
    try {
      // Sending location with no zone triggers server-side auto-derivation.
      await userAPI.updateMe({
        location_country: country,
        location_postcode: postcode,
      });
      if (refreshUser) await refreshUser();
      toast.success('Location updated');
      setEditing(false);
      setPreview(null);
    } catch {
      toast.error('Failed to save location');
    } finally {
      setSaving(false);
    }
  };

  const saveHemisphere = async (hemisphere) => {
    setSaving(true);
    try {
      await userAPI.updateMe({ hemisphere });
      if (refreshUser) await refreshUser();
    } catch {
      toast.error('Couldn\u2019t save your hemisphere. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const saveOverride = async () => {
    if (!manualZone.trim()) return;
    setSaving(true);
    try {
      await userAPI.updateMe({ hardiness_zone: manualZone.trim() });
      if (refreshUser) await refreshUser();
      toast.success('Zone overridden');
      setOverriding(false);
    } catch {
      toast.error('Failed to override');
    } finally {
      setSaving(false);
    }
  };

  const zone = user?.hardiness_zone;
  const system = user?.hardiness_zone_system || 'USDA';
  const source = user?.hardiness_zone_source;
  const sourceLabel = {
    'zip-prefix': 'auto-derived from your zip code',
    'state-default': 'inferred from your state',
    'postcode-area': 'auto-derived from your UK postcode',
    'manual': 'manually set',
  }[source] || '';

  return (
    <>
      <div className="flex items-start gap-3 mb-3">
        <span className="w-8 h-8 rounded-inset bg-grove-moss flex items-center justify-center flex-shrink-0">
          <MapPin className="h-4 w-4 text-grove-sprout" />
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-ui text-grove-cream text-sm font-medium">
            {zone ? (
              <>
                {system === 'USDA' ? `USDA Zone ${zone}` : `RHS ${zone}`}
                {' '}
                <span className="font-latin italic text-xs text-grove-sage">
                  {user.location_postcode ? `\u00b7 ${user.location_postcode}` : ''}
                </span>
              </>
            ) : (
              <span className="text-grove-sage">Add your location to see your hardiness zone</span>
            )}
          </p>
          {sourceLabel && (
            <p className="font-ui text-xs text-grove-sage mt-0.5" data-testid="zone-source-label">
              {sourceLabel}
            </p>
          )}
        </div>
      </div>

      <div className="mb-3" role="group" aria-labelledby="hemisphere-label" data-testid="profile-hemisphere">
        <p id="hemisphere-label" className="font-ui text-sm text-grove-cream">Hemisphere</p>
        <p className="font-ui text-sm text-grove-sage">The seasons run the other way in the south, so seasonal tips follow this.</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {[['north', 'Northern'], ['south', 'Southern']].map(([id, label]) => (
            <button
              key={id}
              type="button"
              aria-pressed={user?.hemisphere === id}
              disabled={saving}
              onClick={() => saveHemisphere(id)}
              data-testid={`profile-hemisphere-${id}`}
              className={buttonVariants({ variant: 'chip' })}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {!editing && !overriding && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setEditing(true)}
            data-testid="zone-edit-location"
            className={cn(buttonVariants({ variant: 'outline' }), "flex-1 flex gap-1")}
          >
            <Pencil className="h-3 w-3" />
            {zone ? 'Update location' : 'Add location'}
          </button>
          {zone && (
            <button
              type="button"
              onClick={() => setOverriding(true)}
              data-testid="zone-override"
              className={cn(buttonVariants({ variant: 'outline' }), "flex-1")}
            >
              Override zone
            </button>
          )}
        </div>
      )}

      {editing && (
        <div className="space-y-2" data-testid="zone-edit-form">
          <div className="flex gap-2">
            <select aria-label="Country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              data-testid="zone-country-select"
              className="bg-grove-canopy border-hairline border-grove-moss rounded-tag px-2 py-2 text-xs font-ui text-grove-cream"
            >
              <option value="US">United States</option>
              <option value="UK">United Kingdom</option>
            </select>
            <input aria-label="Postcode"
              value={postcode}
              onChange={(e) => setPostcode(e.target.value)}
              onBlur={previewZone}
              placeholder={country === 'UK' ? 'e.g. SW1A 1AA' : 'e.g. 10001'}
              data-testid="zone-postcode-input"
              className="flex-1 bg-grove-canopy border-hairline border-grove-moss rounded-tag px-3 py-2 text-xs font-ui text-grove-cream placeholder:text-grove-sage focus:outline-none focus:ring-2 focus:ring-grove-lime"
            />
          </div>
          {previewing && <p className="font-ui text-xs text-grove-sage">Looking up…</p>}
          {preview?.zone && (
            <div className="rounded-inset bg-grove-moss border-hairline border-grove-fernLine p-2">
              <p className="font-ui text-xs font-medium text-grove-cream">
                {preview.system === 'USDA' ? `USDA Zone ${preview.zone}` : `RHS ${preview.zone}`}
              </p>
              {preview.description && (
                <p className="font-latin italic text-xs text-grove-sage mt-0.5">{preview.description}</p>
              )}
            </div>
          )}
          {preview && !preview.zone && postcode && (
            <p className="font-ui text-xs text-grove-sun">Couldn&apos;t find a match. You can still save and override below.</p>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setEditing(false); setPreview(null); }}
              data-testid="zone-edit-cancel"
              className={cn(buttonVariants({ variant: 'outline' }), "flex-1")}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={saveLocation}
              disabled={saving}
              data-testid="zone-edit-save"
              className={cn(buttonVariants(), "flex-1 disabled:opacity-50 transition-colors duration-150 flex items-center justify-center gap-1")}
            >
              <Check className="h-3 w-3" />
              {saving ? 'Saving\u2026' : 'Save'}
            </button>
          </div>
        </div>
      )}

      {overriding && (
        <div className="space-y-2" data-testid="zone-override-form">
          <p className="font-ui text-xs text-grove-sage leading-snug">
            If your microclimate doesn&apos;t match the auto-derived zone (mountain valley, urban heat island, sheltered coast), you can set it manually here.
          </p>
          <input aria-label="Hardiness zone"
            value={manualZone}
            onChange={(e) => setManualZone(e.target.value)}
            placeholder="e.g. 7b or H4"
            data-testid="zone-manual-input"
            className="w-full bg-grove-canopy border-hairline border-grove-moss rounded-tag px-3 py-2 text-xs font-ui text-grove-cream placeholder:text-grove-sage focus:outline-none focus:ring-2 focus:ring-grove-lime"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setOverriding(false)}
              data-testid="zone-override-cancel"
              className={cn(buttonVariants({ variant: 'outline' }), "flex-1")}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={saveOverride}
              disabled={saving || !manualZone.trim()}
              data-testid="zone-override-save"
              className={cn(buttonVariants(), "flex-1 disabled:opacity-50 transition-colors duration-150")}
            >
              {saving ? 'Saving\u2026' : 'Set manually'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// ====== Phase 14C.3 — Verification status card + read-only pact reader ======

function VerificationStatusCard() {
  const navigate = useNavigate();
  const [v, setV] = useState(null);
  const [loading, setLoading] = useState(true);
  const [readerOpen, setReaderOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await verificationAPI.status();
        if (alive) setV(res.data);
      } catch (e) {
        // non-fatal
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  if (loading) {
    return (
      <div className="font-ui text-xs text-grove-sage" data-testid="verification-loading">
        Loading verification status…
      </div>
    );
  }

  const isVerified = !!(v?.verified_user || v?.is_verified);
  const needsRe = !!v?.needs_reverification;

  return (
    <>
      <div className="space-y-3" data-testid="verification-status-card">
        <div
          className={`rounded-small border-hairline px-4 py-3 flex items-start gap-3 ${
            isVerified && !needsRe
              ? 'bg-grove-moss border-grove-fernLine'
              : 'bg-grove-canopy border-grove-moss'
          }`}
        >
          <ShieldCheck className={`h-5 w-5 mt-0.5 flex-shrink-0 ${isVerified && !needsRe ? 'text-grove-sprout' : 'text-grove-sage'}`} />
          <div className="flex-1 min-w-0">
            {isVerified && !needsRe ? (
              <>
                <p className="font-ui text-sm font-medium text-grove-cream" data-testid="verification-state-verified">
                  You're verified
                </p>
                <p className="font-ui text-xs text-grove-sage mt-0.5">
                  {v.verified_at
                    ? `Pact signed ${new Date(v.verified_at).toLocaleDateString()}.`
                    : v.pact_signed_at
                      ? `Pact signed ${new Date(v.pact_signed_at).toLocaleDateString()}.`
                      : 'Verified by FloraGrove.'}
                  {' '}Pact v{v.verification_pact_version || PACT_VERSION}.
                </p>
              </>
            ) : needsRe ? (
              <>
                <p className="font-ui text-sm font-medium text-grove-sun" data-testid="verification-state-needs-reverify">
                  Re-verification needed
                </p>
                <p className="font-ui text-xs text-grove-sage mt-0.5">
                  The community pact has been updated. Re-sign before your next swap.
                </p>
              </>
            ) : (
              <>
                <p className="font-ui text-sm font-medium text-grove-cream" data-testid="verification-state-unverified">
                  Not yet verified
                </p>
                <p className="font-ui text-xs text-grove-sage mt-0.5">
                  Sign the 8-section community pact to unlock swaps once you've been on FloraGrove for 3 months and have an active Pro subscription.
                </p>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          {(!isVerified || needsRe) && (
            <button
              type="button"
              onClick={() => navigate('/verify')}
              data-testid="verification-start-btn"
              className={cn(buttonVariants())}
            >
              {needsRe ? 'Re-verify' : 'Start verification'}
            </button>
          )}
          <button
            type="button"
            onClick={() => setReaderOpen(true)}
            data-testid="verification-read-pact-btn"
            className={cn(buttonVariants({ variant: 'outline' }), "gap-1.5")}
          >
            <BookOpen className="h-3.5 w-3.5" />
            Read community guidelines
          </button>
        </div>
      </div>

      {readerOpen && <PactReaderModal onClose={() => setReaderOpen(false)} />}
    </>
  );
}

function PactReaderModal({ onClose }) {
  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent
        showClose={false}
        aria-describedby={undefined}
        data-testid="pact-reader-modal"
        className="flex max-h-sheet max-w-sheet flex-col gap-0 overflow-hidden p-0"
      >
        <div className="flex items-start justify-between p-5 border-b-hairline border-grove-moss">
          <div className="flex-1 min-w-0">
            <DialogTitle className="text-lg">{PACT_INTRO.heading}</DialogTitle>
            <p className="font-latin italic text-xs text-grove-lichen mt-1">
              Pact v{PACT_VERSION} — read-only view
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            data-testid="pact-reader-close"
            className="flex-shrink-0 p-1.5 rounded-tag hover:bg-grove-moss text-grove-sage transition-colors duration-150"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-y-auto p-5 space-y-4">
          <p className="font-ui text-xs text-grove-cream leading-relaxed">{PACT_INTRO.body}</p>

          {PACT_SECTIONS.map((s) => (
            <section key={s.number} className="rounded-chip border-hairline border-grove-moss bg-grove-canopy p-4">
              <h4 className="font-ui text-sm font-medium text-grove-cream mb-2">
                {s.number}. {s.title}
              </h4>
              {s.bodyAsList ? (
                <ul className="space-y-1.5 font-ui text-xs text-grove-cream leading-relaxed">
                  {s.body.map((line, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-grove-sprout flex-shrink-0">•</span>
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="space-y-2 font-ui text-xs text-grove-cream leading-relaxed">
                  {s.body.map((p, i) => <p key={i}>{p}</p>)}
                </div>
              )}
              <p className="font-ui italic text-xs font-medium text-grove-sprout mt-3">
                {s.acknowledgement}
              </p>
            </section>
          ))}

          <blockquote className="rounded-chip border-hairline border-grove-fernLine bg-grove-moss p-4">
            <p className="font-ui italic text-xs font-medium text-grove-cream leading-relaxed">
              "{FINAL_COPY.oath}"
            </p>
          </blockquote>
        </div>
      </DialogContent>
    </Dialog>
  );
}



// ====== Phase 14C.3.b — Featured badges (3-slot display) ======

function ProfileFeaturedBadges({ allBadges = [] }) {
  const navigate = useNavigate();
  const [catalog, setCatalog] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await badgeAPI.catalog();
        if (alive) setCatalog(res.data);
      } catch (e) { /* non-fatal */ }
    })();
    return () => { alive = false; };
  }, []);

  if (!catalog) {
    // Fallback while catalog loads — show first 3 earned badges from /badges
    if (allBadges.length === 0) {
      return (
        <p className="font-latin italic text-xs text-grove-lichen">
          No badges yet — log your first care action to start earning.
        </p>
      );
    }
    return (
      <div className="grid grid-cols-3 gap-2">
        {allBadges.slice(0, 3).map(({ badge }) => (
          <div
            key={badge?.id}
            className="rounded-chip border-hairline border-grove-moss bg-grove-canopy p-3 flex flex-col items-center text-center"
          >
            <span className="w-10 h-10 rounded-pill bg-grove-moss flex items-center justify-center mb-1">
              <BadgeIcon name={badge?.icon} className="h-5 w-5 text-grove-sprout" />
            </span>
            <p className="font-ui text-xs font-medium text-grove-cream leading-tight">
              {badge?.name}
            </p>
          </div>
        ))}
      </div>
    );
  }

  const displayed = catalog.displayed || [];
  const items = displayed.map((slug) => catalog.items.find((it) => it.slug === slug)).filter(Boolean);

  if (items.length === 0 && catalog.earned_count === 0) {
    return (
      <p className="font-latin italic text-xs text-grove-lichen" data-testid="profile-badges-empty">
        No badges yet — log your first care action to start earning.
      </p>
    );
  }

  if (items.length === 0) {
    return (
      <button
        type="button"
        onClick={() => navigate('/badges')}
        data-testid="profile-badges-pick-cta"
        className="w-full rounded-chip border-hairline border-dashed border-grove-fernLine bg-grove-moss p-4 text-center hover:bg-grove-canopy transition-colors duration-150"
      >
        <p className="font-ui text-grove-cream text-sm font-medium">Pick up to 3 to display</p>
        <p className="font-latin italic text-xs text-grove-sage mt-0.5">
          You've earned {catalog.earned_count} of {catalog.total} badges. Choose your favorites.
        </p>
      </button>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2" data-testid="profile-featured-badges">
      {items.map((it) => (
        <div
          key={it.slug}
          className="rounded-chip border-hairline border-grove-fernLine bg-grove-canopy p-3 flex flex-col items-center text-center"
          data-testid={`profile-featured-badge-${it.slug}`}
        >
          <span className="w-10 h-10 rounded-pill bg-grove-moss flex items-center justify-center mb-1">
            <BadgeIcon name={it.icon} className="h-5 w-5 text-grove-sprout" />
          </span>
          <p className="font-ui text-xs font-medium text-grove-cream leading-tight">
            {it.name}
          </p>
          {it.tier && (
            <span className="font-ui text-xs font-medium text-grove-sage mt-0.5">
              {it.tier}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

