import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationAPI } from '../lib/api';
import { PageHeader } from '../components/PageHeader';
import { toast } from 'sonner';
import { ChevronLeft, Bell, Mail, Moon, Gauge } from 'lucide-react';

export const CARE_CAP_CHOICES = [1, 2, 3];

const TOGGLE_GROUPS = [
  {
    title: 'Push notifications',
    icon: Bell,
    desc: 'In-app alerts that land in your notification center.',
    keys: [
      { key: 'push_care_due', label: 'Daily care check', help: 'One message that bundles every plant due for a check.' },
      { key: 'push_care_overdue', label: 'Extra check-in nudges', help: 'A separate message when a plant has gone a while without a check. These plants are already in the daily care check.' },
      { key: 'push_streak_at_risk', label: 'Streak reminders', help: 'A heads-up before a care streak resets. Off unless you want it.' },
      { key: 'push_streak_milestone', label: 'Streak milestones', help: 'Day 7, 14, 30, 60, 100 moments worth noting.' },
      { key: 'push_swap_match', label: 'Swap matches', help: 'When two groves align on plant wants.' },
      { key: 'push_swap_message', label: 'Swap messages', help: 'New messages inside an active swap.' },
      { key: 'push_kudos_received', label: 'Reactions on your posts', help: 'Leaf / light / cutting reactions from your grove.' },
      { key: 'push_sitter_logged', label: 'Plant sitter activity', help: 'When a sitter logs care on your plants.' },
      { key: 'push_bloom_hour', label: 'Bloom hour', help: 'Daily moments when your grove is blooming.' },
      { key: 'push_bouquet_reminder', label: 'Bouquet reminders', help: 'Care actions for active arrangements.' },
      { key: 'push_grove_challenge', label: 'Grove challenges', help: 'Community challenge progress in your groves.' },
    ],
  },
  {
    title: 'Email',
    icon: Mail,
    desc: 'Daily digests and important events via email.',
    keys: [
      { key: 'email_digest', label: 'Daily digest', help: 'One calm summary email at 7am — only if you skipped the app.' },
      { key: 'email_swap_match', label: 'Swap match emails', help: 'Immediate email when you match with another grower.' },
    ],
  },
];

