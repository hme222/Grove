import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { userAPI, statsAPI, zoneAPI, verificationAPI, badgeAPI } from '../lib/api';
import { useTooltips } from '../contexts/TooltipContext';
import { PageHeader } from '../components/PageHeader';
import { TUTORIAL_COPY } from '../components/SectionTutorial';
import { toast } from 'sonner';
import { LogOut, Sparkles, Leaf, Flame, HelpCircle, RefreshCw, Bell, Settings, Flower2, Trophy, Scissors, Repeat, RotateCcw, MapPin, Pencil, Check, ShieldCheck, BookOpen, X } from 'lucide-react';
import { GROVE_BRAND } from '@/constants/brand';
import { PACT_VERSION, PACT_INTRO, PACT_SECTIONS, FINAL_COPY } from '../lib/pactContent';
import { BadgeIcon } from '../components/BadgeIcon';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuth();
  const [stats, setStats] = useState(null);
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generatingPersonality, setGeneratingPersonality] = useState(false);
  const [savingPref, setSavingPref] = useState(false);

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, badgesRes] = await Promise.all([
          statsAPI.getStats(),
          userAPI.getBadges(),
        ]);
        setStats(statsRes.data);
        setBadges(badgesRes.data);
      } catch (e) {
        toast.error('Failed to load profile data');
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

  const handleReplayOnboarding = async () => {
    try {
      await userAPI.updateMe({ onboarding_complete: false });
      window.location.reload();
    } catch (e) {
      toast.error('Failed to reset onboarding');
    }
  };

  const badgeIcons = {
    leaf: Leaf, flame: Flame, crown: Sparkles,
    heart: Leaf, flower: Leaf,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-6 h-6 border-2 border-[#3B6D11] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Profile"
        rightContent={
          <button
            onClick={logout}
            data-testid="profile-logout-button"
            className="rounded-[2px] font-plant uppercase tracking-[0.08em] text-[10px] px-3 py-2 border-[0.5px] border-[#D3C9B8] text-[#E24B4A] hover:bg-[#E24B4A] hover:text-[#F5F0E8] transition-colors duration-150 flex items-center gap-1.5"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign Out
          </button>
        }
      />

      <div className="max-w-[600px] mx-auto px-4 py-4 space-y-4">
        {/* Identity card */}
        <div className="rounded-[14px] border-[0.5px] border-[#D3C9B8] bg-[#EDE5D8] p-4" data-testid="profile-identity-card">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[#EAF3DE] flex items-center justify-center border-[0.5px] border-[#D3C9B8]">
              <span className="font-plant text-[#3B6D11] text-2xl">
                {(user?.display_name || user?.username || 'G')[0].toUpperCase()}
              </span>
            </div>
            <div>
              <h2 className="font-plant text-[#1C2E10] text-xl">{user?.display_name || user?.username}</h2>
              <p className="font-latin text-[10px] text-[#2B2B26]">@{user?.username}</p>
              <p className="font-ui text-xs text-[#2B2B26] mt-0.5">
                {user?.tier === 'free' ? 'Free' : user?.tier?.replace('_', ' ')} tier
                {user?.location && ` · ${user.location}`}
              </p>
            </div>
          </div>
        </div>

        {/* At-a-glance: Plants + Streak only. Full stats live under Care > Growth. */}
        <div className="grid grid-cols-2 gap-2" data-testid="profile-stats-card">
          {[
            { label: 'Plants', value: stats?.total_plants || 0, icon: Leaf },
            { label: 'Streak', value: `${stats?.current_streak || 0}d`, icon: Flame },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="rounded-[14px] border-[0.5px] border-[#D3C9B8] bg-[#EDE5D8] p-3 text-center">
              <Icon className="h-4 w-4 mx-auto text-[#3B6D11] mb-1" />
              <p className="font-plant text-[#1C2E10] text-lg">{value}</p>
              <p className="font-ui text-[9px] text-[#2B2B26] uppercase tracking-[0.12em]">{label}</p>
            </div>
          ))}
        </div>

        {/* Personality card */}
        <div className="rounded-[14px] border-[0.5px] border-[#D3C9B8] bg-[#1C2E10] p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-plant text-[#9FE1CB] text-sm">Plant Personality</h3>
            <button
              onClick={handleGeneratePersonality}
              disabled={generatingPersonality}
              data-testid="generate-personality-button"
              className="rounded-[2px] font-plant uppercase tracking-[0.08em] text-[10px] px-3 py-1.5 border-[0.5px] border-[#5DCAA5] text-[#9FE1CB] hover:bg-[#2D5016] disabled:opacity-50 transition-colors duration-150 flex items-center gap-1"
            >
              <Sparkles className="h-3 w-3" />
              {generatingPersonality ? 'Analyzing...' : user?.personality_title ? 'Refresh' : 'Generate'}
            </button>
          </div>
          {user?.personality_title ? (
            <>
              <p className="font-plant text-[#F5F0E8] text-lg mb-1">{user.personality_title}</p>
              <p className="font-ui text-sm text-[#9FE1CB] leading-relaxed">{user.personality_body}</p>
            </>
          ) : (
            <p className="font-ui text-xs text-[#D3C9B8]">Generate your plant personality based on your care data.</p>
          )}
        </div>

        {/* Badges — Phase 14C.3.b: 3-slot picker + link to full gallery */}
        <div
          className="rounded-[14px] border-[0.5px] border-[#D3C9B8] bg-[#EDE5D8] p-4"
          data-testid="profile-badges"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-plant text-[#1C2E10] text-sm">Featured badges</h3>
            <button
              type="button"
              onClick={() => navigate('/badges')}
              data-testid="profile-badges-view-all"
              className="rounded-[2px] font-plant uppercase tracking-[0.08em] text-[10px] px-3 py-1.5 border-[0.5px] border-[#D3C9B8] bg-transparent text-[#1C2E10] hover:border-[#3B6D11] transition-colors duration-150"
            >
              View all{badges.length > 0 ? ` (${badges.length})` : ''}
            </button>
          </div>
          <ProfileFeaturedBadges allBadges={badges} />
        </div>

        {/* Quick links */}
        <div className="rounded-[14px] border-[0.5px] border-[#D3C9B8] bg-[#EDE5D8] p-4">
          <h3 className="font-plant text-[#1C2E10] text-sm mb-3">Quick Links</h3>
          <div className="grid grid-cols-1 gap-2">
            <button
              onClick={() => navigate('/bouquets')}
              data-testid="profile-bouquets-link"
              className="rounded-[2px] font-plant uppercase tracking-[0.08em] text-xs px-4 py-3 bg-transparent text-[#1C2E10] border-[0.5px] border-[#D3C9B8] hover:border-[#D4537E] transition-colors duration-150 flex items-center justify-center gap-2"
            >
              <Flower2 className="h-4 w-4 text-[#D4537E]" />
              Bouquets
            </button>
            <button
              onClick={() => navigate('/swap')}
              data-testid="profile-swap-link"
              className="rounded-[2px] font-plant uppercase tracking-[0.08em] text-xs px-4 py-3 bg-transparent text-[#1C2E10] border-[0.5px] border-[#D3C9B8] hover:border-[#2D5016] transition-colors duration-150 flex items-center justify-center gap-2"
            >
              <Repeat className="h-4 w-4 text-[#3B6D11]" />
              Swap
            </button>
            <button
              onClick={() => navigate('/wishlist')}
              data-testid="profile-wishlist-link"
              className="rounded-[2px] font-plant uppercase tracking-[0.08em] text-xs px-4 py-3 bg-transparent text-[#1C2E10] border-[0.5px] border-[#D3C9B8] hover:border-[#D4537E] transition-colors duration-150 flex items-center justify-center gap-2"
            >
              <Scissors className="h-4 w-4 text-[#D4537E]" />
              Wishlist
            </button>
            <button
              onClick={() => navigate('/challenges')}
              data-testid="profile-challenges-link"
              className="rounded-[2px] font-plant uppercase tracking-[0.08em] text-xs px-4 py-3 bg-transparent text-[#1C2E10] border-[0.5px] border-[#D3C9B8] hover:border-[#2D5016] transition-colors duration-150 flex items-center justify-center gap-2"
            >
              <Trophy className="h-4 w-4 text-[#3B6D11]" />
              Challenges
            </button>
            <button
              onClick={() => navigate('/settings/notifications')}
              data-testid="profile-notifications-button"
              className="rounded-[2px] font-plant uppercase tracking-[0.08em] text-xs px-4 py-3 bg-transparent text-[#1C2E10] border-[0.5px] border-[#D3C9B8] hover:border-[#2D5016] transition-colors duration-150 flex items-center justify-center gap-2"
            >
              <Bell className="h-4 w-4" />
              Notification Settings
            </button>
          </div>
        </div>

        {/* Tier info */}
        <div className="rounded-[14px] border-[0.5px] border-[#D3C9B8] bg-[#EDE5D8] p-4">
          <h3 className="font-plant text-[#1C2E10] text-sm mb-2">Your Tier</h3>
          <p className="font-ui text-sm text-[#1A1A17] capitalize">{user?.tier?.replace('_', ' ') || 'Free'}</p>
          {user?.tier === 'free' && (
            <p className="font-ui text-xs text-[#2B2B26] mt-1">
              Free tier: 15 plants, 2 active bouquets, basic care. Upgrade for unlimited plants, AI biographies, and advanced analytics.
            </p>
          )}
        </div>

        {/* Preferences */}
        <div className="rounded-[14px] border-[0.5px] border-[#D3C9B8] bg-[#EDE5D8] p-4" data-testid="profile-preferences">
          <h3 className="font-plant text-[#1C2E10] text-sm mb-3">Plant identification</h3>
          <button
            type="button"
            onClick={handleManualToggle}
            disabled={savingPref}
            data-testid="profile-prefer-manual-toggle"
            className="w-full text-left flex items-start gap-3 group"
            aria-pressed={user?.prefer_manual_plant_entry ? 'true' : 'false'}
          >
            <span className="flex-1 min-w-0">
              <span className="font-plant text-[#1C2E10] text-sm block">Skip AI identification</span>
              <span className="font-ui text-xs text-[#5F5E5A] leading-snug block mt-0.5">
                Always open manual entry when adding a plant.
              </span>
            </span>
            <span
              className={`relative w-10 h-6 rounded-full flex-shrink-0 transition-colors duration-150 ${
                user?.prefer_manual_plant_entry ? 'bg-[#3B6D11]' : 'bg-[#D3C9B8]'
              }`}
              aria-hidden="true"
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-[#FDFAF6] shadow transition-transform duration-150 ${
                  user?.prefer_manual_plant_entry ? 'translate-x-4' : ''
                }`}
              />
            </span>
          </button>
          <p className="italic font-plant text-xs text-[#5F5E5A] mt-3 leading-snug">
            For experienced growers who know their plants and prefer to enter details directly.
          </p>
        </div>

        {/* Quick links — Phase 14C */}
        <div className="grid grid-cols-2 gap-2" data-testid="profile-quick-links">
          <button
            type="button"
            onClick={() => navigate('/wants')}
            data-testid="profile-link-wants"
            className="rounded-[12px] border-[0.5px] border-[#D3C9B8] bg-[#EDE5D8] p-3 hover:border-[#3B6D11] transition-colors duration-150 text-left"
          >
            <p className="font-plant text-sm text-[#1C2E10]">Want list</p>
            <p className="font-ui text-[10px] text-[#5F5E5A] mt-0.5">Plants you'd like next</p>
          </button>
          <button
            type="button"
            onClick={() => navigate('/swaps')}
            data-testid="profile-link-swaps"
            className="rounded-[12px] border-[0.5px] border-[#D3C9B8] bg-[#EDE5D8] p-3 hover:border-[#3B6D11] transition-colors duration-150 text-left"
          >
            <p className="font-plant text-sm text-[#1C2E10]">Swaps</p>
            <p className="font-ui text-[10px] text-[#5F5E5A] mt-0.5">Trade with verified growers</p>
          </button>
        </div>

        {/* Hardiness zone — Phase 14C */}
        <div className="rounded-[14px] border-[0.5px] border-[#D3C9B8] bg-[#EDE5D8] p-4" data-testid="profile-zone">
          <h3 className="font-plant text-[#1C2E10] text-sm mb-3">Where you grow</h3>
          <HardinessZoneControls />
        </div>

        {/* Verification status — Phase 14C.3 */}
        <div className="rounded-[14px] border-[0.5px] border-[#D3C9B8] bg-[#EDE5D8] p-4" data-testid="profile-verification">
          <h3 className="font-plant text-[#1C2E10] text-sm mb-3">Verification status</h3>
          <VerificationStatusCard />
        </div>

        {/* Tutorials and tips — Phase 14A.2 */}
        <div className="rounded-[14px] border-[0.5px] border-[#D3C9B8] bg-[#EDE5D8] p-4" data-testid="profile-tutorials">
          <h3 className="font-plant text-[#1C2E10] text-sm mb-3">Tutorials and tips</h3>
          <TutorialsAndTipsControls />
        </div>

        {/* About Grove */}
        <div className="rounded-[14px] border-[0.5px] border-[#D3C9B8] bg-[#EDE5D8] p-4">
          <h3 className="font-plant text-[#1C2E10] text-sm mb-2">About Grove</h3>
          <p className="font-ui text-sm text-[#2B2B26] leading-relaxed mb-3">{GROVE_BRAND.mission}</p>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => navigate('/help')}
              data-testid="profile-help-button"
              className="rounded-[2px] font-plant uppercase tracking-[0.08em] text-xs px-4 py-3 bg-transparent text-[#1C2E10] border-[0.5px] border-[#D3C9B8] hover:border-[#2D5016] transition-colors duration-150 flex items-center justify-center gap-2"
            >
              <HelpCircle className="h-4 w-4" />
              Help & Tutorial
            </button>
            <button
              onClick={handleReplayOnboarding}
              data-testid="profile-replay-onboarding-button"
              className="rounded-[2px] font-plant uppercase tracking-[0.08em] text-xs px-4 py-3 bg-transparent text-[#1C2E10] border-[0.5px] border-[#D3C9B8] hover:border-[#2D5016] transition-colors duration-150 flex items-center justify-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Replay Tutorial
            </button>
          </div>
        </div>

        {/* Florist Pro (conditional) */}
        {(user?.tier === 'pro' || user?.tier === 'florist_pro') && (
          <div className="rounded-[14px] border-[0.5px] border-[#CBBFAE] bg-[#FBFAF7] p-4">
            <h3 className="font-plant text-[#141410] text-sm mb-3">Florist Pro</h3>
            <button
              onClick={() => navigate('/florist')}
              data-testid="profile-florist-button"
              className="w-full rounded-[2px] font-plant uppercase tracking-[0.08em] text-xs px-4 py-3 bg-[#8A6A3D] text-white hover:bg-[#6B5230] transition-colors duration-150"
            >
              Portfolio & Insights
            </button>
          </div>
        )}

        {/* Admin Panel (conditional) */}
        {user?.is_admin && (
          <div className="rounded-[14px] border-[0.5px] border-[#D4537E] bg-[#FEE4E2] p-4">
            <h3 className="font-plant text-[#B42318] text-sm mb-3">Admin</h3>
            <button
              onClick={() => navigate('/admin/demo')}
              data-testid="profile-admin-button"
              className="w-full rounded-[2px] font-plant uppercase tracking-[0.08em] text-xs px-4 py-3 bg-[#B42318] text-white hover:bg-[#912018] transition-colors duration-150 flex items-center justify-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Demo Admin Panel
            </button>
          </div>
        )}
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
      <button
        type="button"
        onClick={handleTooltipToggle}
        disabled={savingTip}
        data-testid="profile-tooltips-toggle"
        className="w-full text-left flex items-start gap-3 group"
        aria-pressed={tooltipsOn ? 'true' : 'false'}
      >
        <span className="flex-1 min-w-0">
          <span className="font-plant text-[#1C2E10] text-sm block">Show tooltips</span>
          <span className="font-ui text-xs text-[#5F5E5A] leading-snug block mt-0.5">
            {tooltipsActive
              ? `On — ${daysRemaining} day${daysRemaining === 1 ? '' : 's'} of training-wheel hints left.`
              : tooltipsOn
                ? 'Auto-hidden after your first 30 days. Toggle on to bring them back.'
                : 'Off. Toggle on to see contextual hints again.'}
          </span>
        </span>
        <span
          className={`relative w-10 h-6 rounded-full flex-shrink-0 transition-colors duration-150 ${
            tooltipsOn ? 'bg-[#3B6D11]' : 'bg-[#D3C9B8]'
          }`}
          aria-hidden="true"
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-[#FDFAF6] shadow transition-transform duration-150 ${
              tooltipsOn ? 'translate-x-4' : ''
            }`}
          />
        </span>
      </button>

      {/* Section tutorials replay */}
      <div className="mt-4 pt-4 border-t-[0.5px] border-[#D3C9B8]">
        <p className="font-plant text-[#1C2E10] text-xs uppercase tracking-[0.08em] mb-2">Replay a section tutorial</p>
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
                className="w-full flex items-center gap-3 rounded-[10px] border-[0.5px] border-[#D3C9B8] bg-[#FDFAF6] p-2.5 hover:border-[#3B6D11] disabled:opacity-50 transition-colors duration-150"
              >
                <span
                  className="w-8 h-8 rounded-[8px] flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${meta.accent}20` }}
                >
                  <Icon className="h-4 w-4" style={{ color: meta.accent }} />
                </span>
                <span className="flex-1 min-w-0 text-left">
                  <span className="font-plant text-xs text-[#1C2E10] block">{meta.title}</span>
                  <span className="font-ui text-[10px] text-[#5F5E5A] block">
                    {wasSeen ? 'Tap to replay' : 'Not seen yet'}
                  </span>
                </span>
                <RotateCcw className="h-3 w-3 text-[#5F5E5A]" />
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
        <span className="w-8 h-8 rounded-[8px] bg-[#EAF3DE] flex items-center justify-center flex-shrink-0">
          <MapPin className="h-4 w-4 text-[#3B6D11]" />
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-plant text-[#1C2E10] text-sm">
            {zone ? (
              <>
                {system === 'USDA' ? `USDA Zone ${zone}` : `RHS ${zone}`}
                {' '}
                <span className="font-latin italic text-[11px] text-[#5F5E5A]">
                  {user.location_postcode ? `\u00b7 ${user.location_postcode}` : ''}
                </span>
              </>
            ) : (
              <span className="text-[#5F5E5A]">Add your location to see your hardiness zone</span>
            )}
          </p>
          {sourceLabel && (
            <p className="font-ui text-[10px] text-[#5F5E5A] mt-0.5" data-testid="zone-source-label">
              {sourceLabel}
            </p>
          )}
        </div>
      </div>

      {!editing && !overriding && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setEditing(true)}
            data-testid="zone-edit-location"
            className="flex-1 rounded-[2px] font-plant uppercase tracking-[0.08em] text-[10px] px-3 py-2 border-[0.5px] border-[#D3C9B8] bg-transparent text-[#1C2E10] hover:border-[#2D5016] transition-colors duration-150 flex items-center justify-center gap-1"
          >
            <Pencil className="h-3 w-3" />
            {zone ? 'Update location' : 'Add location'}
          </button>
          {zone && (
            <button
              type="button"
              onClick={() => setOverriding(true)}
              data-testid="zone-override"
              className="flex-1 rounded-[2px] font-plant uppercase tracking-[0.08em] text-[10px] px-3 py-2 border-[0.5px] border-[#D3C9B8] bg-transparent text-[#1C2E10] hover:border-[#2D5016] transition-colors duration-150"
            >
              Override zone
            </button>
          )}
        </div>
      )}

      {editing && (
        <div className="space-y-2" data-testid="zone-edit-form">
          <div className="flex gap-2">
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              data-testid="zone-country-select"
              className="bg-[#FDFAF6] border-[0.5px] border-[#D3C9B8] rounded-[6px] px-2 py-2 text-xs font-ui text-[#1A1A17]"
            >
              <option value="US">United States</option>
              <option value="UK">United Kingdom</option>
            </select>
            <input
              value={postcode}
              onChange={(e) => setPostcode(e.target.value)}
              onBlur={previewZone}
              placeholder={country === 'UK' ? 'e.g. SW1A 1AA' : 'e.g. 10001'}
              data-testid="zone-postcode-input"
              className="flex-1 bg-[#FDFAF6] border-[0.5px] border-[#D3C9B8] rounded-[6px] px-3 py-2 text-xs font-ui text-[#1A1A17] placeholder:text-[#D3C9B8] focus:outline-none focus:ring-2 focus:ring-[#5DCAA5]"
            />
          </div>
          {previewing && <p className="font-ui text-[10px] text-[#5F5E5A]">Looking up\u2026</p>}
          {preview?.zone && (
            <div className="rounded-[8px] bg-[#EAF3DE] border-[0.5px] border-[#3B6D11] p-2">
              <p className="font-plant text-xs text-[#1C2E10]">
                {preview.system === 'USDA' ? `USDA Zone ${preview.zone}` : `RHS ${preview.zone}`}
              </p>
              {preview.description && (
                <p className="font-latin italic text-[10px] text-[#5F5E5A] mt-0.5">{preview.description}</p>
              )}
            </div>
          )}
          {preview && !preview.zone && postcode && (
            <p className="font-ui text-[10px] text-[#BA7517]">Couldn&apos;t find a match. You can still save and override below.</p>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setEditing(false); setPreview(null); }}
              data-testid="zone-edit-cancel"
              className="flex-1 rounded-[2px] font-plant uppercase tracking-[0.08em] text-[10px] px-3 py-2 border-[0.5px] border-[#D3C9B8] bg-transparent text-[#1C2E10] hover:border-[#2D5016] transition-colors duration-150"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={saveLocation}
              disabled={saving}
              data-testid="zone-edit-save"
              className="flex-1 rounded-[2px] font-plant uppercase tracking-[0.08em] text-[10px] px-3 py-2 bg-[#1C2E10] text-[#F5F0E8] border-[0.5px] border-[#1C2E10] hover:bg-[#2D5016] disabled:opacity-50 transition-colors duration-150 flex items-center justify-center gap-1"
            >
              <Check className="h-3 w-3" />
              {saving ? 'Saving\u2026' : 'Save'}
            </button>
          </div>
        </div>
      )}

      {overriding && (
        <div className="space-y-2" data-testid="zone-override-form">
          <p className="font-ui text-[10px] text-[#5F5E5A] leading-snug">
            If your microclimate doesn&apos;t match the auto-derived zone (mountain valley, urban heat island, sheltered coast), you can set it manually here.
          </p>
          <input
            value={manualZone}
            onChange={(e) => setManualZone(e.target.value)}
            placeholder="e.g. 7b or H4"
            data-testid="zone-manual-input"
            className="w-full bg-[#FDFAF6] border-[0.5px] border-[#D3C9B8] rounded-[6px] px-3 py-2 text-xs font-ui text-[#1A1A17] placeholder:text-[#D3C9B8] focus:outline-none focus:ring-2 focus:ring-[#5DCAA5]"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setOverriding(false)}
              data-testid="zone-override-cancel"
              className="flex-1 rounded-[2px] font-plant uppercase tracking-[0.08em] text-[10px] px-3 py-2 border-[0.5px] border-[#D3C9B8] bg-transparent text-[#1C2E10] hover:border-[#2D5016] transition-colors duration-150"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={saveOverride}
              disabled={saving || !manualZone.trim()}
              data-testid="zone-override-save"
              className="flex-1 rounded-[2px] font-plant uppercase tracking-[0.08em] text-[10px] px-3 py-2 bg-[#1C2E10] text-[#F5F0E8] border-[0.5px] border-[#1C2E10] hover:bg-[#2D5016] disabled:opacity-50 transition-colors duration-150"
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
      <div className="font-ui text-xs text-[#5F5E5A]" data-testid="verification-loading">
        Loading verification status…
      </div>
    );
  }

  const isVerified = !!(v?.verified_user || v?.is_verified);
  const onCurrentVersion = v?.verification_pact_version === PACT_VERSION;
  const needsRe = !!v?.needs_reverification;

  return (
    <>
      <div className="space-y-3" data-testid="verification-status-card">
        <div
          className={`rounded-[10px] border-[0.5px] p-3 flex items-start gap-3 ${
            isVerified && !needsRe
              ? 'bg-[#EAF3DE] border-[#3B6D11]'
              : 'bg-[#FDFAF6] border-[#D3C9B8]'
          }`}
        >
          <ShieldCheck className={`h-5 w-5 mt-0.5 flex-shrink-0 ${isVerified && !needsRe ? 'text-[#3B6D11]' : 'text-[#5F5E5A]'}`} />
          <div className="flex-1 min-w-0">
            {isVerified && !needsRe ? (
              <>
                <p className="font-plant text-sm text-[#1C2E10]" data-testid="verification-state-verified">
                  You're verified
                </p>
                <p className="font-ui text-[11px] text-[#5F5E5A] mt-0.5">
                  {v.verified_at
                    ? `Pact signed ${new Date(v.verified_at).toLocaleDateString()}.`
                    : v.pact_signed_at
                      ? `Pact signed ${new Date(v.pact_signed_at).toLocaleDateString()}.`
                      : 'Verified by Grove.'}
                  {' '}Pact v{v.verification_pact_version || PACT_VERSION}.
                </p>
              </>
            ) : needsRe ? (
              <>
                <p className="font-plant text-sm text-[#BA7517]" data-testid="verification-state-needs-reverify">
                  Re-verification needed
                </p>
                <p className="font-ui text-[11px] text-[#5F5E5A] mt-0.5">
                  The community pact has been updated. Re-sign before your next swap.
                </p>
              </>
            ) : (
              <>
                <p className="font-plant text-sm text-[#1C2E10]" data-testid="verification-state-unverified">
                  Not yet verified
                </p>
                <p className="font-ui text-[11px] text-[#5F5E5A] mt-0.5">
                  Sign the 8-section community pact to unlock swaps once you've been on Grove for 3 months and have an active Pro subscription.
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
              className="rounded-[2px] font-plant uppercase tracking-[0.08em] text-[10px] px-3 py-2 bg-[#3B6D11] text-[#FDFAF6] hover:bg-[#2D5016] transition-colors duration-150"
            >
              {needsRe ? 'Re-verify' : 'Start verification'}
            </button>
          )}
          <button
            type="button"
            onClick={() => setReaderOpen(true)}
            data-testid="verification-read-pact-btn"
            className="rounded-[2px] font-plant uppercase tracking-[0.08em] text-[10px] px-3 py-2 border-[0.5px] border-[#D3C9B8] bg-transparent text-[#1C2E10] hover:border-[#2D5016] transition-colors duration-150 inline-flex items-center gap-1.5"
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
  // Lock body scroll while open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[4px]"
      onClick={onClose}
      data-testid="pact-reader-modal"
    >
      <div
        className="bg-[#FDFAF6] rounded-[14px] border-[0.5px] border-[#D3C9B8] shadow-xl w-full max-w-[640px] max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between p-5 border-b-[0.5px] border-[#D3C9B8]">
          <div className="flex-1 min-w-0">
            <h3 className="font-plant text-[#1C2E10] text-lg">{PACT_INTRO.heading}</h3>
            <p className="font-latin italic text-[11px] text-[#888780] mt-1">
              Pact v{PACT_VERSION} — read-only view
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            data-testid="pact-reader-close"
            className="flex-shrink-0 p-1.5 rounded-[6px] hover:bg-[#EDE5D8] text-[#5F5E5A] transition-colors duration-150"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-y-auto p-5 space-y-4">
          <p className="font-ui text-[13px] text-[#2B2B26] leading-relaxed">{PACT_INTRO.body}</p>

          {PACT_SECTIONS.map((s) => (
            <section key={s.number} className="rounded-[10px] border-[0.5px] border-[#D3C9B8] bg-white p-4">
              <h4 className="font-plant text-[14px] text-[#1C2E10] mb-2">
                {s.number}. {s.title}
              </h4>
              {s.bodyAsList ? (
                <ul className="space-y-1.5 font-ui text-[13px] text-[#2B2B26] leading-relaxed">
                  {s.body.map((line, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-[#3B6D11] flex-shrink-0">•</span>
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="space-y-2 font-ui text-[13px] text-[#2B2B26] leading-relaxed">
                  {s.body.map((p, i) => <p key={i}>{p}</p>)}
                </div>
              )}
              <p className="font-plant italic text-[12px] text-[#3B6D11] mt-3">
                {s.acknowledgement}
              </p>
            </section>
          ))}

          <blockquote className="rounded-[10px] border-[0.5px] border-[#3B6D11] bg-[#EAF3DE] p-4">
            <p className="font-plant italic text-[13px] text-[#1C2E10] leading-relaxed">
              “{FINAL_COPY.oath}”
            </p>
          </blockquote>
        </div>
      </div>
    </div>
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
        <p className="font-latin italic text-[12px] text-[#888780]">
          No badges yet — log your first care action to start earning.
        </p>
      );
    }
    return (
      <div className="grid grid-cols-3 gap-2">
        {allBadges.slice(0, 3).map(({ badge }) => (
          <div
            key={badge?.id}
            className="rounded-[10px] border-[0.5px] border-[#D3C9B8] bg-white p-3 flex flex-col items-center text-center"
          >
            <span className="w-10 h-10 rounded-full bg-[#EAF3DE] flex items-center justify-center mb-1">
              <BadgeIcon name={badge?.icon} className="h-5 w-5 text-[#3B6D11]" />
            </span>
            <p className="font-plant text-[11px] text-[#1C2E10] leading-tight">
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
      <p className="font-latin italic text-[12px] text-[#888780]" data-testid="profile-badges-empty">
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
        className="w-full rounded-[10px] border-[0.5px] border-dashed border-[#3B6D11] bg-[#EAF3DE] p-4 text-center hover:bg-white transition-colors duration-150"
      >
        <p className="font-plant text-[#1C2E10] text-sm">Pick up to 3 to display</p>
        <p className="font-latin italic text-[11px] text-[#5F5E5A] mt-0.5">
          You've earned {catalog.earned_count} of {catalog.total} badges. Choose your favourites.
        </p>
      </button>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2" data-testid="profile-featured-badges">
      {items.map((it) => (
        <div
          key={it.slug}
          className="rounded-[10px] border-[0.5px] border-[#3B6D11] bg-white p-3 flex flex-col items-center text-center"
          data-testid={`profile-featured-badge-${it.slug}`}
        >
          <span className="w-10 h-10 rounded-full bg-[#EAF3DE] flex items-center justify-center mb-1">
            <BadgeIcon name={it.icon} className="h-5 w-5 text-[#3B6D11]" />
          </span>
          <p className="font-plant text-[11px] text-[#1C2E10] leading-tight">
            {it.name}
          </p>
          {it.tier && (
            <span className="font-plant uppercase tracking-[0.08em] text-[8px] text-[#5F5E5A] mt-0.5">
              {it.tier}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

