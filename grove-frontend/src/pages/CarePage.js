import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { careAPI, waterAPI, plantAPI, userAPI, getFileUrl } from '../lib/api';
import { PageHeader, FilterChips } from '../components/PageHeader';
import { EmptyState } from '../components/EmptyState';
import { EMPTY_STATES } from '@/constants/emptyStates';
import CareLogModal from '../components/CareLogModal';
import DailyMissionCard from '../components/DailyMissionCard';
import SetupNote from '../components/SetupNote';
import ToxicityBadge from '../components/ToxicityBadge';
import NextLessonCard from '../components/NextLessonCard';
import FirstCareCelebration from '../components/FirstCareCelebration';
import SectionTutorial from '../components/SectionTutorial';
import WorkingTowardSection from '../components/WorkingTowardSection';
import DailyTriviaCard from '../components/DailyTriviaCard';
import { notificationsAPI } from '../lib/api';
import { Droplets, Check, Leaf, X, Sparkles, Search } from 'lucide-react';
import { toast } from 'sonner';
import { impactLight, impactMedium, success, spawnRipple } from '../lib/haptics';
import { useAuth } from '../contexts/AuthContext';
import { dueLabel, careStep, careTextMode } from '../lib/careCopy';
import CareTextToggle from '../components/CareTextToggle';
import UndoSnackbar from '../components/UndoSnackbar';

const FILTERS = [
  { value: 'all', label: 'All due' },
  { value: 'urgent', label: 'Needs a check' },
  { value: 'needs_water', label: 'Water today' },
];

// Urgency visual tokens (kept on-brand, no raw reds/greens/blues).
const URGENCY_STYLES = {
  // Calm on purpose: a coloured stripe and dot mark the plant, the words say what happened.
  urgent: {
    border: 'border-grove-bloom/40',
    bg: 'bg-grove-canopy',
    dot: 'bg-grove-bloom',
    label: 'text-grove-sage',
    accent: '#E57A9C',
  },
  needs_water: {
    border: 'border-grove-sun/30',
    bg: 'bg-grove-canopy',
    dot: 'bg-grove-sun',
    label: 'text-grove-sage',
    accent: '#E8D77A',
  },
  healthy: {
    border: 'border-grove-fernLine/30',
    bg: 'bg-grove-moss',
    dot: 'bg-grove-lime',
    label: 'text-grove-sprout',
    accent: '#92B44B',
  },
  propagating: {
    border: 'border-grove-lime/40',
    bg: 'bg-grove-lime/10',
    dot: 'bg-grove-lime',
    label: 'text-grove-sprout',
    accent: '#C3D98A',
  },
};

function getUrgencyStyle(status) {
  return URGENCY_STYLES[status] || URGENCY_STYLES.needs_water;
}