export default function NotificationPreferencesPage() {
  const navigate = useNavigate();
  const [prefs, setPrefs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await notificationAPI.getPreferences();
        setPrefs(res.data);
      } catch (e) {
        toast.error('Failed to load preferences');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const update = async (partial) => {
    setSaving(Object.keys(partial)[0]);
    const optimistic = { ...prefs, ...partial };
    setPrefs(optimistic);
    try {
      const res = await notificationAPI.updatePreferences(partial);
      setPrefs(res.data);
    } catch (e) {
      toast.error('Save failed');
      // revert
      setPrefs((prev) => ({ ...prev }));
    } finally {
      setSaving(null);
    }
  };

  const Toggle = ({ k, label, help }) => {
    const on = !!prefs?.[k];
    const isSaving = saving === k;
    return (
      <div
        className="flex items-start justify-between gap-3 py-3 border-b-[0.5px] border-grove-moss/50 last:border-b-0"
        data-testid={`pref-row-${k}`}
      >
        <div className="min-w-0 flex-1">
          <p className="font-ui text-sm text-grove-cream">{label}</p>
          <p className="font-ui text-[11px] text-grove-cream leading-snug mt-0.5">{help}</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={on}
          aria-label={label}
          data-testid={`pref-toggle-${k}`}
          disabled={isSaving}
          onClick={() => update({ [k]: !on })}
          className={`shrink-0 w-11 h-6 rounded-full relative motion-safe:transition-colors motion-safe:duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-grove-lime focus-visible:ring-offset-2 focus-visible:ring-offset-grove-forest disabled:opacity-60 ${
            on ? 'bg-grove-lime' : 'bg-grove-moss'
          }`}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-grove-canopy motion-safe:transition-transform motion-safe:duration-200 ${
              on ? 'translate-x-[22px]' : 'translate-x-0.5'
            }`}
          />
        </button>
      </div>
    );
  };

  return (
    <div>
      <PageHeader
        title="Notifications"
        rightContent={
          <button
            onClick={() => navigate('/profile')}
            data-testid="prefs-back"
            aria-label="Back to Profile"
            className="rounded-[2px] font-plant uppercase tracking-[0.08em] text-[10px] px-3 py-2 border-[0.5px] border-grove-moss text-grove-cream hover:border-grove-fernLine flex items-center gap-1.5"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Back
          </button>
        }
      />

      <div className="max-w-[600px] mx-auto px-4 py-4 space-y-4">
        {loading || !prefs ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-grove-fernLine border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {TOGGLE_GROUPS.map(({ title, icon: Icon, desc, keys }) => (
              <div
                key={title}
                data-testid={`pref-group-${title.toLowerCase().replace(/\s+/g,'-')}`}
                className="rounded-[14px] border-[0.5px] border-grove-moss bg-grove-moss p-4"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="h-4 w-4 text-grove-sprout" />
                  <h3 className="font-plant text-grove-cream text-sm">{title}</h3>
                </div>
                <p className="font-ui text-xs text-grove-cream mb-3">{desc}</p>
                <div>
                  {keys.map((item) => <Toggle key={item.key} k={item.key} label={item.label} help={item.help} />)}
                </div>
              </div>
            ))}

            {/* Daily care limit */}
            <fieldset
              data-testid="pref-group-daily-limit"
              aria-describedby="care-cap-desc"
              className="rounded-[14px] border-[0.5px] border-grove-moss bg-grove-moss p-4"
            >
              <legend className="sr-only">Daily limit</legend>
              <div className="flex items-center gap-2 mb-1" aria-hidden="true">
                <Gauge className="h-4 w-4 text-grove-sprout" />
                <h3 className="font-plant text-grove-cream text-sm">Daily limit</h3>
              </div>
              <p id="care-cap-desc" className="font-ui text-xs text-grove-cream mb-3">
                The most care messages Grove sends in a day. Extra plants wait for the next check.
              </p>
              <div className="grid grid-cols-3 gap-2">
                {CARE_CAP_CHOICES.map((n) => {
                  const active = (prefs.care_daily_cap || 1) === n;
                  return (
                    <label key={n} className="relative block">
                      <input
                        type="radio"
                        name="care_daily_cap"
                        value={n}
                        checked={active}
                        disabled={saving === 'care_daily_cap'}
                        onChange={() => update({ care_daily_cap: n })}
                        data-testid={`pref-care-cap-${n}`}
                        className="peer sr-only"
                      />
                      <span
                        className={`block text-center rounded-[8px] border-[0.5px] px-3 py-2 text-sm font-ui cursor-pointer peer-focus-visible:ring-2 peer-focus-visible:ring-grove-lime peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-grove-forest peer-disabled:opacity-60 ${
                          active ? 'border-grove-fernLine bg-grove-lime text-grove-root' : 'border-grove-moss bg-grove-forest text-grove-cream hover:border-grove-fernLine'
                        }`}
                      >
                        {n} a day
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            {/* Quiet hours */}
            <div
              data-testid="pref-group-quiet-hours"
              className="rounded-[14px] border-[0.5px] border-grove-moss bg-grove-moss p-4"
            >
              <div className="flex items-center gap-2 mb-1">
                <Moon className="h-4 w-4 text-grove-sprout" />
                <h3 className="font-plant text-grove-cream text-sm">Quiet hours</h3>
              </div>
              <p className="font-ui text-xs text-grove-cream mb-3">
                Hold non-urgent notifications and deliver them when quiet hours end. Nothing is ever permanently suppressed.
              </p>
              <Toggle
                k="quiet_hours_enabled"
                label="Enable quiet hours"
                help="When on, we hold delivery and resume at the end of your window."
              />
              {prefs.quiet_hours_enabled && (
                <div className="grid grid-cols-2 gap-3 mt-3">
                  {['quiet_hours_start', 'quiet_hours_end'].map((k) => (
                    <label key={k} className="block">
                      <span className="font-latin text-[10px] text-grove-cream uppercase tracking-[0.12em]">
                        {k === 'quiet_hours_start' ? 'Start' : 'End'}
                      </span>
                      <input
                        type="time"
                        value={prefs[k]}
                        onChange={(e) => update({ [k]: e.target.value })}
                        data-testid={`pref-${k}`}
                        className="mt-1 w-full rounded-[8px] border-[0.5px] border-grove-moss bg-grove-forest px-3 py-2 text-sm font-ui text-grove-cream focus:outline-none focus:ring-2 focus:ring-grove-lime"
                      />
                    </label>
                  ))}
                </div>
              )}
            </div>

            <p className="font-latin text-[10px] text-grove-lichen text-center py-2">
              Wave B (cron + push + email) arrives in a future update. Toggles stored now.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
