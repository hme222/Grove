import LoadError from '../components/LoadError';
import { LoadingList } from '../components/Loading';
import AppLink from '../components/AppLink';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { cn } from '../lib/utils';
import { buttonVariants } from '../components/ui/button';
import { useNavigate } from 'react-router-dom';
import { careAPI, waterAPI, plantAPI, userAPI, getFileUrl } from '../lib/api';
import { PageHeader, FilterChips, HeaderAction } from '../components/PageHeader';
import { CareTabs } from '../components/CareTabs';
import { EmptyState } from '../components/EmptyState';
import { EMPTY_STATES } from '@/constants/emptyStates';
import CareLogModal from '../components/CareLogModal';
import DailyMissionCard from '../components/DailyMissionCard';
import FirstSessionBanner, { isFirstSessionBannerShown } from '../components/FirstSessionBanner';
import SetupNote from '../components/SetupNote';
import ToxicityBadge from '../components/ToxicityBadge';
import NextLessonCard from '../components/NextLessonCard';
import LightPromptCard from '../components/LightPromptCard';
import PipNoteCard from '../components/PipNoteCard';
import PhotoBand from '../components/PhotoBand';
import FirstCareCelebration from '../components/FirstCareCelebration';
import { useFirstCareCelebration } from '../nook/useFirstCareCelebration';
import SectionTutorial from '../components/SectionTutorial';
import WorkingTowardSection from '../components/WorkingTowardSection';
import DailyTriviaCard from '../components/DailyTriviaCard';
import { notificationsAPI } from '../lib/api';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '../components/ui/alert-dialog';
import { Droplets, Check, Leaf, X, Sparkles, Search } from 'lucide-react';
import { toast } from 'sonner';
import { impactLight, impactMedium } from '../lib/haptics';
import { useAuth } from '../contexts/AuthContext';
import { dueLabel, careStep, careTextMode } from '../lib/careCopy';
import CareTextToggle from '../components/CareTextToggle';
import UndoSnackbar from '../components/UndoSnackbar';
import RoundSummaryCard from '../components/RoundSummaryCard';

const FILTERS = [
  { value: 'all', label: 'All due' },
  { value: 'urgent', label: 'Needs a check' },
  { value: 'needs_water', label: 'Due today' },
];

