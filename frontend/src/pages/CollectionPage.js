import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
  { value: 'mist', label: 'Mist', icon: Wind, color: '#5DCAA5' },
  { value: 'fertilize', label: 'Fertilize', icon: Utensils, color: '#639922' },
  { value: 'rotate', label: 'Rotate', icon: RotateCw, color: '#BA7517' },
  { value: 'prune', label: 'Prune', icon: Scissors, color: '#2D5016' },
  { value: 'check', label: 'Check', icon: ClipboardCheck, color: '#185FA5' },
];

const BULK_WARN_THRESHOLD = 20;

export default function CollectionPage() {
  const navigate = useNavigate();
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
    setSelected(new Set(plants.map(p => p.id)));
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

  const totalCount = plants.length + bouquets.length;
  const isEmpty = totalCount === 0;

  // Combined list, plants then bouquets, each tagged with type for rendering
  const combined = [
    ...plants.map(p => ({ ...p, _type: 'plant' })),
    ...bouquets.map(b => ({ ...b, _type: 'bouquet' })),
  ];

  return (
    <div>
      <SectionTutorial tutorialId="collection" />
      <FirstSessionBanner />
      <PageHeader
        title="My collection"
        count={totalCount}
        rightContent={
          <div className="flex items-center gap-2">
            <button
              onClick={() => { if (selectionMode) { exitSelectionMode(); } else { setSelectionMode(true); setSelected(new Set()); setBulkActions(new Set()); } }}
              data-testid="collection-select-button"
              className={`rounded-[2px] font-plant uppercase tracking-[0.08em] text-[10px] px-3 py-2 border-[0.5px] transition-colors duration-150 ${
                selectionMode
                  ? 'border-[#1C2E10] bg-[#1C2E10] text-[#F5F0E8]'
                  : 'border-[#D3C9B8] bg-transparent text-[#1C2E10] hover:border-[#2D5016]'
              }`}
            >
              {selectionMode ? 'Cancel' : 'Select'}
            </button>
            <button
              onClick={() => setShowTypePicker(true)}
              data-testid="collection-add-button"
              className="rounded-full w-9 h-9 bg-[#1C2E10] text-[#F5F0E8] flex items-center justify-center hover:bg-[#2D5016] transition-colors duration-150"
              aria-label="Add to collection"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        }
      />

      <div className="max-w-[1100px] mx-auto px-4 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-[#3B6D11] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : isEmpty ? (
          <EmptyState config={EMPTY_STATES.collection_zero_plants} />
        ) : (
          <div className="grid grid-cols-3 gap-2 sm:gap-3" data-testid="collection-grid">
            {combined.map(item => item._type === 'plant' ? (
              <PlantCard
                key={`p-${item.id}`}
                plant={item}
                selected={selected.has(item.id)}
                onSelect={toggleSelect}
                selectionMode={selectionMode}
              />
            ) : (
              <BouquetTile key={`b-${item.id}`} bouquet={item} onClick={() => navigate(`/bouquets/${item.id}`)} />
            ))}
          </div>
        )}
      </div>

      {/* Select-all helper row — appears in selection mode before any selection */}
      {selectionMode && plants.length > 0 && (
        <div className="max-w-[1100px] mx-auto px-4 -mt-2 mb-1 flex items-center justify-between" data-testid="bulk-helper-row">
          <span className="text-[11px] font-ui text-[#2B2B26] opacity-70">
            {selectedCount === 0
              ? 'Tap plants to select them.'
              : `${selectedCount} of ${plants.length} selected`}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={selectAllPlants}
              data-testid="bulk-select-all"
              className="text-[11px] font-ui text-[#2D5016] underline underline-offset-2 hover:text-[#1C2E10]"
            >
              Select all ({plants.length})
            </button>
            {selectedCount > 0 && (
              <button
                type="button"
                onClick={() => setSelected(new Set())}
                data-testid="bulk-clear-selection"
                className="text-[11px] font-ui text-[#5F5E5A] underline underline-offset-2 hover:text-[#1C2E10]"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}

      {/* Bulk action bar — Phase 14A.2 multi-action (water · mist · fertilize · rotate · prune · check) */}
      {selectionMode && selectedCount > 0 && (
        <div className="fixed bottom-[68px] left-0 right-0 z-40 bg-[#1C2E10] border-t-[0.5px] border-[#D3C9B8]" data-testid="bulk-action-bar">
          <div className="max-w-[1100px] mx-auto px-4 pt-2 pb-3">
            {showSoftWarning && (
              <div
                className="flex items-start gap-2 px-3 py-2 mb-2 bg-[#3A2410] border-[0.5px] border-[#BA7517] rounded-[6px]"
                data-testid="bulk-warning-banner"
              >
                <AlertTriangle className="h-3.5 w-3.5 text-[#E8A857] flex-shrink-0 mt-0.5" />
                <span className="text-[11px] font-ui text-[#F5F0E8]/90 leading-snug">
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
                          ? 'border-[#5DCAA5] bg-[#5DCAA5]/15'
                          : 'border-[#F5F0E8]/30 bg-transparent hover:border-[#F5F0E8]/60'
                      }`}
                    >
                      <Icon
                        className="h-4 w-4"
                        style={{ color: isOn ? '#9FE1CB' : color }}
                        strokeWidth={isOn ? 2.2 : 1.75}
                      />
                      <span className={`text-[9px] font-ui ${isOn ? 'text-[#F5F0E8] font-semibold' : 'text-[#F5F0E8]/70'}`}>
                        {label}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-[#F5F0E8] font-ui text-sm leading-tight">
                  {selectedCount} plant{selectedCount === 1 ? '' : 's'}
                  {bulkActions.size > 0 && (
                    <span className="text-[#9FE1CB] font-ui text-xs ml-2">
                      → {actionSummary}
                    </span>
                  )}
                </p>
                {bulkActions.size === 0 && (
                  <p className="text-[#F5F0E8]/60 text-[11px] font-ui mt-0.5">Pick the actions you did.</p>
                )}
              </div>
              {!bulkActionsOpen ? (
                <button
                  type="button"
                  onClick={() => setBulkActionsOpen(true)}
                  data-testid="bulk-open-actions"
                  className="rounded-[2px] font-plant uppercase tracking-[0.08em] text-xs px-4 py-2.5 bg-[#3B6D11] text-[#F5F0E8] border-[0.5px] border-[#3B6D11] hover:bg-[#639922] transition-colors duration-150 flex items-center gap-2"
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
                  className="rounded-[2px] font-plant uppercase tracking-[0.08em] text-xs px-4 py-2.5 bg-[#3B6D11] text-[#F5F0E8] border-[0.5px] border-[#3B6D11] hover:bg-[#639922] disabled:opacity-40 transition-colors duration-150 flex items-center gap-2"
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
        <DialogContent className="bg-[#FDFAF6] border-[0.5px] border-[#D3C9B8] rounded-[14px] max-w-sm" data-testid="add-type-picker">
          <DialogHeader>
            <DialogTitle className="font-plant text-[#1C2E10] text-lg">What are you adding?</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 mt-2">
            <button
              type="button"
              onClick={() => { setShowTypePicker(false); navigate('/add-plant'); }}
              data-testid="add-type-plant"
              className="w-full text-left rounded-[14px] border-[0.5px] border-[#D3C9B8] bg-[#FDFAF6] p-3.5 hover:border-[#3B6D11] hover:bg-[#F5F0E8] flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-[10px] bg-[#EAF3DE] flex items-center justify-center flex-shrink-0">
                <Leaf className="h-5 w-5 text-[#3B6D11]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-plant text-[#1C2E10] text-sm">A plant</p>
                <p className="font-ui text-xs text-[#5F5E5A] mt-0.5">Tracks care, growth and health over time.</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => { setShowTypePicker(false); navigate('/bouquets/new'); }}
              data-testid="add-type-bouquet"
              className="w-full text-left rounded-[14px] border-[0.5px] border-[#D3C9B8] bg-[#FDFAF6] p-3.5 hover:border-[#3B6D11] hover:bg-[#F5F0E8] flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-[10px] bg-[#FDF5F8] flex items-center justify-center flex-shrink-0">
                <Flower2 className="h-5 w-5 text-[#D4537E]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-plant text-[#1C2E10] text-sm">A bouquet</p>
                <p className="font-ui text-xs text-[#5F5E5A] mt-0.5">Vase life, flower ID and care plan.</p>
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
      className="relative aspect-square rounded-[12px] overflow-hidden border-[0.5px] border-[#D3C9B8] bg-[#FDF5F8] hover:border-[#3B6D11] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B6D11]"
    >
      <PlantImage src={bouquet.photo_url} tone="bouquet" rounded="none" className="absolute inset-0 w-full h-full" />
      <span
        aria-hidden="true"
        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-[#FDFAF6] border-[0.5px] border-[#D3C9B8] flex items-center justify-center"
        title="Bouquet"
      >
        <Flower2 className="h-3 w-3 text-[#D4537E]" />
      </span>
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[rgba(28,46,16,0.85)] to-transparent p-1.5">
        <p className="font-plant text-[11px] leading-tight text-[#F5F0E8] truncate">{bouquet.name || 'Bouquet'}</p>
        <p className="font-latin text-[9px] text-[#9FE1CB]">{vaseLabel}</p>
      </div>
    </button>
  );
}
