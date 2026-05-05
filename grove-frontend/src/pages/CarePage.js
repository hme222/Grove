import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { careAPI, waterAPI, plantAPI, getFileUrl } from '../lib/api';
import { PageHeader, FilterChips } from '../components/PageHeader';
import { EmptyState } from '../components/EmptyState';
import { EMPTY_STATES } from '@/constants/emptyStates';
import CareLogModal from '../components/CareLogModal';
import DailyMissionCard from '../components/DailyMissionCard';
import FirstCareCelebration from '../components/FirstCareCelebration';
import SectionTutorial from '../components/SectionTutorial';
import WorkingTowardSection from '../components/WorkingTowardSection';
import DailyTriviaCard from '../components/DailyTriviaCard';
import { notificationsAPI } from '../lib/api';
import { Droplets, Check, Leaf, X, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { impactLight, impactMedium, success, spawnRipple } from '../lib/haptics';
import { useAuth } from '../contexts/AuthContext';

const FILTERS = [
  { value: 'all', label: 'All due' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'needs_water', label: 'Water today' },
];

// Urgency visual tokens (kept on-brand, no raw reds/greens/blues).
const URGENCY_STYLES = {
  urgent: {
    border: 'border-[#D4537E]/60',
    bg: 'bg-[#FBEAF0]',
    dot: 'bg-[#D4537E]',
    label: 'text-[#D4537E]',
    accent: '#D4537E',
  },
  needs_water: {
    border: 'border-[#C18A2A]/50',
    bg: 'bg-[#F7EED9]',
    dot: 'bg-[#C18A2A]',
    label: 'text-[#8A6A3D]',
    accent: '#C18A2A',
  },
  healthy: {
    border: 'border-[#3B6D11]/30',
    bg: 'bg-[#EAF3DE]',
    dot: 'bg-[#3B6D11]',
    label: 'text-[#3B6D11]',
    accent: '#3B6D11',
  },
  propagating: {
    border: 'border-[#5DCAA5]/40',
    bg: 'bg-[#E7F6EF]',
    dot: 'bg-[#5DCAA5]',
    label: 'text-[#3B6D11]',
    accent: '#5DCAA5',
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
      toast.success(`Watered ${res.data.watered} plants`);
      setSessionCount((c) => c + (res.data.watered || 0));
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

  const getDueLabel = (plant) => {
    if (!plant.next_water_due) return 'Schedule needed';
    const due = new Date(plant.next_water_due);
    const now = new Date();
    const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
    if (diffDays < -1) return `Overdue ${Math.abs(diffDays)} days`;
    if (diffDays < 0) return 'Overdue today';
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    return `Due in ${diffDays} days`;
  };

  const sessionActive = sessionCount > 0;

  return (
    <div className="pb-24">
      <SectionTutorial tutorialId="care" />
      <PageHeader
        title="Care"
        count={plants.length}
        rightContent={
          plants.length > 0 ? (
            <button
              onClick={handleWaterAll}
              disabled={wateringAll}
              data-testid="water-all-button"
              className="rounded-[2px] font-plant uppercase tracking-[0.08em] text-[10px] px-3 py-2 border-[0.5px] bg-[#3B6D11] text-[#F5F0E8] border-[#3B6D11] hover:bg-[#639922] disabled:opacity-50 transition-colors duration-150 flex items-center gap-1.5"
            >
              <Droplets className="h-3.5 w-3.5" />
              {wateringAll ? 'Watering...' : 'Water All'}
            </button>
          ) : null
        }
      >
        <FilterChips filters={FILTERS} active={filter} onChange={setFilter} />
      </PageHeader>

      <div className="max-w-[900px] mx-auto px-4 py-4">
        <DailyMissionCard />
        <ScheduleReviewBanner />
        <WorkingTowardSection />
      </div>

      <div className="max-w-[900px] mx-auto px-4 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {loading ? (
          <div className="col-span-full flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-[#3B6D11] border-t-transparent rounded-full animate-spin" />
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
                    className="flex-shrink-0 w-20 h-20 rounded-[12px] overflow-hidden border-[0.5px] border-[#D3C9B8] bg-[#EAF3DE] flex items-center justify-center"
                    aria-label={`Open ${plant.nickname || plant.common_name}`}
                  >
                    {plant.photo_url ? (
                      <img src={getFileUrl(plant.photo_url)} alt="" className="max-w-full max-h-full w-auto h-auto object-contain" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Leaf className="h-7 w-7 text-[#3B6D11] opacity-40" />
                      </div>
                    )}
                  </button>

                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`inline-block w-2 h-2 rounded-full ${style.dot}`} aria-hidden="true" />
                        <h3 className="font-plant text-[#1C2E10] text-base truncate">
                          {plant.nickname || plant.common_name}
                        </h3>
                      </div>
                      <p className={`font-ui text-xs mt-1 ${style.label}`}>
                        {getDueLabel(plant)}
                      </p>
                      {plant.status_reason && (status === 'urgent' || status === 'needs_water') && (
                        <p
                          data-testid="care-card-status-reason"
                          className="font-ui italic text-[11px] text-[#5F5E5A] mt-0.5 leading-snug line-clamp-2"
                        >
                          {plant.status_reason}
                        </p>
                      )}
                      <p className="font-latin text-[10px] text-[#2B2B26] mt-0.5 truncate">
                        {plant.latin_name || plant.common_name}
                        {plant.room && <span className="text-[#D3C9B8]"> · {plant.room}</span>}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={(e) => { impactLight(e.currentTarget); setCareModalPlant(plant); }}
                        data-testid="care-quick-action"
                        className="relative overflow-hidden flex-1 rounded-[8px] border-[0.5px] border-[#3B6D11] bg-[#3B6D11] text-[#F5F0E8] hover:bg-[#2D5016] font-plant uppercase tracking-[0.08em] text-[10px] px-3 py-2 flex items-center justify-center gap-1.5 transition-colors duration-150"
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
                        className="relative overflow-hidden w-9 h-9 rounded-full border-[0.5px] border-[#3B6D11] bg-[#EAF3DE] text-[#3B6D11] hover:bg-[#3B6D11] hover:text-[#F5F0E8] flex items-center justify-center transition-colors duration-150"
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
      <div className="max-w-[900px] mx-auto px-4 pb-2">
        <DailyTriviaCard />
      </div>

      {/* Sticky in-progress session bar (above bottom nav) */}
      {sessionActive && (
        <div
          data-testid="care-session-bar"
          className="fixed left-0 right-0 bottom-[84px] z-40 mx-auto max-w-[600px] px-3"
        >
          <div className="rounded-[14px] border-[0.5px] border-[#3B6D11] bg-[#1C2E10] text-[#F5F0E8] px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#2D5016] flex items-center justify-center flex-shrink-0">
              <Sparkles className="h-4 w-4 text-[#9FE1CB]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-plant uppercase tracking-[0.1em] text-[10px] text-[#9FE1CB]">Watering session in progress</p>
              <p className="font-ui text-sm truncate">
                {sessionCount} {sessionCount === 1 ? 'plant' : 'plants'} tended so far. Keep going.
              </p>
            </div>
            <button
              onClick={() => setSessionCount(0)}
              aria-label="End session"
              data-testid="care-session-end"
              className="w-8 h-8 rounded-full border-[0.5px] border-[#5DCAA5]/40 text-[#9FE1CB] hover:bg-[#2D5016] flex items-center justify-center"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
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
      className="rounded-[14px] border-[0.5px] border-[#D3C9B8] bg-[#FDFAF6] px-5 py-6 text-center max-w-md mx-auto"
    >
      <div className="w-12 h-12 mx-auto rounded-full bg-[#EAF3DE] flex items-center justify-center mb-3">
        <Sparkles className="h-5 w-5 text-[#3B6D11]" />
      </div>
      <p className="font-plant text-[#1C2E10] text-base">All caught up.</p>
      <p className="font-ui text-sm text-[#5F5E5A] mt-1.5 leading-snug">
        {nextName} is the next one up — due to be watered <span className="text-[#1C2E10]">{dueLabel}</span>.
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
      className="mt-3 rounded-[12px] border-[0.5px] border-[#BA7517] bg-[#FBF1E1] p-3 flex items-start gap-3"
      data-testid="schedule-review-banner"
    >
      <span className="w-8 h-8 rounded-full bg-[#BA7517]/20 flex items-center justify-center flex-shrink-0">
        <Sparkles className="h-4 w-4 text-[#7A4F0E]" />
      </span>
      <div className="flex-1 min-w-0">
        <p className="font-plant text-sm text-[#1C2E10] leading-tight">
          Time to review your AI schedule
        </p>
        <p className="font-ui text-[11px] text-[#5F5E5A] mt-0.5 leading-snug">
          It&apos;s been 30 days since the AI suggested a watering cadence for {first.nickname || first.common_name}
          {more > 0 ? ` and ${more} other plant${more === 1 ? '' : 's'}` : ''}. Tap to review and adjust if your reality has changed.
        </p>
      </div>
      <button
        type="button"
        onClick={() => navigate(`/plants/${first.plant_id}`)}
        data-testid="schedule-review-cta"
        className="flex-shrink-0 rounded-[2px] font-plant uppercase tracking-[0.08em] text-[10px] px-3 py-2 bg-[#1C2E10] text-[#F5F0E8] border-[0.5px] border-[#1C2E10] hover:bg-[#2D5016] transition-colors duration-150"
      >
        Review
      </button>
    </div>
  );
}