export default function CarePage() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [plants, setPlants] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [careModalPlant, setCareModalPlant] = useState(null);
  const [wateringAll, setWateringAll] = useState(false);
  const [exiting, setExiting] = useState(new Set()); // plant ids currently animating out
  const [sessionCount, setSessionCount] = useState(0); // session = plants logged this visit
  const [showFirstCare, setShowFirstCare] = useState(false);
  const [allPlants, setAllPlants] = useState([]); // for named-plant empty state
  const [lastRound, setLastRound] = useState(null); // { roundId, count } while Undo is offered
  const [undoing, setUndoing] = useState(false);
  const textMode = careTextMode(user);
  const [savingTextMode, setSavingTextMode] = useState(false);

  // Simple shows the exact step; Detailed adds why. Saved to the profile.
  const handleTextModeChange = async (mode) => {
    if (mode === textMode) return;
    const previous = textMode;
    if (updateUser) updateUser({ care_text_detail: mode });
    setSavingTextMode(true);
    try {
      await userAPI.updateMe({ care_text_detail: mode });
    } catch {
      if (updateUser) updateUser({ care_text_detail: previous });
      toast.error("Couldn't save that setting. Try again.");
    } finally {
      setSavingTextMode(false);
    }
  };

  const fetchDue = async () => {
    try {
      const res = await careAPI.getDueToday();
      setPlants(res.data);
    } catch (e) {
      toast.error('Failed to load care tasks');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllPlantsLite = async () => {
    try {
      const res = await plantAPI.getAll({});
      setAllPlants(res.data?.plants || []);
    } catch {
      // silent \u2014 only used for empty state copy
    }
  };

  useEffect(() => { fetchDue(); fetchAllPlantsLite(); }, []);

  const maybeCelebrateFirstCare = (firstCarePending) => {
    if (firstCarePending && user && !user.first_care_celebrated) {
      setShowFirstCare(true);
      // Optimistically mark on client so the overlay only fires once even if
      // server sync is delayed.
      if (updateUser) updateUser({ first_care_celebrated: true });
    }
  };

  const handleWaterAll = async (e) => {
    setWateringAll(true);
    impactMedium(e?.currentTarget);
    try {
      const res = await waterAPI.logRound();
      const watered = res.data.watered || 0;
      // The Water All button disappears with the list, so the Undo bar takes focus.
      if (res.data.round_id && watered > 0) setLastRound({ roundId: res.data.round_id, count: watered });
      else toast.success(`Watered ${watered} plants`);
      setSessionCount((c) => c + watered);
      maybeCelebrateFirstCare(res.data.first_care_pending);
      window.dispatchEvent(new Event('grove:mission-refresh'));
      // Animate everything out
      setExiting(new Set(plants.map(p => p.id)));
      setTimeout(() => {
        setExiting(new Set());
        fetchDue();
      }, 320);
    } catch (e) {
      toast.error('Water round failed');
    } finally {
      setWateringAll(false);
    }
  };

  const dismissUndo = useCallback(() => setLastRound(null), []);

  const handleUndoRound = async () => {
    if (!lastRound) return;
    setUndoing(true);
    try {
      await waterAPI.undoRound(lastRound.roundId);
      setSessionCount((c) => Math.max(0, c - lastRound.count));
      toast.success('Water round undone');
      fetchDue();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Couldn't undo that. Try again.");
    } finally {
      setUndoing(false);
      setLastRound(null);
    }
  };

  // Called when a per-plant care action is logged via the modal.
  const handlePlantLogged = (plantId, meta) => {
    setSessionCount((c) => c + 1);
    setExiting((prev) => {
      const next = new Set(prev);
      next.add(plantId);
      return next;
    });
    if (meta) maybeCelebrateFirstCare(meta.first_care_pending);
    window.dispatchEvent(new Event('grove:mission-refresh'));
    setTimeout(() => {
      setExiting((prev) => {
        const next = new Set(prev);
        next.delete(plantId);
        return next;
      });
      fetchDue();
    }, 320);
  };

  const filteredPlants = useMemo(() => (
    filter === 'all' ? plants : plants.filter(p => p.status === filter)
  ), [filter, plants]);

  const sessionActive = sessionCount > 0;

  return (
    <div className="pb-24">
      <SectionTutorial tutorialId="care" />
      <PageHeader
        title="Today"
        count={plants.length}
        rightContent={
          plants.length > 0 ? (
            <button
              onClick={handleWaterAll}
              disabled={wateringAll}
              data-testid="water-all-button"
              className="min-h-[44px] rounded-[12px] font-ui text-xs px-3 py-2 border-[0.5px] bg-grove-lime text-grove-root border-grove-fernLine hover:bg-grove-sprout disabled:opacity-50 transition-colors duration-150 flex items-center gap-1.5"
            >
              <Droplets className="h-3.5 w-3.5" />
              {wateringAll ? 'Watering...' : 'Water All'}
            </button>
          ) : null
        }
      >
        <FilterChips filters={FILTERS} active={filter} onChange={setFilter} />
      </PageHeader>

      <div className="max-w-[900px] mx-auto px-4 pt-4 pb-4 space-y-3">
        <button
          type="button"
          onClick={() => navigate('/search')}
          data-testid="today-search"
          className="flex min-h-[44px] w-full items-center gap-2 rounded-[12px] border-[0.5px] border-grove-fernLine bg-grove-canopy px-4 text-left font-ui text-sm text-grove-sage hover:border-grove-lime"
        >
          <Search className="h-4 w-4" aria-hidden="true" />
          Search plants, guides and lessons
        </button>
        <ScheduleReviewBanner />
        {!loading && plants.length > 0 && <SetupNote />}
      </div>

      <div className="max-w-[900px] mx-auto px-4 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {loading ? (
          <div className="col-span-full flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-grove-fernLine border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredPlants.length === 0 ? (
          <div className="col-span-full">
            <NamedPlantEmptyState plants={allPlants} />
          </div>
        ) : (
          filteredPlants.map(plant => {
            const status = plant.status || 'needs_water';
            const style = getUrgencyStyle(status);
            const isExiting = exiting.has(plant.id);
            return (
              <article
                key={plant.id}
                data-testid="care-card"
                data-status={status}
                className={`relative overflow-hidden rounded-[16px] border-[0.5px] ${style.border} ${style.bg} transform transition-all duration-[280ms] ease-out ${
                  isExiting ? 'translate-x-full opacity-0 scale-95' : 'translate-x-0 opacity-100 scale-100'
                }`}
              >
                {/* Urgency stripe */}
                <div
                  aria-hidden="true"
                  className={`absolute left-0 top-0 bottom-0 w-1 ${style.dot}`}
                />

                <div className="flex gap-3 p-3 pl-4">
                  <button
                    onClick={() => navigate(`/plants/${plant.id}`)}
                    className="flex-shrink-0 w-20 h-20 rounded-[12px] overflow-hidden border-[0.5px] border-grove-moss bg-grove-moss flex items-center justify-center"
                    aria-label={`Open ${plant.nickname || plant.common_name}`}
                  >
                    {plant.photo_url ? (
                      <img src={getFileUrl(plant.photo_url)} alt="" className="max-w-full max-h-full w-auto h-auto object-contain" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Leaf className="h-7 w-7 text-grove-sprout opacity-40" />
                      </div>
                    )}
                  </button>

                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`inline-block w-2 h-2 rounded-full ${style.dot}`} aria-hidden="true" />
                        <h2 className="font-plant text-grove-cream text-base truncate">
                          {plant.nickname || plant.common_name}
                        </h2>
                      </div>
                      <p className={`font-ui text-xs mt-1 ${style.label}`}>
                        {dueLabel(plant)}
                      </p>
                      {user?.has_pets && (
                        <ToxicityBadge toxicity={plant.species_toxicity} size="sm" className="mt-1.5" testId="care-card-toxicity" />
                      )}
                      {(status === 'urgent' || status === 'needs_water') && (
                        <p data-testid="care-card-step" className="font-ui text-xs text-grove-cream mt-0.5 leading-snug">
                          {careStep(plant)}
                        </p>
                      )}
                      {textMode === 'detailed' && plant.status_reason && (status === 'urgent' || status === 'needs_water') && (
                        <p
                          data-testid="care-card-status-reason"
                          className="font-ui text-xs text-grove-sage mt-0.5 leading-snug"
                        >
                          <span className="font-semibold">Why: </span>{plant.status_reason}
                        </p>
                      )}
                      <p className="font-latin text-xs text-grove-cream mt-0.5 truncate">
                        {plant.latin_name || plant.common_name}
                        {plant.room && <span className="text-grove-sage"> · {plant.room}</span>}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={(e) => { impactLight(e.currentTarget); setCareModalPlant(plant); }}
                        data-testid="care-quick-action"
                        className="relative overflow-hidden flex-1 rounded-[8px] border-[0.5px] border-grove-fernLine bg-grove-lime text-grove-root hover:bg-grove-sprout font-plant text-xs px-3 py-2 min-h-[44px] flex items-center justify-center gap-1.5 transition-colors duration-150"
                      >
                        <Droplets className="h-3.5 w-3.5" />
                        Log care
                      </button>
                      <button
                        onClick={async (e) => {
                          impactMedium(e.currentTarget);
                          try {
                            const res = await careAPI.createLog(plant.id, { action: 'water' });
                            const meta = res.data?._meta;
                            handlePlantLogged(plant.id, meta);
                          } catch {
                            handlePlantLogged(plant.id);
                          }
                        }}
                        aria-label="Mark done"
                        data-testid="care-mark-done"
                        className="relative overflow-hidden w-11 h-11 rounded-full border-[0.5px] border-grove-fernLine bg-grove-moss text-grove-sprout hover:bg-grove-sprout hover:text-grove-cream flex items-center justify-center transition-colors duration-150"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>

      {/* Phase 14C.4 — Daily plant trivia (Supplement v1 Part D.7).
          Positioned below the care queue so the urgent count + plant grid
          remain the primary above-the-fold focus. */}
      <div className="max-w-[900px] mx-auto px-4 pb-4">
        <button
          type="button"
          onClick={() => navigate('/help-my-plant')}
          data-testid="help-my-plant-entry"
          className="block w-full rounded-[22px] border-[0.5px] border-grove-moss bg-grove-canopy px-5 py-4 text-left hover:border-grove-fernLine"
        >
          <p className="font-plant text-lg text-grove-cream">Something look off?</p>
          <p className="mt-0.5 font-ui text-sm text-grove-sage">Yellow leaves, drooping, bugs. Get quick checks to try first.</p>
        </button>
      </div>

      <section aria-labelledby="pip-heading" className="max-w-[900px] mx-auto px-4 pb-4 space-y-3" data-testid="from-pip">
        <h2 id="pip-heading" className="font-plant text-xl text-grove-cream pt-2">From Pip</h2>
        <div className="divide-y divide-grove-fernLine/30 rounded-[22px] border-[0.5px] border-grove-moss bg-grove-canopy px-5" data-testid="pip-note">
          <DailyMissionCard embedded />
          <NextLessonCard embedded />
          <DailyTriviaCard embedded />
        </div>
        <WorkingTowardSection />
        <div className="pt-1">
          <CareTextToggle value={textMode} onChange={handleTextModeChange} disabled={savingTextMode} />
        </div>
      </section>

      {/* Sticky in-progress session bar (above bottom nav) */}
      {sessionActive && (
        <div
          data-testid="care-session-bar"
          className="fixed left-0 right-0 bottom-[calc(84px+env(safe-area-inset-bottom))] z-40 mx-auto max-w-[600px] px-3"
        >
          <div className="rounded-[14px] border-[0.5px] border-grove-fernLine bg-grove-lime text-grove-root px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-grove-lime flex items-center justify-center flex-shrink-0">
              <Sparkles className="h-4 w-4 text-grove-sprout" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-plant text-xs text-grove-sprout">Watering session in progress</p>
              <p className="font-ui text-sm truncate">
                {sessionCount} {sessionCount === 1 ? 'plant' : 'plants'} tended so far. Keep going.
              </p>
            </div>
            <button
              onClick={() => setSessionCount(0)}
              aria-label="End session"
              data-testid="care-session-end"
              className="w-8 h-8 rounded-full border-[0.5px] border-grove-lime/40 text-grove-sprout hover:bg-grove-sprout flex items-center justify-center"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {lastRound && (
        <div className={`fixed left-0 right-0 z-50 mx-auto max-w-[600px] px-3 ${sessionActive ? 'bottom-[calc(156px+env(safe-area-inset-bottom))]' : 'bottom-[calc(84px+env(safe-area-inset-bottom))]'}`}>
          <UndoSnackbar
            message={`Watered ${lastRound.count} ${lastRound.count === 1 ? 'plant' : 'plants'}`}
            onUndo={handleUndoRound}
            onDismiss={dismissUndo}
            busy={undoing}
            autoFocus
          />
        </div>
      )}

      {careModalPlant && (
        <CareLogModal
          open={!!careModalPlant}
          onClose={() => setCareModalPlant(null)}
          plantId={careModalPlant.id}
          plantName={careModalPlant.nickname || careModalPlant.common_name}
          onLogged={(meta) => {
            const pid = careModalPlant.id;
            setCareModalPlant(null);
            handlePlantLogged(pid, meta);
          }}
        />
      )}

      <FirstCareCelebration
        open={showFirstCare}
        onClose={() => setShowFirstCare(false)}
      />
    </div>
  );
}

// ----- Named-plant empty state for the care list -----
function NamedPlantEmptyState({ plants }) {
  if (!plants || plants.length === 0) {
    return <EmptyState config={EMPTY_STATES.care_all_done} />;
  }
  // Sort by next_water_due ascending; if missing, push to end.
  const sorted = [...plants].sort((a, b) => {
    const da = a.next_water_due ? new Date(a.next_water_due).getTime() : Infinity;
    const db = b.next_water_due ? new Date(b.next_water_due).getTime() : Infinity;
    return da - db;
  });
  const next = sorted[0];
  const nextName = next.nickname || next.common_name || 'your next plant';
  let dueLabel = 'soon';
  if (next.next_water_due) {
    const diffDays = Math.ceil((new Date(next.next_water_due).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) dueLabel = 'today';
    else if (diffDays === 1) dueLabel = 'tomorrow';
    else dueLabel = `in ${diffDays} days`;
  }
  return (
    <div
      data-testid="care-empty-named"
      className="rounded-[14px] border-[0.5px] border-grove-moss bg-grove-canopy px-5 py-6 text-center max-w-md mx-auto"
    >
      <div className="w-12 h-12 mx-auto rounded-full bg-grove-moss flex items-center justify-center mb-3">
        <Sparkles className="h-5 w-5 text-grove-sprout" />
      </div>
      <p className="font-plant text-grove-cream text-base">All caught up.</p>
      <p className="font-ui text-sm text-grove-sage mt-1.5 leading-snug">
        {nextName} is the next one up — due to be watered <span className="text-grove-cream">{dueLabel}</span>.
        Take a slow scroll through your collection while you're here.
      </p>
    </div>
  );
}

// Phase 14C — Adjust-your-AI-schedule nudge banner. Surfaces when any of the
// user's plants are due for a 30-day schedule review. Tap a plant to open it
// (where the inline watering stepper lives) and dismiss the nudge.
function ScheduleReviewBanner() {
  const [due, setDue] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await notificationsAPI.scheduleReviews();
        if (alive) setDue(res.data.plants || []);
      } catch { /* non-blocking */ }
      finally { if (alive) setLoaded(true); }
    })();
    return () => { alive = false; };
  }, []);

  if (!loaded || due.length === 0) return null;
  const first = due[0];
  const more = due.length - 1;

  return (
    <div
      className="mt-3 rounded-[12px] border-[0.5px] border-grove-moss bg-grove-sun/15 p-3 flex items-start gap-3"
      data-testid="schedule-review-banner"
    >
      <span className="w-8 h-8 rounded-full bg-[#BA7517]/20 flex items-center justify-center flex-shrink-0">
        <Sparkles className="h-4 w-4 text-grove-sun" />
      </span>
      <div className="flex-1 min-w-0">
        <p className="font-plant text-sm text-grove-cream leading-tight">
          Time to review your AI schedule
        </p>
        <p className="font-ui text-xs text-grove-sage mt-0.5 leading-snug">
          It&apos;s been 30 days since the AI suggested a watering cadence for {first.nickname || first.common_name}
          {more > 0 ? ` and ${more} other plant${more === 1 ? '' : 's'}` : ''}. Tap to review and adjust if your reality has changed.
        </p>
      </div>
      <button
        type="button"
        onClick={() => navigate(`/plants/${first.plant_id}`)}
        data-testid="schedule-review-cta"
        className="flex-shrink-0 rounded-[12px] font-ui text-xs px-3 py-2 bg-grove-lime text-grove-root border-[0.5px] border-grove-fernLine hover:bg-grove-sprout transition-colors duration-150"
      >
        Review
      </button>
    </div>
  );
}
