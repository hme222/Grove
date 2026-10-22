import React, { useEffect, useMemo, useState } from 'react';
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

const TIER_COLORS = {
  bronze: { bg: '#F1E4C8', border: '#BA7517', text: '#7A4F0E' },
  silver: { bg: '#E5E5E5', border: '#9A9A9A', text: '#3C3C3C' },
  gold: { bg: '#F6E7B5', border: '#B58A2B', text: '#5C4413' },
  platinum: { bg: '#D4E4D9', border: '#3B6D11', text: '#1C2E10' },
};

const FILTER_TABS = [
  { id: 'all', label: 'All' },
  { id: 'earned', label: 'Earned' },
  { id: 'locked', label: 'Locked' },
];

export default function BadgesPage() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
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
      const [catalogRes, goalsRes] = await Promise.all([
        badgeAPI.catalog(),
        goalAPI.list().catch(() => ({ data: { items: [] } })),
      ]);
      setData(catalogRes.data);
      setPickerSelection(catalogRes.data.displayed || []);
      setPinnedSlugs(new Set((goalsRes.data.items || []).map((g) => g.slug)));
    } catch (e) {
      toast.error('Could not load badges.');
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
      toast.error("This badge is granted by Grove — it can't be pinned as a goal.");
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

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]" data-testid="badges-loading">
        <div className="w-5 h-5 border-2 border-grove-fernLine border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="pb-24" data-testid="badges-page">
      <PageHeader title="Badges" count={`${data.earned_count}/${data.total}`} />

      <div className="max-w-[1100px] mx-auto px-4 pt-4 space-y-4">
        <p className="font-ui text-[12px] text-grove-sage">
          Pick up to 3 to display publicly. Locked badges show their unlock hint.
        </p>

        {/* Phase 14C.4 — pinned goals helper */}
        {pinnedSlugs.size > 0 && (
          <div
            className="rounded-[10px] border-[0.5px] border-grove-fernLine bg-grove-canopy px-3 py-2 inline-flex items-center gap-2"
            data-testid="badges-goal-counter"
          >
            <Target className="h-3.5 w-3.5 text-grove-sprout" />
            <span className="font-plant text-[12px] text-grove-cream">
              {pinnedSlugs.size} of 5 goals pinned
            </span>
            <span className="font-latin italic text-[11px] text-grove-lichen">·</span>
            <button
              type="button"
              onClick={() => navigate('/care/today')}
              className="font-plant text-xs text-grove-sprout hover:text-grove-sprout"
              data-testid="badges-view-on-care"
            >
              View on Care tab
            </button>
          </div>
        )}
        {/* Displayed picker */}
        <div
          className="rounded-[14px] border-[0.5px] border-grove-fernLine bg-grove-moss p-4"
          data-testid="badges-displayed-section"
        >
          <div className="flex items-center justify-between gap-2 mb-3">
            <h3 className="font-plant text-sm text-grove-cream inline-flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-grove-sprout" />
              Displayed on your profile
            </h3>
            <button
              type="button"
              onClick={() => { setPickerSelection(data.displayed || []); setPickerOpen(true); }}
              data-testid="badges-edit-picker"
              className="rounded-[12px] font-ui text-xs px-3 py-1.5 border-[0.5px] border-grove-fernLine bg-grove-canopy text-grove-cream hover:bg-grove-sprout hover:text-grove-cream transition-colors duration-150"
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
                  className={`rounded-[10px] border-[0.5px] p-3 ${
                    item ? 'bg-grove-canopy border-grove-fernLine' : 'bg-grove-canopy border-dashed border-grove-moss'
                  } flex flex-col items-center text-center`}
                  data-testid={`badges-displayed-slot-${i}`}
                >
                  {item ? (
                    <>
                      <BadgeTile item={item} compact />
                      <p className="font-plant text-[11px] text-grove-cream mt-1.5 leading-tight">
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
          <span className="font-plant text-xs text-grove-sage flex items-center gap-1">
            <Filter className="h-3 w-3" /> Show
          </span>
          {FILTER_TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setFilter(t.id)}
              data-testid={`badges-filter-${t.id}`}
              className={`rounded-[12px] font-ui text-xs px-3 py-1.5 border-[0.5px] transition-colors duration-150 ${
                filter === t.id
                  ? 'bg-grove-lime text-grove-root border-grove-fernLine'
                  : 'bg-transparent text-grove-cream border-grove-moss hover:border-grove-fernLine'
              }`}
            >
              {t.label}
            </button>
          ))}
          <span className="w-px h-4 bg-grove-moss mx-1" />
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            data-testid="badges-cat-all"
            className={`rounded-[12px] font-ui text-xs px-3 py-1.5 border-[0.5px] transition-colors duration-150 ${
              selectedCategory === 'all'
                ? 'bg-grove-lime text-grove-root border-grove-fernLine'
                : 'bg-transparent text-grove-cream border-grove-moss hover:border-grove-fernLine'
            }`}
          >
            All categories
          </button>
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setSelectedCategory(c)}
              data-testid={`badges-cat-${c.toLowerCase().replace(/[^a-z]+/g, '-')}`}
              className={`rounded-[12px] font-ui text-xs px-3 py-1.5 border-[0.5px] transition-colors duration-150 ${
                selectedCategory === c
                  ? 'bg-grove-lime text-grove-root border-grove-fernLine'
                  : 'bg-transparent text-grove-cream border-grove-moss hover:border-grove-fernLine'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Empty state */}
        {grouped.length === 0 && (
          <div className="rounded-[14px] border-[0.5px] border-grove-moss bg-grove-moss p-8 text-center">
            <p className="font-plant text-grove-cream text-sm">No badges match this filter.</p>
            <p className="font-latin italic text-[12px] text-grove-lichen mt-1">
              Try a different category or switch the Earned/Locked filter.
            </p>
          </div>
        )}

        {/* Grid grouped by subcategory */}
        {grouped.map(([title, items]) => (
          <section key={title} data-testid={`badges-group-${title.toLowerCase().replace(/[^a-z]+/g, '-')}`}>
            <h3 className="font-plant text-xs text-grove-sage mb-2">{title}</h3>
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
      className={`relative rounded-[10px] border-[0.5px] p-3 flex flex-col items-center text-center transition-colors duration-150 ${
        earned ? 'bg-grove-canopy border-grove-moss' : 'bg-grove-moss/60 border-dashed border-grove-moss'
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
          <span className="font-plant text-[8px]">Goal</span>
        </span>
      )}
      <span
        className={`${sizeClass} rounded-full flex items-center justify-center mb-1 ${earned ? '' : 'grayscale opacity-50'}`}
        style={
          earned && tierColor
            ? { backgroundColor: tierColor.bg, border: `0.5px solid ${tierColor.border}` }
            : { backgroundColor: earned ? '#EAF3DE' : '#D3C9B8' }
        }
      >
        {earned ? (
          <BadgeIcon name={item.icon} className="h-5 w-5" style={{ color: tierColor?.text || '#3B6D11' }} />
        ) : (
          <Lock className="h-4 w-4 text-grove-lichen" />
        )}
      </span>
      {!compact && (
        <>
          <p className={`font-plant text-[12px] leading-tight ${earned ? 'text-grove-cream' : 'text-grove-sage'}`}>
            {item.name}
          </p>
          {item.tier && earned && (
            <span
              className="font-plant text-[8px] mt-0.5 px-1.5 py-0.5 rounded-[12px]"
              style={{
                backgroundColor: tierColor.bg,
                color: tierColor.text,
                border: `0.5px solid ${tierColor.border}`,
              }}
            >
              {item.tier}
            </span>
          )}
          <p className="font-latin italic text-xs text-grove-lichen mt-1 leading-tight">
            {item.description}
          </p>
          {!earned && !item.earnable && (
            <p className="font-latin italic text-[11px] text-grove-sun mt-1">
              Granted by Grove
            </p>
          )}
          {canPin && (
            <button
              type="button"
              onClick={onTogglePin}
              disabled={pinning || (pinDisabled && !isPinned)}
              data-testid={`badge-tile-${item.slug}-pin-btn`}
              className={`mt-2 inline-flex items-center gap-1 rounded-[12px] font-ui text-[11px] px-2 py-1 border-[0.5px] transition-colors duration-150 ${
                isPinned
                  ? 'bg-grove-lime text-grove-root border-grove-fernLine hover:bg-grove-sprout'
                  : 'bg-transparent text-grove-sprout border-grove-fernLine hover:bg-grove-sprout hover:text-grove-cream'
              } disabled:opacity-40 disabled:cursor-not-allowed`}
              title={isPinned ? 'Unpin goal' : (pinDisabled ? 'You\'ve pinned 5 goals — unpin one first.' : 'Pin as goal')}
            >
              {pinning ? (
                <span className="w-2.5 h-2.5 border-[1.5px] border-current border-t-transparent rounded-full animate-spin" />
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
  // Lock body scroll while open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

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
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[4px]"
      onClick={onCancel}
      data-testid="badges-picker-modal"
    >
      <div
        className="bg-grove-canopy rounded-[14px] border-[0.5px] border-grove-moss shadow-xl w-full max-w-[640px] max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between p-5 border-b-[0.5px] border-grove-moss">
          <div className="flex-1 min-w-0">
            <h3 className="font-plant text-grove-cream text-lg">Pick up to 3 badges to display</h3>
            <p className="font-latin italic text-[11px] text-grove-lichen mt-1">
              {selection.length} of 3 selected · only the highest tier in each family is shown
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            data-testid="badges-picker-close"
            className="flex-shrink-0 p-1.5 rounded-[6px] hover:bg-grove-moss text-grove-sage transition-colors duration-150"
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
                <h4 className="font-plant text-xs text-grove-sage mb-2">
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
                        className={`relative rounded-[10px] border-[0.5px] p-3 flex flex-col items-center text-center transition-colors duration-150 ${
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
                        <p className="font-plant text-[12px] text-grove-cream mt-1.5 leading-tight">
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

        <div className="border-t-[0.5px] border-grove-moss p-4 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            data-testid="badges-picker-cancel"
            className="rounded-[12px] font-ui text-xs px-3 py-2 border-[0.5px] border-grove-moss bg-transparent text-grove-cream hover:border-grove-fernLine transition-colors duration-150"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            data-testid="badges-picker-save"
            className="rounded-[12px] font-ui text-xs px-3 py-2 bg-grove-lime text-grove-root hover:bg-grove-sprout transition-colors duration-150 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save selection'}
          </button>
        </div>
      </div>
    </div>
  );
}
