import LoadError from '../components/LoadError';
import { LoadingList } from '../components/Loading';
import { BULK_ACTIONS } from '../lib/careActions';
import { cn } from '../lib/utils';
import { buttonVariants } from '../components/ui/button';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { plantAPI, careAPI, bouquetAPI } from '../lib/api';
import PlantCard from '../components/PlantCard';
import PlantImage from '../components/PlantImage';
import { PageHeader, HeaderAction } from '../components/PageHeader';
import { EmptyState } from '../components/EmptyState';
import { EMPTY_STATES } from '@/constants/emptyStates';
import FirstSessionBanner from '../components/FirstSessionBanner';
import SectionTutorial from '../components/SectionTutorial';
import { Plus, Check, Leaf, Flower2, AlertTriangle, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AppLink } from '../components/AppLink';
import TabStrip from '../components/TabStrip';

// Phase 14A.2 — bulk multi-action set. Matches the single-plant CareLogModal.

const BULK_WARN_THRESHOLD = 20;
const BULK_BATCH_SIZE = 100;

export default function CollectionPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const roomFilter = searchParams.get('room') || '';
  // Bouquets live in their own segment, never mixed into the plant grid
  // (survey: 24/37 don't want them mixed in). `?view=bouquets` keeps it linkable.
  const view = searchParams.get('view') === 'bouquets' ? 'bouquets' : 'plants';
  const [plants, setPlants] = useState([]);
  const [bouquets, setBouquets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [bulkActions, setBulkActions] = useState(() => new Set());
  const [bulkRunning, setBulkRunning] = useState(false);
  const [bulkActionsOpen, setBulkActionsOpen] = useState(false);
  const [showTypePicker, setShowTypePicker] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      const [pRes, bRes] = await Promise.all([
        plantAPI.getAll({}),
        bouquetAPI.getAll({}).catch(() => ({ data: [] })),
      ]);
      setPlants(pRes.data.plants || []);
      setBouquets(Array.isArray(bRes.data) ? bRes.data : (bRes.data?.bouquets || []));
      setLoadError(false);
    } catch (e) {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleBulkAction = (value) => {
    setBulkActions(prev => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  };

  const selectAllPlants = () => {
    setSelected(new Set(filteredPlants.map(p => p.id)));
  };

  const clearBulkSelection = () => {
    setSelected(new Set());
    setBulkActions(new Set());
    setBulkActionsOpen(false);
  };

  const exitSelectionMode = () => {
    setSelectionMode(false);
    clearBulkSelection();
  };

  const handleBulkLog = async () => {
    if (selected.size === 0 || bulkActions.size === 0) return;
    setBulkRunning(true);
    try {
      const actions = Array.from(bulkActions);
      // The server takes up to 100 plants per request, so a bigger selection goes in batches.
      const ids = Array.from(selected);
      let logged = 0;
      let affected = 0;
      for (let i = 0; i < ids.length; i += BULK_BATCH_SIZE) {
        const res = await careAPI.bulkLog({ plant_ids: ids.slice(i, i + BULK_BATCH_SIZE), actions, notes: 'Bulk care' });
        logged += res.data?.logged ?? 0;
        affected += res.data?.plants_affected ?? 0;
      }
      const actionLabel = actions.length === 1 ? actions[0] : `${actions.length} actions`;
      toast.success(`${actionLabel} logged for ${affected} plant${affected === 1 ? '' : 's'} (${logged} total)`);
      exitSelectionMode();
      fetchAll();
      // Refresh mission state if the daily mission was touched.
      window.dispatchEvent(new CustomEvent('grove:mission-refresh'));
    } catch (_e) {
      toast.error('Bulk care failed');
    } finally {
      setBulkRunning(false);
    }
  };

  const selectedCount = selected.size;
  const showSoftWarning = selectedCount > BULK_WARN_THRESHOLD;
  const actionSummary = useMemo(() => Array.from(bulkActions).join(' · '), [bulkActions]);

  // Filter plants by room if query param is set
  const filteredPlants = roomFilter
    ? plants.filter(p => p.room === roomFilter)
    : plants;

  const showingBouquets = view === 'bouquets' && !roomFilter;
  const totalCount = showingBouquets ? bouquets.length : filteredPlants.length;
  const isEmpty = totalCount === 0 && !loading;
  // Counts live in tab labels or the toolbar line, never as a zero and never twice on screen.
  const tabCount = (n) => (loading || loadError || n === 0 ? undefined : n);
  const showViewSwitch = !roomFilter && (bouquets.length > 0 || showingBouquets);

  const setView = (next) => {
    if (next === view) return;
    if (selectionMode) exitSelectionMode();
    setSearchParams(next === 'bouquets' ? { view: 'bouquets' } : {});
  };

  // Try again keeps the error card up (it says "Trying again…") until the request settles, so a retry
  // can never flash an empty list or a zero.
  const retryLoad = async () => {
    await fetchAll();
    document.getElementById('main-content')?.focus();
  };

  return (
    <div>
      <SectionTutorial tutorialId="collection" />
      <PageHeader title="Plants" />
      <FirstSessionBanner />

      <div className="max-w-page mx-auto px-4 py-4">
        {!loadError && (
          <div className="mb-3 flex items-center justify-between gap-2" data-testid="collection-toolbar">
            <p className="font-ui text-sm text-grove-sage" data-testid="collection-count">
              {!showViewSwitch && !loading && totalCount > 0
                ? `${totalCount} ${showingBouquets ? (totalCount === 1 ? 'bouquet' : 'bouquets') : totalCount === 1 ? 'plant' : 'plants'}${roomFilter ? ' shown' : ''}`
                : ''}
            </p>
            <div className="flex items-center gap-2">
            {!showingBouquets && !isEmpty && (
              <HeaderAction
                onClick={() => { if (selectionMode) { exitSelectionMode(); } else { setSelectionMode(true); setSelected(new Set()); setBulkActions(new Set()); } }}
                data-testid="collection-select-button"
                pressed={selectionMode}
              >
                {selectionMode ? 'Cancel' : 'Select'}
              </HeaderAction>
            )}
            {!isEmpty && (
              <HeaderAction icon={Plus} onClick={() => setShowTypePicker(true)} data-testid="collection-add-button">
                Add
              </HeaderAction>
            )}
            </div>
          </div>
        )}
        <nav aria-label="More ways to browse your plants" className="mb-3 flex flex-wrap gap-2" data-testid="plants-shortcuts">
          {[['Search', '/search'], ['Rooms', '/rooms'], ['Want list', '/wants']].map(([label, path]) => (
            <AppLink key={path} to={path} data-testid={`plants-shortcut-${label.toLowerCase().replace(' ', '-')}`}
              className="inline-flex min-h-touch items-center gap-0.5 rounded-control pl-1 pr-2 font-ui text-sm text-grove-cream underline-offset-4 hover:underline">
              {label}
              <ChevronRight className="h-4 w-4 text-grove-sage" aria-hidden="true" />
            </AppLink>
          ))}
        </nav>
        {showViewSwitch && (
          <TabStrip
            label="Show plants or bouquets"
            testid="collection-view-switch"
            className="mb-3 border-b-hairline border-grove-moss"
            value={view}
            onChange={setView}
            items={[
              { value: 'plants', label: 'Plants', count: tabCount(plants.length), testid: 'collection-view-plants' },
              { value: 'bouquets', label: 'Bouquets', count: tabCount(bouquets.length), testid: 'collection-view-bouquets' },
            ]}
          />
        )}
        {roomFilter && (
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="font-ui text-sm font-medium text-grove-cream">
              Room: {roomFilter}
            </span>
            <button
              onClick={() => setSearchParams({})}
              className="font-ui text-xs font-medium text-grove-sprout hover:text-grove-cream"
            >
              Show all
            </button>
          </div>
        )}
        {loadError && !loading ? (<LoadError what="plants" onRetry={retryLoad} />) : loading ? (
          <LoadingList label="Loading your plants" />
        ) : isEmpty && roomFilter ? (
          <div className="rounded-card border-hairline border-grove-moss bg-grove-moss p-5 text-center">
            <p className="text-sm text-grove-cream">No plants in "{roomFilter}"</p>
            <button
              onClick={() => setSearchParams({})}
              className="mt-2 font-ui text-xs font-medium text-grove-sprout hover:text-grove-cream"
            >
              Show all plants
            </button>
          </div>
        ) : showingBouquets ? (
          isEmpty ? (
            <div data-testid="collection-bouquets-empty" className="rounded-card border-hairline border-grove-moss bg-grove-canopy p-5 text-center">
              <p className="font-ui text-sm text-grove-cream">No bouquets right now.</p>
              <AppLink
                to="/bouquets/new"
                className="mt-2 inline-flex min-h-touch items-center font-ui text-xs font-medium text-grove-sprout hover:text-grove-cream"
              >
                Add bouquet
              </AppLink>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:gap-3" data-testid="collection-bouquet-grid">
              {bouquets.map(b => (
                <BouquetTile key={`b-${b.id}`} bouquet={b} />
              ))}
            </div>
          )
        ) : isEmpty ? (
          <EmptyState config={EMPTY_STATES.collection_zero_plants} />
        ) : (
          <div className="grid grid-cols-3 gap-2 sm:gap-3" data-testid="collection-grid">
            {filteredPlants.map(item => (
              <PlantCard
                key={`p-${item.id}`}
                plant={item}
                selected={selected.has(item.id)}
                onSelect={toggleSelect}
                selectionMode={selectionMode}
              />
            ))}
          </div>
        )}
      </div>

      {/* Select-all helper row — appears in selection mode before any selection */}
      {selectionMode && filteredPlants.length > 0 && (
        <div className="max-w-page mx-auto px-4 -mt-2 mb-1 flex items-center justify-between" data-testid="bulk-helper-row">
          <span className="text-xs font-ui text-grove-sage">
            {selectedCount === 0
              ? 'Tap plants to select them.'
              : `${selectedCount} of ${filteredPlants.length} selected`}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={selectAllPlants}
              data-testid="bulk-select-all"
              className="text-xs font-ui text-grove-sprout underline underline-offset-2 hover:text-grove-cream"
            >
              Select all ({filteredPlants.length})
            </button>
            {selectedCount > 0 && (
              <button
                type="button"
                onClick={() => setSelected(new Set())}
                data-testid="bulk-clear-selection"
                className="text-xs font-ui text-grove-sage underline underline-offset-2 hover:text-grove-cream"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}

      {/* Bulk action bar — Phase 14A.2 multi-action (water · mist · fertilize · rotate · prune · check) */}
      {selectionMode && selectedCount > 0 && (
        <div className="fixed bottom-nav left-0 right-0 z-sticky bg-grove-lime border-t-hairline border-grove-moss" data-testid="bulk-action-bar">
          <div className="max-w-page mx-auto px-4 pt-2 pb-3">
            {showSoftWarning && (
              <div
                className="flex items-start gap-2 px-3 py-2 mb-2 bg-grove-sun/15 border-hairline border-grove-moss rounded-tag"
                data-testid="bulk-warning-banner"
              >
                <AlertTriangle className="h-3.5 w-3.5 text-grove-sun flex-shrink-0 mt-0.5" />
                <span className="text-xs font-ui text-grove-cream/80 leading-snug">
                  {selectedCount} plants selected — large sweeps can feel rushed. Double-check you&apos;ve actually cared for each one.
                </span>
              </div>
            )}
            {bulkActionsOpen && (
              <div className="grid grid-cols-6 gap-1.5 mb-2" data-testid="bulk-action-grid">
                {BULK_ACTIONS.map(({ value, label, icon: Icon, color }) => {
                  const isOn = bulkActions.has(value);
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => toggleBulkAction(value)}
                      data-testid={`bulk-action-${value}`}
                      aria-pressed={isOn}
                      className={cn(buttonVariants({ variant: 'chip' }), "flex-col items-center gap-0.5")}
                    aria-pressed={isOn}
                    >
                      <Icon
                        className="h-4 w-4"
                        style={{ color: isOn ? 'var(--grove-sprout)' : color }}
                        strokeWidth={isOn ? 2.2 : 1.75}
                      />
                      <span className={`text-xs font-ui ${isOn ? 'text-grove-cream font-semibold' : 'text-grove-cream/80'}`}>
                        {label}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-grove-cream font-ui text-sm leading-tight">
                  {selectedCount} plant{selectedCount === 1 ? '' : 's'}
                  {bulkActions.size > 0 && (
                    <span className="text-grove-sprout font-ui text-xs ml-2">
                      → {actionSummary}
                    </span>
                  )}
                </p>
                {bulkActions.size === 0 && (
                  <p className="text-grove-sage text-xs font-ui mt-0.5">Pick the actions you did.</p>
                )}
              </div>
              {!bulkActionsOpen ? (
                <button
                  type="button"
                  onClick={() => setBulkActionsOpen(true)}
                  data-testid="bulk-open-actions"
                  className={cn(buttonVariants(), "flex")}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Pick actions
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleBulkLog}
                  disabled={bulkRunning || bulkActions.size === 0}
                  data-testid="bulk-log-confirm"
                  className={cn(buttonVariants(), "disabled:opacity-40 transition-colors duration-150 flex items-center gap-2")}
                >
                  <Check className="h-3.5 w-3.5" />
                  {bulkRunning ? 'Logging…' : (bulkActions.size > 1 ? `Log ${bulkActions.size} actions` : 'Log care')}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Type picker — Phase 14 Part 5.1 */}
      <Dialog open={showTypePicker} onOpenChange={setShowTypePicker}>
        <DialogContent className="bg-grove-canopy border-hairline border-grove-moss rounded-small max-w-sm" data-testid="add-type-picker">
          <DialogHeader>
            <DialogTitle className="font-plant text-grove-cream text-lg">What are you adding?</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 mt-2">
            <button
              type="button"
              onClick={() => { setShowTypePicker(false); navigate('/add-plant'); }}
              data-testid="add-type-plant"
              className="w-full text-left rounded-card border-hairline border-grove-moss bg-grove-canopy p-5 hover:border-grove-fernLine hover:bg-grove-forest flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-chip bg-grove-moss flex items-center justify-center flex-shrink-0">
                <Leaf className="h-5 w-5 text-grove-sprout" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-ui text-grove-cream text-sm font-medium">A plant</p>
                <p className="font-ui text-xs text-grove-sage mt-0.5">Tracks care, growth and health over time.</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => { setShowTypePicker(false); navigate('/bouquets/new'); }}
              data-testid="add-type-bouquet"
              className="w-full text-left rounded-card border-hairline border-grove-moss bg-grove-canopy p-5 hover:border-grove-fernLine hover:bg-grove-forest flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-chip bg-grove-bloom/15 flex items-center justify-center flex-shrink-0">
                <Flower2 className="h-5 w-5 text-grove-blush" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-ui text-grove-cream text-sm font-medium">A bouquet</p>
                <p className="font-ui text-xs text-grove-sage mt-0.5">Vase life, flower ID and care plan.</p>
              </div>
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function daysUntilExpiry(bouquet) {
  if (!bouquet.expected_bloom_end) return null;
  const d = new Date(bouquet.expected_bloom_end).getTime() - Date.now();
  return Math.ceil(d / (1000 * 60 * 60 * 24));
}

function BouquetTile({ bouquet }) {
  const days = daysUntilExpiry(bouquet);
  const vaseLabel = days == null ? '—' : days < 0 ? 'Past vase life' : days === 0 ? 'Ends today' : `${days}d vase life`;
  return (
    <AppLink
      to={`/bouquets/${bouquet.id}`}
      state={{ name: bouquet.name }}
      data-testid="collection-grid-bouquet-tile"
      className="relative block aspect-square rounded-control overflow-hidden border-hairline border-grove-moss bg-grove-bloom/15 hover:border-grove-fernLine focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-grove-lime"
    >
      <PlantImage src={bouquet.photo_url} tone="bouquet" rounded="none" className="absolute inset-0 w-full h-full" />
      <span
        aria-hidden="true"
        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-pill bg-grove-canopy border-hairline border-grove-moss flex items-center justify-center"
        title="Bouquet"
      >
        <Flower2 className="h-3 w-3 text-grove-blush" />
      </span>
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-grove-root/85 to-transparent p-1.5">
        <p className="font-ui text-xs font-medium leading-tight text-grove-cream truncate">{bouquet.name || 'Bouquet'}</p>
        <p className="font-latin text-xs text-grove-sprout">{vaseLabel}</p>
      </div>
    </AppLink>
  );
}
