import { LoadErrorPage } from '../components/LoadError';
import Loading, { Spinner } from '../components/Loading';
import React, { useEffect, useMemo, useState } from 'react';
import { cn } from '../lib/utils';
import { buttonVariants } from '../components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '../components/ui/dialog';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Lock, Check, X as XIcon, Sparkles, Award, Filter, Target, Pin, PinOff } from 'lucide-react';
import { BadgeIcon } from '../components/BadgeIcon';
import { badgeAPI, goalAPI } from '../lib/api';
import { PageHeader } from '../components/PageHeader';

/**
 * Phase 14C.3.b — Full badge gallery (177 badges).
 *
 * Surfaces the entire 170+ badge catalog grouped by category. Earned badges
 * are full-color; locked badges greyed out with their unlock hint visible.
 * Users can pick up to 3 badges to display publicly via the picker — tier
 * replacement is enforced server-side (a lower tier in a family is hidden
 * from the picker once a higher tier in that family is earned).
 */

// Each tier has one accent from the palette; the chip is a tint of it. The tier is also named in words,
// so the colour is never the only signal.
const TIER_ACCENT = {
  bronze: 'var(--grove-sun)',
  silver: 'var(--grove-sage)',
  gold: 'var(--grove-cream)',
  platinum: 'var(--grove-sprout)',
};
const TIER_COLORS = Object.fromEntries(Object.entries(TIER_ACCENT).map(([tier, accent]) => [
  tier,
  { bg: `color-mix(in srgb, ${accent} 20%, var(--grove-canopy))`, border: accent, text: accent },
]));

const FILTER_TABS = [
  { id: 'all', label: 'All' },
  { id: 'earned', label: 'Earned' },
  { id: 'locked', label: 'Locked' },
];