// Urgency visual tokens (kept on-brand, no raw reds/greens/blues).
const URGENCY_STYLES = {
  // Calm on purpose: a colored stripe and dot mark the plant, the words say what happened.
  urgent: {
    border: 'border-grove-bloom/40',
    bg: 'bg-grove-canopy',
    dot: 'bg-grove-bloom',
    label: 'text-grove-sage',
    accent: 'var(--grove-bloom)',
  },
  needs_water: {
    border: 'border-grove-sun/25',
    bg: 'bg-grove-canopy',
    dot: 'bg-grove-sun',
    label: 'text-grove-sage',
    accent: 'var(--grove-sun)',
  },
  healthy: {
    border: 'border-grove-fernLine/25',
    bg: 'bg-grove-moss',
    dot: 'bg-grove-lime',
    label: 'text-grove-sprout',
    accent: 'var(--grove-lime)',
  },
  propagating: {
    border: 'border-grove-lime/40',
    bg: 'bg-grove-lime/15',
    dot: 'bg-grove-lime',
    label: 'text-grove-sprout',
    accent: 'var(--grove-sprout)',
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
  const [loadError, setLoadError] = useState(false);
  const [careModalPlant, setCareModalPlant] = useState(null);
  const [wateringAll, setWateringAll] = useState(false);
  const [confirmWaterAll, setConfirmWaterAll] = useState(false);
  const waterAllRef = React.useRef(null);
  const [exiting, setExiting] = useState(new Set()); // plant ids currently animating out
  const [sessionCount, setSessionCount] = useState(0); // session = plants logged this visit
  const [sessionPlants, setSessionPlants] = useState([]); // { id, name } of each plant tended this visit
  const firstCare = useFirstCareCelebration(user, updateUser);
  const [allPlants, setAllPlants] = useState([]); // for named-plant empty state
  const [allPlantsLoaded, setAllPlantsLoaded] = useState(false); // false until the collection really loaded, so a failed fetch is never read as zero plants
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
      toast.error("Couldn’t save that setting. Try again.");
    } finally {
      setSavingTextMode(false);
    }
  };

  const fetchDue = async () => {
    try {
      const res = await careAPI.getDueToday();
      setPlants(res.data);
      setLoadError(false);
    } catch (e) {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllPlantsLite = async () => {
    try {
      const res = await plantAPI.getAll({});
      setAllPlants(res.data?.plants || []);
      setAllPlantsLoaded(true);
    } catch {
      // silent \u2014 only used for empty state copy
    }
  };

  useEffect(() => { fetchDue(); fetchAllPlantsLite(); }, []);

  // When the list empties, read the plants again so "Next up" reflects what was just logged.
  const dueCount = plants.length;
  useEffect(() => {
    if (!loading && dueCount === 0 && sessionPlants.length > 0) fetchAllPlantsLite();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, dueCount]);

  const plantName = (p) => p.nickname || p.common_name || 'A plant';
  const addToSession = (list) => setSessionPlants((prev) => {
    const seen = new Set(prev.map((x) => x.id));
    return [...prev, ...list.filter((x) => !seen.has(x.id)).map((x) => ({ id: x.id, name: plantName(x) }))];
  });

  const maybeCelebrateFirstCare = firstCare.celebrate;

  const filteredPlants = useMemo(() => (
    filter === 'all' ? plants
      : plants.filter(p => p.status === filter)
  ), [filter, plants]);

  // A chip that would show the same plants as All due (or none) is not a choice, so it is not offered.
  const filterChips = FILTERS
    .map((f) => ({ ...f, n: f.value === 'all' ? plants.length : plants.filter((p) => p.status === f.value).length }))
    .filter((f) => f.value === 'all' || (f.n > 0 && f.n < plants.length) || f.value === filter)
    .map((f) => ({ value: f.value, label: `${f.label} · ${f.n}` }));

  const handleWaterAll = async (e) => {
    setWateringAll(true);
    impactMedium(e?.currentTarget);
    try {
      const res = await waterAPI.logRound(filteredPlants.map((p) => p.id));
      const watered = res.data.watered || 0;
      // The Water All button disappears with the list, so the Undo bar takes focus.
      if (res.data.round_id && watered > 0) setLastRound({ roundId: res.data.round_id, count: watered, ids: filteredPlants.map((p) => p.id) });
      else toast.success(`Watered ${watered} plants`);
      setSessionCount((c) => c + watered);
      if (watered > 0) addToSession(filteredPlants);
      maybeCelebrateFirstCare(res.data.first_care_pending);
      window.dispatchEvent(new Event('grove:mission-refresh'));
      // Animate everything out
      setExiting(new Set(filteredPlants.map(p => p.id)));
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

  // One plant, same path as Water all, so it gets the same Undo and the same honest failure.
  const handleWateredOne = async (plant, el) => {
    impactMedium(el);
    try {
      const res = await waterAPI.logRound([plant.id]);
      const watered = res.data.watered || 0;
      if (res.data.round_id && watered > 0) setLastRound({ roundId: res.data.round_id, count: watered, ids: [plant.id] });
      handlePlantLogged(plant.id, { first_care_pending: res.data.first_care_pending });
    } catch {
      toast.error("Couldn’t save that. Check your connection and try again.");
    }
  };

  const dismissUndo = useCallback(() => setLastRound(null), []);

  const handleUndoRound = async () => {
    if (!lastRound) return;
    setUndoing(true);
    try {
      await waterAPI.undoRound(lastRound.roundId);
      setSessionCount((c) => Math.max(0, c - lastRound.count));
      setSessionPlants((prev) => prev.filter((x) => !(lastRound.ids || []).includes(x.id)));
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
    const logged = plants.find((p) => p.id === plantId);
    if (logged) addToSession([logged]);
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

  const sessionActive = sessionCount > 0;
  const endSession = () => { setSessionCount(0); setSessionPlants([]); };
  const showRoundSummary = !loading && !loadError && plants.length === 0 && sessionPlants.length > 0;

  // Try again keeps the error card up (it says "Trying again…") until the request settles, so a retry
  // can never flash an empty list or a zero.
  const retryLoad = async () => {
    await fetchDue();
    document.getElementById('main-content')?.focus();
  };

  return (
    <div className="pb-24">
      <SectionTutorial tutorialId="care" />
      <PageHeader title="Today">
        <CareTabs />
      </PageHeader>
      <FirstSessionBanner />

      <div className="max-w-content mx-auto px-4 pt-4 pb-4 space-y-3">
        {!loadError && filterChips.length > 1 && (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <FilterChips filters={filterChips} active={filter} onChange={setFilter} />
          </div>
        )}
        {!loading && !loadError && plants.length > 0 && (
          <div className="flex items-center justify-between gap-2">
            <p role="status" className="font-ui text-sm text-grove-sage" data-testid="care-filter-status">
              {filteredPlants.length} {filteredPlants.length === 1 ? 'plant' : 'plants'} shown
            </p>
            {filteredPlants.length > 0 && (
              <HeaderAction
                ref={waterAllRef}
                icon={Droplets}
                onClick={() => setConfirmWaterAll(true)}
                disabled={wateringAll}
                data-testid="water-all-button"
              >
                {wateringAll ? 'Watering…' : 'Water all'}
              </HeaderAction>
            )}
          </div>
        )}
        <button
          type="button"
          onClick={() => navigate('/search')}
          data-testid="today-search"
          className="flex min-h-touch w-full items-center gap-2 rounded-control border-hairline border-grove-inputOutline bg-grove-canopy px-4 text-left font-ui text-sm text-grove-sage hover:border-grove-lime"
        >
          <Search className="h-4 w-4" aria-hidden="true" />
          Search plants, guides and lessons
        </button>
      </div>

      <div className="max-w-content mx-auto px-4 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {loadError && !loading ? (<div className="col-span-full"><LoadError what="your plants for today" onRetry={retryLoad} /></div>) : loading ? (
          <LoadingList label="Loading today’s care" className="col-span-full" />
        ) : filteredPlants.length === 0 && plants.length > 0 ? (
          <div className="col-span-full rounded-card border-hairline border-grove-moss bg-grove-canopy p-5 text-center" data-testid="care-filter-empty">
            <p className="font-plant text-base text-grove-cream">No plants match this filter.</p>
            <p className="mt-1 font-ui text-sm text-grove-sage">{plants.length} {plants.length === 1 ? 'plant is' : 'plants are'} due in all.</p>
            <button type="button" onClick={() => setFilter('all')} className={cn(buttonVariants({ variant: 'outline' }), "mt-3")}>Show all due</button>
          </div>
        ) : filteredPlants.length === 0 ? (
          <div className="col-span-full">
            {showRoundSummary ? (
              <RoundSummaryCard
                names={sessionPlants.map((x) => x.name)}
                plants={allPlants}
                onDone={() => { endSession(); document.getElementById('main-content')?.focus(); }}
              />
            ) : (
              <NamedPlantEmptyState plants={allPlants} collectionLoaded={allPlantsLoaded} firstCare={!user?.first_care_celebrated} onLogCare={setCareModalPlant} />
            )}
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
                className={`relative overflow-hidden rounded-small border-hairline ${style.border} ${style.bg} transform transition-all duration-settle ease-out ${
                  isExiting ? 'translate-x-full opacity-0 scale-95' : 'translate-x-0 opacity-100 scale-100'
                }`}
              >
                {/* Urgency stripe */}
                <div
                  aria-hidden="true"
                  className={`absolute left-0 top-3 bottom-3 w-1 rounded-r-pill ${style.dot}`}
                />

                <div className="flex flex-wrap gap-3 px-4 py-3">
                  <AppLink
                    to={`/plants/${plant.id}`}
                    state={{ name: plant.nickname || plant.common_name }}
                    className="flex-shrink-0 w-20 h-20 rounded-chip overflow-hidden border-hairline border-grove-moss bg-grove-moss flex items-center justify-center"
                    aria-label={`Open ${plant.nickname || plant.common_name}`}
                  >
                    {plant.photo_url ? (
                      <PhotoBand src={getFileUrl(plant.photo_url)} aspect="thumb" className="h-full w-full rounded-none" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Leaf className="h-7 w-7 text-grove-sprout opacity-40" />
                      </div>
                    )}
                  </AppLink>

                  <div className="flex min-w-0 flex-1 basis-40 flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`inline-block w-2 h-2 rounded-pill ${style.dot}`} aria-hidden="true" />
                        <h2 className="font-plant text-grove-cream text-base font-semibold truncate">
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
                          {plant.care_tip || careStep(plant)}
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

                    <div className="mt-2 flex min-w-0 flex-wrap items-center gap-2">
                      <button
                        onClick={(e) => { impactLight(e.currentTarget); setCareModalPlant(plant); }}
                        data-testid="care-quick-action"
                        aria-label={`Log care for ${plant.nickname || plant.common_name}`}
                        className={cn(buttonVariants(), "relative min-w-0 flex-1 overflow-hidden")}
                      >
                        <Droplets className="h-3.5 w-3.5" />
                        Log care
                      </button>
                      <button
                        onClick={(e) => handleWateredOne(plant, e.currentTarget)}
                        aria-label={`Mark ${plant.nickname || plant.common_name} watered`}
                        data-testid="care-mark-done"
                        className={cn(buttonVariants({ variant: 'outline' }), "relative min-w-0 flex-1 overflow-hidden")}
                      >
                        <Check className="h-4 w-4" aria-hidden="true" />
                        Watered
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>

      <div className="max-w-content mx-auto px-4 pb-4 space-y-3">
        <ScheduleReviewBanner />
        {!loading && plants.length > 0 && <SetupNote />}
      </div>

      {/* Phase 14C.4 — Daily plant trivia (Supplement v1 Part D.7).
          Positioned below the care queue so the urgent count + plant grid
          remain the primary above-the-fold focus. */}
      <div className="max-w-content mx-auto px-4 pb-4">
        <button
          type="button"
          onClick={() => navigate('/help-my-plant')}
          data-testid="help-my-plant-entry"
          className="block w-full rounded-card border-hairline border-grove-moss bg-grove-canopy p-5 text-left hover:border-grove-fernLine"
        >
          <p className="font-plant text-base font-semibold text-grove-cream">Something look off?</p>
          <p className="mt-0.5 font-ui text-sm text-grove-sage">Yellow leaves, drooping, bugs. Get quick checks to try first.</p>
        </button>
      </div>

      <section aria-labelledby="pip-heading" className="max-w-content mx-auto px-4 pb-4 space-y-3" data-testid="from-pip">
        <h2 id="pip-heading" className="font-plant text-xl font-semibold text-grove-cream pt-2">From Pip</h2>
        <div className="divide-y-hairline divide-grove-fernLine/25 rounded-card border-hairline border-grove-moss bg-grove-canopy px-5" data-testid="pip-note">
          <LightPromptCard embedded />
          {!(allPlantsLoaded && allPlants.length === 0) && !isFirstSessionBannerShown(user) && <DailyMissionCard embedded />}
          <NextLessonCard embedded />
          {user?.nook_enabled ? <PipNoteCard embedded /> : <DailyTriviaCard embedded />}
        </div>
        <WorkingTowardSection />
        <div className="pt-1">
          <CareTextToggle value={textMode} onChange={handleTextModeChange} disabled={savingTextMode} />
        </div>
      </section>

      <AlertDialog open={confirmWaterAll} onOpenChange={setConfirmWaterAll}>
        <AlertDialogContent data-testid="water-all-dialog" onCloseAutoFocus={(e) => { e.preventDefault(); waterAllRef.current?.focus(); }}>
          <AlertDialogHeader>
            <AlertDialogTitle>Water {filteredPlants.length === 1 ? 'this plant' : `all ${filteredPlants.length} plants`}?</AlertDialogTitle>
            <AlertDialogDescription>
              This logs a watering for {filteredPlants.length === 1 ? 'the plant' : 'every plant'} on the list you are looking at, including ones you have not checked. Only water the ones that felt dry. You can undo it right after.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction data-testid="water-all-confirm" onClick={(e) => handleWaterAll(e)}>Water all</AlertDialogAction>
            <AlertDialogCancel data-testid="water-all-cancel">Not yet</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Sticky in-progress session bar (above bottom nav) */}
      {sessionActive && (
        <div
          data-testid="care-session-bar"
          className="fixed left-0 right-0 bottom-nav z-nav mx-auto max-w-column px-3"
        >
          <div className="rounded-small border-hairline border-grove-fernLine bg-grove-lime text-grove-root px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-pill bg-grove-lime flex items-center justify-center flex-shrink-0">
              <Sparkles className="h-4 w-4 text-grove-root" aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-ui text-xs font-medium text-grove-root">Watering session in progress</p>
              <p className="font-ui text-sm truncate">
                {sessionCount} {sessionCount === 1 ? 'plant' : 'plants'} checked
              </p>
            </div>
            <button
              onClick={endSession}
              aria-label="End session"
              data-testid="care-session-end"
              className="group flex h-touch w-touch items-center justify-center"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-pill border-hairline border-grove-root text-grove-root group-hover:bg-grove-root group-hover:text-grove-lime">
                <X className="h-4 w-4" />
              </span>
            </button>
          </div>
        </div>
      )}

      {lastRound && (
        <div className={`fixed left-0 right-0 z-nav mx-auto max-w-column px-3 ${sessionActive ? 'bottom-nav-stack' : 'bottom-nav'}`}>
          <UndoSnackbar
            message={`Watered ${lastRound.count} ${lastRound.count === 1 ? 'plant' : 'plants'}`}
            onUndo={handleUndoRound}
            onDismiss={dismissUndo}
            busy={undoing}
            focusOnShow
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
        open={firstCare.open}
        onClose={firstCare.close}
      />
    </div>
  );
}

// ----- Named-plant empty state for the care list -----
function NamedPlantEmptyState({ plants, collectionLoaded, firstCare, onLogCare }) {
  if (collectionLoaded && (!plants || plants.length === 0)) {
    return <EmptyState config={EMPTY_STATES.collection_zero_plants} />;
  }
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
      className="rounded-small border-hairline border-grove-moss bg-grove-canopy p-5 text-center max-w-md mx-auto"
    >
      <div className="w-12 h-12 mx-auto rounded-pill bg-grove-moss flex items-center justify-center mb-3">
        <Sparkles className="h-5 w-5 text-grove-sprout" />
      </div>
      {firstCare ? (
        <>
          <p className="font-plant text-grove-cream text-base">Ready for your first care?</p>
          <p className="font-ui text-sm text-grove-sage mt-1.5 leading-snug">
            {nextName} isn’t due to be watered until <span className="text-grove-cream">{dueLabel}</span>. Log a first care now to start its journal.
          </p>
          <button type="button" onClick={() => onLogCare(next)} className={cn(buttonVariants(), 'mt-4')} data-testid="care-first-log">
            Log care for {nextName}
          </button>
        </>
      ) : (
        <>
          <p className="font-plant text-grove-cream text-base">All caught up.</p>
          <p className="font-ui text-sm text-grove-sage mt-1.5 leading-snug">
            {nextName} is the next one up — due to be watered <span className="text-grove-cream">{dueLabel}</span>.
            Take a slow scroll through your collection while you're here.
          </p>
        </>
      )}
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
      className="mt-3 rounded-control border-hairline border-grove-moss bg-grove-sun/15 p-3 flex items-start gap-3"
      data-testid="schedule-review-banner"
    >
      <span className="w-8 h-8 rounded-pill bg-grove-sun/25 flex items-center justify-center flex-shrink-0">
        <Sparkles className="h-4 w-4 text-grove-sun" />
      </span>
      <div className="flex-1 min-w-0">
        <p className="font-ui text-sm font-medium text-grove-cream leading-tight">
          Time to review your AI schedule
        </p>
        <p className="font-ui text-xs text-grove-sage mt-0.5 leading-snug">
          It&apos;s been 30 days since the AI suggested a watering cadence for {first.nickname || first.common_name}
          {more > 0 ? ` and ${more} other plant${more === 1 ? '' : 's'}` : ''}. Tap to review and adjust if your reality has changed.
        </p>
      </div>
      <button
        type="button"
        onClick={() => navigate(`/plants/${first.plant_id}`, { state: { name: first.nickname || first.common_name } })}
        data-testid="schedule-review-cta"
        className={cn(buttonVariants(), "flex-shrink-0")}
      >
        Review
      </button>
    </div>
  );
}
