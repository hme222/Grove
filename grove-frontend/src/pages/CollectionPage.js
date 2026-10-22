import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { plantAPI, careAPI, bouquetAPI } from '../lib/api';
import PlantCard from '../components/PlantCard';
import PlantImage from '../components/PlantImage';
import { PageHeader } from '../components/PageHeader';
import { EmptyState } from '../components/EmptyState';
import { EMPTY_STATES } from '@/constants/emptyStates';
import FirstSessionBanner from '../components/FirstSessionBanner';
import SectionTutorial from '../components/SectionTutorial';
import { Plus, Check, Leaf, Flower2, Droplets, Wind, Utensils, RotateCw, Scissors, ClipboardCheck, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

// Phase 14A.2 — bulk multi-action set. Matches the single-plant CareLogModal.
const BULK_ACTIONS = [
  { value: 'water', label: 'Water', icon: Droplets, color: '#3B6D11' },
  { value: 'mist', label: 'Mist', icon: Wind, color: '#92B44B' },
  { value: 'fertilize', label: 'Fertilize', icon: Utensils, color: '#639922' },
  { value: 'rotate', label: 'Rotate', icon: RotateCw, color: '#BA7517' },
  { value: 'prune', label: 'Prune', icon: Scissors, color: '#2D5016' },
  { value: 'check', label: 'Check', icon: ClipboardCheck, color: '#185FA5' },
];

const BULK_WARN_THRESHOLD = 20;

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
    } catch (e) {
      toast.error('Failed to load collection');
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
      const res = await careAPI.bulkLog({
        plant_ids: Array.from(selected),
        actions,
        notes: 'Bulk care',
      });
      const logged = res.data?.logged ?? 0;
      const affected = res.data?.plants_affected ?? selected.size;
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
  const showViewSwitch = !roomFilter && (bouquets.length > 0 || showingBouquets);

  const setView = (next) => {
    if (next === view) return;
    if (selectionMode) exitSelectionMode();
    setSearchParams(next === 'bouquets' ? { view: 'bouquets' } : {});
  };

  return (
    <div>
      <SectionTutorial tutorialId="collection" />
      <FirstSessionBanner />
      <PageHeader
        title="My collection"
        count={totalCount}
        rightContent={
          <div className="flex items-center gap-2">
            {!showingBouquets && (
            <button
              onClick={() => { if (selectionMode) { exitSelectionMode(); } else { setSelectionMode(true); setSelected(new Set()); setBulkActions(new Set()); } }}
              data-testid="collection-select-button"
              className={`rounded-[2px] font-plant uppercase tracking-[0.08em] text-[10px] px-3 py-2 border-[0.5px] transition-colors duration-150 ${
                selectionMode
                  ? 'border-grove-fernLine bg-grove-lime text-grove-root'
                  : 'border-grove-moss bg-transparent text-grove-cream hover:border-grove-fernLine'
              }`}
            >
              {selectionMode ? 'Cancel' : 'Select'}
            </button>
            )}
            <button
              onClick={() => setShowTypePicker(true)}
              data-testid="collection-add-button"
              className="rounded-full w-9 h-9 bg-grove-lime text-grove-root flex items-center justify-center hover:bg-grove-sprout transition-colors duration-150"
              aria-label="Add to collection"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        }
      />

      <div className="max-w-[1100px] mx-auto px-4 py-4">
        {showViewSwitch && (
          <div
            role="group"
            aria-label="Show plants or bouquets"
            data-testid="collection-view-switch"
            className="inline-flex mb-3 rounded-[10px] border-[0.5px] border-grove-moss bg-grove-moss p-0.5"
          >
            {[
              { value: 'plants', label: 'Plants', count: plants.length, Icon: Leaf },
              { value: 'bouquets', label: 'Bouquets', count: bouquets.length, Icon: Flower2 },
            ].map(({ value, label, count, Icon }) => {
              const active = view === value;
              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setView(value)}
                  data-testid={`collection-view-${value}`}
                  className={`inline-flex items-center gap-1.5 rounded-[8px] px-3 py-1.5 font-ui text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-grove-lime focus-visible:ring-offset-1 motion-safe:transition-colors motion-safe:duration-150 ${
                    active ? 'bg-grove-lime text-grove-root' : 'text-grove-cream hover:bg-grove-forest'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                  {label}
                  <span className={active ? 'text-grove-sprout' : 'text-grove-sage'}>{count}</span>
                </button>
              );
            })}
          </div>
        )}
        {roomFilter && (
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="font-plant text-sm text-grove-cream">
              Room: {roomFilter}
            </span>
            <button
              onClick={() => setSearchParams({})}
              className="font-plant uppercase tracking-[0.08em] text-[10px] text-grove-sprout hover:text-grove-cream"
            >
              Show all
            </button>
          </div>
        )}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-grove-fernLine border-t-transparent rounded-full animate-spin" />
          </div>
        ) : isEmpty && roomFilter ? (
          <div className="rounded-[14px] border-[0.5px] border-grove-moss bg-grove-moss p-6 text-center">
            <p className="text-sm text-grove-cream">No plants in "{roomFilter}"</p>
            <button
              onClick={() => setSearchParams({})}
              className="mt-2 font-plant uppercase tracking-[0.08em] text-[10px] text-grove-sprout hover:text-grove-cream"
            >
              Show all plants
            </button>
          </div>
        ) : showingBouquets ? (
          isEmpty ? (
            <div data-testid="collection-bouquets-empty" className="rounded-[14px] border-[0.5px] border-grove-moss bg-grove-canopy p-6 text-center">
              <p className="font-ui text-sm text-grove-cream">No bouquets right now.</p>
              <button
                type="button"
                onClick={() => navigate('/bouquets/new')}
                className="mt-2 font-plant uppercase tracking-[0.08em] text-[10px] text-grove-sprout hover:text-grove-cream"
              >
                Add a bouquet
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:gap-3" data-testid="collection-bouquet-grid">
              {bouquets.map(b => (
                <BouquetTile key={`b-${b.id}`} bouquet={b} onClick={() => navigate(`/bouquets/${b.id}`)} />
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
        <div className="max-w-[1100px] mx-auto px-4 -mt-2 mb-1 flex items-center justify-between" data-testid="bulk-helper-row">
          <span className="text-[11px] font-ui text-grove-cream opacity-70">
            {selectedCount === 0
              ? 'Tap plants to select them.'
              : `${selectedCount} of ${filteredPlants.length} selected`}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={selectAllPlants}
              data-testid="bulk-select-all"
              className="text-[11px] font-ui text-grove-sprout underline underline-offset-2 hover:text-grove-cream"
            >
              Select all ({filteredPlants.length})
            </button>
            {selectedCount > 0 && (
              <button
                type="button"
                onClick={() => setSelected(new Set())}
                data-testid="bulk-clear-selection"
                className="text-[11px] font-ui text-grove-sage underline underline-offset-2 hover:text-grove-cream"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}

      {/* Bulk action bar — Phase 14A.2 multi-action (water · mist · fertilize · rotate · prune · check) */}
      {selectionMode && selectedCount > 0 && (
        <div className="fixed bottom-[68px] left-0 right-0 z-40 bg-grove-lime border-t-[0.5px] border-grove-moss" data-testid="bulk-action-bar">
          <div className="max-w-[1100px] mx-auto px-4 pt-2 pb-3">
            {showSoftWarning && (
              <div
                className="flex items-start gap-2 px-3 py-2 mb-2 bg-[#3A2410] border-[0.5px] border-grove-moss rounded-[6px]"
                data-testid="bulk-warning-banner"
              >
                <AlertTriangle className="h-3.5 w-3.5 text-grove-sun flex-shrink-0 mt-0.5" />
                <span className="text-[11px] font-ui text-grove-cream/90 leading-snug">
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
                      className={`flex flex-col items-center gap-0.5 py-2 px-1 rounded-[6px] border-[0.5px] transition-colors duration-150 ${
                        isOn
                          ? 'border-grove-lime bg-grove-lime/15'
                          : 'border-grove-forest/30 bg-transparent hover:border-grove-forest/60'
                      }`}
                    >
                      <Icon
                        className="h-4 w-4"
                        style={{ color: isOn ? '#C3D98A' : color }}
                        strokeWidth={isOn ? 2.2 : 1.75}
                      />
                      <span className={`text-[9px] font-ui ${isOn ? 'text-grove-cream font-semibold' : 'text-grove-cream/70'}`}>
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
                  <p className="text-grove-cream/60 text-[11px] font-ui mt-0.5">Pick the actions you did.</p>
                )}
              </div>
              {!bulkActionsOpen ? (
                <button
                  type="button"
                  onClick={() => setBulkActionsOpen(true)}
                  data-testid="bulk-open-actions"
                  className="rounded-[2px] font-plant uppercase tracking-[0.08em] text-xs px-4 py-2.5 bg-grove-lime text-grove-root border-[0.5px] border-grove-fernLine hover:bg-grove-sprout transition-colors duration-150 flex items-center gap-2"
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
                  className="rounded-[2px] font-plant uppercase tracking-[0.08em] text-xs px-4 py-2.5 bg-grove-lime text-grove-root border-[0.5px] border-grove-fernLine hover:bg-grove-sprout disabled:opacity-40 transition-colors duration-150 flex items-center gap-2"
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
        <DialogContent className="bg-grove-canopy border-[0.5px] border-grove-moss rounded-[14px] max-w-sm" data-testid="add-type-picker">
          <DialogHeader>
            <DialogTitle className="font-plant text-grove-cream text-lg">What are you adding?</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 mt-2">
            <button
              type="button"
              onClick={() => { setShowTypePicker(false); navigate('/add-plant'); }}
              data-testid="add-type-plant"
              className="w-full text-left rounded-[14px] border-[0.5px] border-grove-moss bg-grove-canopy p-3.5 hover:border-grove-fernLine hover:bg-grove-forest flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-[10px] bg-grove-moss flex items-center justify-center flex-shrink-0">
                <Leaf className="h-5 w-5 text-grove-sprout" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-plant text-grove-cream text-sm">A plant</p>
                <p className="font-ui text-xs text-grove-sage mt-0.5">Tracks care, growth and health over time.</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => { setShowTypePicker(false); navigate('/bouquets/new'); }}
              data-testid="add-type-bouquet"
              className="w-full text-left rounded-[14px] border-[0.5px] border-grove-moss bg-grove-canopy p-3.5 hover:border-grove-fernLine hover:bg-grove-forest flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-[10px] bg-grove-bloom/15 flex items-center justify-center flex-shrink-0">
                <Flower2 className="h-5 w-5 text-grove-bloom" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-plant text-grove-cream text-sm">A bouquet</p>
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

function BouquetTile({ bouquet, onClick }) {
  const days = daysUntilExpiry(bouquet);
  const vaseLabel = days == null ? '—' : days < 0 ? 'Past vase life' : days === 0 ? 'Ends today' : `${days}d vase life`;
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid="collection-grid-bouquet-tile"
      className="relative aspect-square rounded-[12px] overflow-hidden border-[0.5px] border-grove-moss bg-grove-bloom/15 hover:border-grove-fernLine focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-grove-lime"
    >
      <PlantImage src={bouquet.photo_url} tone="bouquet" rounded="none" className="absolute inset-0 w-full h-full" />
      <span
        aria-hidden="true"
        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-grove-canopy border-[0.5px] border-grove-moss flex items-center justify-center"
        title="Bouquet"
      >
        <Flower2 className="h-3 w-3 text-grove-bloom" />
      </span>
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[rgba(28,46,16,0.85)] to-transparent p-1.5">
        <p className="font-plant text-[11px] leading-tight text-grove-cream truncate">{bouquet.name || 'Bouquet'}</p>
        <p className="font-latin text-[9px] text-grove-sprout">{vaseLabel}</p>
      </div>
    </button>
  );
}