export default function BadgesPage() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [filter, setFilter] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerSelection, setPickerSelection] = useState([]);
  const [savingPicker, setSavingPicker] = useState(false);
  // Phase 14C.4 — pinned goals (locked badges being tracked on Care tab)
  const [pinnedSlugs, setPinnedSlugs] = useState(new Set());
  const [pinning, setPinning] = useState(null); // slug currently mid-flight

  const load = async () => {
    setLoading(true);
    try {
      setLoadError(false);
      const [catalogRes, goalsRes] = await Promise.all([
        badgeAPI.catalog(),
        goalAPI.list().catch(() => ({ data: { items: [] } })),
      ]);
      setData(catalogRes.data);
      if ((catalogRes.data.items || []).some((it) => it.earned)) setFilter('earned'); // lead with what you've earned
      setPickerSelection(catalogRes.data.displayed || []);
      setPinnedSlugs(new Set((goalsRes.data.items || []).map((g) => g.slug)));
    } catch (e) {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const categories = useMemo(() => {
    if (!data) return [];
    const seen = [];
    for (const it of data.items) {
      if (!seen.includes(it.category)) seen.push(it.category);
    }
    return seen;
  }, [data]);

  const filteredItems = useMemo(() => {
    if (!data) return [];
    return data.items.filter((it) => {
      if (filter === 'earned' && !it.earned) return false;
      if (filter === 'locked' && it.earned) return false;
      if (selectedCategory !== 'all' && it.category !== selectedCategory) return false;
      return true;
    });
  }, [data, filter, selectedCategory]);

  const grouped = useMemo(() => {
    const map = new Map();
    for (const it of filteredItems) {
      const key = `${it.category} · ${it.subcategory}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(it);
    }
    return Array.from(map.entries());
  }, [filteredItems]);

  const togglePickerSlug = (slug, item) => {
    if (!item.earned) {
      toast.error('You haven\'t earned this badge yet.');
      return;
    }
    if (!item.displayable) {
      toast.error('A higher tier in this family is already displayed.');
      return;
    }
    setPickerSelection((prev) => {
      if (prev.includes(slug)) return prev.filter((s) => s !== slug);
      if (prev.length >= 3) {
        toast.error('You can display at most 3 badges.');
        return prev;
      }
      return [...prev, slug];
    });
  };

  const savePicker = async () => {
    setSavingPicker(true);
    try {
      await badgeAPI.setDisplayed(pickerSelection);
      toast.success('Display picker saved');
      await load();
      setPickerOpen(false);
    } catch (e) {
      const detail = e?.response?.data?.detail;
      const msg = (detail && typeof detail === 'object' && detail.message)
        || (typeof detail === 'string' ? detail : null)
        || 'Could not save selection.';
      toast.error(msg);
    } finally {
      setSavingPicker(false);
    }
  };

  // Phase 14C.4 — pin/unpin a locked badge as a goal
  const togglePin = async (item) => {
    if (item.earned) return; // earned badges aren't goals
    if (!item.earnable) {
      toast.error("This badge is granted by FloraGrove — it can't be pinned as a goal.");
      return;
    }
    setPinning(item.slug);
    try {
      const isPinned = pinnedSlugs.has(item.slug);
      if (isPinned) {
        await goalAPI.unpin(item.slug);
        setPinnedSlugs((prev) => {
          const next = new Set(prev); next.delete(item.slug); return next;
        });
        toast.success(`Removed "${item.name}" from goals`);
      } else {
        await goalAPI.pin(item.slug);
        setPinnedSlugs((prev) => new Set(prev).add(item.slug));
        toast.success(`Pinned "${item.name}" as a goal`);
      }
    } catch (e) {
      const detail = e?.response?.data?.detail;
      const msg = (detail && typeof detail === 'object' && detail.message)
        || (typeof detail === 'string' ? detail : null)
        || 'Could not update goals.';
      toast.error(msg);
    } finally {
      setPinning(null);
    }
  };

  if (loadError) {
    return <LoadErrorPage title="Badges" back={{ to: '/profile', where: 'Profile' }} onRetry={load} />;
  }
  if (loading || !data) {
    return (
      <Loading label="Loading your badges" className="min-h-panel" data-testid="badges-loading" />
    );
  }

  return (
    <div className="pb-24" data-testid="badges-page">
      <PageHeader title="Badges" back={{ to: '/profile', where: 'Profile' }} />

      <div className="max-w-page mx-auto px-4 pt-4 space-y-4">
        <p className="font-ui text-xs text-grove-sage">
          Pick up to 3 to display publicly. Locked badges show their unlock hint.
        </p>

        {/* Phase 14C.4 — pinned goals helper */}
        {pinnedSlugs.size > 0 && (
          <div
            className="rounded-chip border-hairline border-grove-fernLine bg-grove-canopy px-3 py-2 inline-flex items-center gap-2"
            data-testid="badges-goal-counter"
          >
            <Target className="h-3.5 w-3.5 text-grove-sprout" />
            <span className="font-ui text-xs font-medium text-grove-cream">
              {pinnedSlugs.size} of 5 goals pinned
            </span>
            <span className="font-latin italic text-xs text-grove-lichen">·</span>
            <button
              type="button"
              onClick={() => navigate('/care/today')}
              className="font-ui text-xs font-medium text-grove-sprout hover:text-grove-sprout"
              data-testid="badges-view-on-care"
            >
              View on Care tab
            </button>
          </div>
        )}
        {/* Displayed picker */}
        <div
          className="rounded-card border-hairline border-grove-fernLine bg-grove-moss p-5"
          data-testid="badges-displayed-section"
        >
          <div className="flex items-center justify-between gap-2 mb-3">
            <h2 className="font-plant text-base font-semibold text-grove-cream inline-flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-grove-sprout" />
              Displayed on your profile
            </h2>
            <button
              type="button"
              onClick={() => { setPickerSelection(data.displayed || []); setPickerOpen(true); }}
              data-testid="badges-edit-picker"
              className={buttonVariants({ variant: 'outline' })}
            >
              {(data.displayed || []).length > 0 ? 'Change' : 'Pick badges'}
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[0, 1, 2].map((i) => {
              const slug = (data.displayed || [])[i];
              const item = slug ? data.items.find((it) => it.slug === slug) : null;
              return (
                <div
                  key={i}
                  className={`rounded-chip border-hairline p-3 ${
                    item ? 'bg-grove-canopy border-grove-fernLine' : 'bg-grove-canopy border-dashed border-grove-moss'
                  } flex flex-col items-center text-center`}
                  data-testid={`badges-displayed-slot-${i}`}
                >
                  {item ? (
                    <>
                      <BadgeTile item={item} compact />
                      <p className="font-ui text-xs font-medium text-grove-cream mt-1.5 leading-tight">
                        {item.name}
                      </p>
                    </>
                  ) : (
                    <>
                      <span className="w-10 h-10 rounded-full bg-grove-moss flex items-center justify-center mb-1">
                        <Award className="h-4 w-4 text-grove-lichen" />
                      </span>
                      <p className="font-latin italic text-xs text-grove-lichen">Empty slot</p>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-ui text-xs font-medium text-grove-sage flex items-center gap-1">
            <Filter className="h-3 w-3" /> Show
          </span>
          {FILTER_TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setFilter(t.id)}
              data-testid={`badges-filter-${t.id}`}
              className={buttonVariants({ variant: 'chip' })}
            aria-pressed={filter === t.id}
            >
              {t.label}
              {t.id === 'earned' && data.earned_count > 0 && <span>{data.earned_count}</span>}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            data-testid="badges-cat-all"
            className={buttonVariants({ variant: 'chip' })}
            aria-pressed={selectedCategory === 'all'}
          >
            All categories
          </button>
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setSelectedCategory(c)}
              data-testid={`badges-cat-${c.toLowerCase().replace(/[^a-z]+/g, '-')}`}
              className={buttonVariants({ variant: 'chip' })}
            aria-pressed={selectedCategory === c}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Empty state */}
        {grouped.length === 0 && (
          <div className="rounded-card border-hairline border-grove-moss bg-grove-moss p-5 text-center">
            <p className="font-ui text-grove-cream text-sm font-medium">No badges match this filter.</p>
            <p className="font-latin italic text-xs text-grove-lichen mt-1">
              Try a different category or switch the Earned/Locked filter.
            </p>
          </div>
        )}

        {/* Grid grouped by subcategory */}
        {grouped.map(([title, items]) => (
          <section key={title} data-testid={`badges-group-${title.toLowerCase().replace(/[^a-z]+/g, '-')}`}>
            <h2 className="font-plant text-xl font-semibold text-grove-cream mb-2">{title}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {items.map((it) => (
                <BadgeTile
                  key={it.slug}
                  item={it}
                  isPinned={pinnedSlugs.has(it.slug)}
                  pinning={pinning === it.slug}
                  pinDisabled={!pinnedSlugs.has(it.slug) && pinnedSlugs.size >= 5}
                  onTogglePin={() => togglePin(it)}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      {pickerOpen && (
        <PickerModal
          data={data}
          selection={pickerSelection}
          toggle={togglePickerSlug}
          onSave={savePicker}
          onCancel={() => setPickerOpen(false)}
          saving={savingPicker}
        />
      )}
    </div>
  );
}

function BadgeTile({ item, compact = false, isPinned = false, pinning = false, pinDisabled = false, onTogglePin }) {
  const earned = item.earned;
  const tierColor = item.tier ? TIER_COLORS[item.tier] : null;
  const sizeClass = compact ? 'w-10 h-10' : 'w-12 h-12';
  const canPin = !earned && item.earnable && !!onTogglePin;
  return (
    <div
      className={`relative rounded-chip border-hairline p-3 flex flex-col items-center text-center transition-colors duration-150 ${
        earned ? 'bg-grove-canopy border-grove-moss' : 'bg-grove-moss/80 border-dashed border-grove-moss'
      } ${isPinned ? 'ring-1 ring-grove-lime ring-offset-1 ring-offset-grove-forest' : ''} ${compact ? 'p-1' : ''}`}
      data-testid={`badge-tile-${item.slug}`}
      data-earned={earned ? 'true' : 'false'}
      data-pinned={isPinned ? 'true' : 'false'}
    >
      {isPinned && !compact && (
        <span
          className="absolute top-1.5 left-1.5 inline-flex items-center gap-1 rounded-full bg-grove-lime text-grove-root px-1.5 py-0.5"
          data-testid={`badge-tile-${item.slug}-pinned-flag`}
        >
          <Target className="h-2.5 w-2.5" />
          <span className="font-ui text-xs font-medium">Goal</span>
        </span>
      )}
      <span
        className={`${sizeClass} rounded-full flex items-center justify-center mb-1 ${earned && tierColor ? 'border-hairline' : ''} ${earned ? '' : 'grayscale opacity-50'}`}
        style={
          earned && tierColor
            ? { backgroundColor: tierColor.bg, borderColor: tierColor.border }
            : { backgroundColor: earned ? 'var(--grove-moss)' : 'var(--grove-canopy)' }
        }
      >
        {earned ? (
          <BadgeIcon name={item.icon} className="h-5 w-5" style={{ color: tierColor?.text || 'var(--grove-sprout)' }} />
        ) : (
          <Lock className="h-4 w-4 text-grove-lichen" />
        )}
      </span>
      {!compact && (
        <>
          <p className={`font-ui text-xs font-medium leading-tight ${earned ? 'text-grove-cream' : 'text-grove-sage'}`}>
            {item.name}
          </p>
          {item.tier && earned && (
            <span
              className="font-ui text-xs font-medium mt-0.5 px-1.5 py-0.5 rounded-control border-hairline"
              style={{
                backgroundColor: tierColor.bg,
                color: tierColor.text,
                borderColor: tierColor.border,
              }}
            >
              {item.tier}
            </span>
          )}
          <p className="font-latin italic text-xs text-grove-lichen mt-1 leading-tight">
            {item.description}
          </p>
          {!earned && !item.earnable && (
            <p className="font-latin italic text-xs text-grove-sun mt-1">
              Granted by FloraGrove
            </p>
          )}
          {canPin && (
            <button
              type="button"
              onClick={onTogglePin}
              disabled={pinning || (pinDisabled && !isPinned)}
              data-testid={`badge-tile-${item.slug}-pin-btn`}
              className={cn(buttonVariants({ variant: isPinned ? 'default' : 'outline' }), 'mt-2 gap-1')}
              title={isPinned ? 'Unpin goal' : (pinDisabled ? 'You\'ve pinned 5 goals — unpin one first.' : 'Pin as goal')}
            >
              {pinning ? (
                <Spinner className="h-3 w-3 border-current" />
              ) : isPinned ? (
                <PinOff className="h-2.5 w-2.5" />
              ) : (
                <Pin className="h-2.5 w-2.5" />
              )}
              {isPinned ? 'Unpin' : 'Pin goal'}
            </button>
          )}
        </>
      )}
    </div>
  );
}

function PickerModal({ data, selection, toggle, onSave, onCancel, saving }) {
  // Show all earned badges grouped, hide non-displayable (lower tiers)
  const earnedDisplayable = useMemo(
    () => data.items.filter((it) => it.earned && it.displayable),
    [data]
  );
  const grouped = useMemo(() => {
    const map = new Map();
    for (const it of earnedDisplayable) {
      const key = it.category;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(it);
    }
    return Array.from(map.entries());
  }, [earnedDisplayable]);

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onCancel(); }}>
      <DialogContent
        showClose={false}
        aria-describedby={undefined}
        data-testid="badges-picker-modal"
        className="flex max-h-sheet max-w-sheet flex-col gap-0 overflow-hidden p-0"
      >
        <div className="flex items-start justify-between p-5 border-b-hairline border-grove-moss">
          <div className="flex-1 min-w-0">
            <DialogTitle className="text-lg">Pick up to 3 badges to display</DialogTitle>
            <p className="font-latin italic text-xs text-grove-lichen mt-1">
              {selection.length} of 3 selected · only the highest tier in each family is shown
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            data-testid="badges-picker-close"
            className="flex-shrink-0 p-1.5 rounded-tag hover:bg-grove-moss text-grove-sage transition-colors duration-150"
            aria-label="Close"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-y-auto p-5 space-y-4">
          {grouped.length === 0 ? (
            <p className="font-ui text-sm text-grove-sage text-center py-8">
              You haven't earned any displayable badges yet. Keep growing.
            </p>
          ) : (
            grouped.map(([cat, items]) => (
              <section key={cat}>
                <h4 className="font-ui text-xs font-medium text-grove-sage mb-2">
                  {cat}
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {items.map((it) => {
                    const isSel = selection.includes(it.slug);
                    return (
                      <button
                        key={it.slug}
                        type="button"
                        onClick={() => toggle(it.slug, it)}
                        data-testid={`picker-tile-${it.slug}`}
                        className={`relative rounded-chip border-hairline p-3 flex flex-col items-center text-center transition-colors duration-150 ${
                          isSel
                            ? 'bg-grove-moss border-grove-fernLine'
                            : 'bg-grove-canopy border-grove-moss hover:border-grove-fernLine'
                        }`}
                      >
                        {isSel && (
                          <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-grove-lime flex items-center justify-center">
                            <Check className="h-3 w-3 text-grove-cream" />
                          </span>
                        )}
                        <BadgeTile item={it} compact />
                        <p className="font-ui text-xs font-medium text-grove-cream mt-1.5 leading-tight">
                          {it.name}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </section>
            ))
          )}
        </div>

        <div className="border-t-hairline border-grove-moss p-4 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            data-testid="badges-picker-cancel"
            className={cn(buttonVariants({ variant: 'outline' }))}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            data-testid="badges-picker-save"
            className={cn(buttonVariants(), "transition-colors duration-150 disabled:opacity-50")}
          >
            {saving ? 'Saving…' : 'Save selection'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
