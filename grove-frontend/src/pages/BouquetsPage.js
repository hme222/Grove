import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { bouquetAPI } from '../lib/api';
import { getFileUrl } from '../lib/api';
import { PageHeader } from '../components/PageHeader';
import { EmptyState } from '../components/EmptyState';
import { EMPTY_STATES } from '@/constants/emptyStates';
import { Plus, Flower2, Calendar, Lock } from 'lucide-react';
import { toast } from 'sonner';

export default function BouquetsPage() {
  const navigate = useNavigate();
  const [bouquets, setBouquets] = useState([]);
  const [limits, setLimits] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [listRes, limitRes] = await Promise.all([
          bouquetAPI.getAll(),
          bouquetAPI.getLimits().catch(() => ({ data: null })),
        ]);
        setBouquets(listRes.data);
        setLimits(limitRes.data);
      } catch (e) {
        toast.error('Failed to load bouquets');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const formatDate = (d) => {
    if (!d) return '';
    try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }
    catch { return d; }
  };

  const handleAddClick = () => {
    if (limits && !limits.can_create) {
      toast.info(`Free tier allows ${limits.max_active} active bouquets. Archive one to add another.`);
      return;
    }
    navigate('/bouquets/new');
  };

  const isFree = limits?.tier === 'free';
  const atLimit = limits && !limits.can_create;

  return (
    <div>
      <PageHeader
        title="Bouquets"
        count={bouquets.length}
        rightContent={
          <button
            onClick={handleAddClick}
            data-testid="add-bouquet-button"
            aria-label={atLimit ? 'Bouquet limit reached' : 'Add bouquet'}
            disabled={atLimit}
            className={`rounded-full w-9 h-9 flex items-center justify-center transition-colors duration-150 ${
              atLimit
                ? 'bg-grove-moss text-grove-root cursor-not-allowed'
                : 'bg-grove-bloom text-grove-root hover:bg-grove-sprout'
            }`}
          >
            {atLimit ? <Lock className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          </button>
        }
      />

      <div className="max-w-[1100px] mx-auto px-4 py-4">
        {/* Free-tier limit banner / counter */}
        {isFree && limits && (
          <div
            data-testid="bouquet-limit-banner"
            className={`mb-4 rounded-[14px] border-[0.5px] px-4 py-3 flex items-center justify-between ${
              atLimit
                ? 'border-grove-bloom/40 bg-grove-bloom/15'
                : 'border-grove-moss bg-grove-moss'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${atLimit ? 'bg-grove-bloom/15' : 'bg-grove-forest'}`}>
                <Flower2 className={`h-4 w-4 ${atLimit ? 'text-grove-bloom' : 'text-grove-sprout'}`} />
              </div>
              <div>
                <p className="font-plant text-grove-cream text-sm">
                  {limits.active_count}/{limits.max_active} active bouquets
                </p>
                <p className="font-ui text-[11px] text-grove-cream leading-snug">
                  {atLimit
                    ? 'Free tier is full. Archive one to add another, or upgrade for unlimited arrangements.'
                    : 'Bouquet tracking is free — keep up to 2 active at a time.'}
                </p>
              </div>
            </div>
            <span
              data-testid="bouquet-limit-counter"
              className={`font-plant text-xs px-2 py-1 rounded-[4px] border-[0.5px] ${
                atLimit
                  ? 'border-grove-bloom/40 text-grove-bloom bg-grove-canopy'
                  : 'border-grove-moss text-grove-sprout bg-grove-forest'
              }`}
            >
              {atLimit ? 'Full' : 'Free'}
            </span>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-grove-bloom border-t-transparent rounded-full animate-spin" />
          </div>
        ) : bouquets.length === 0 ? (
          <EmptyState config={EMPTY_STATES.bouquet_none} />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {bouquets.map(b => (
              <button
                key={b.id}
                onClick={() => navigate(`/bouquets/${b.id}`)}
                data-testid="bouquet-card"
                className="rounded-[14px] border-[0.5px] border-grove-bloom/30 bg-grove-bloom/15 overflow-hidden text-left hover:border-grove-bloom transition-colors duration-150"
              >
                <div className="aspect-square bg-grove-bloom/15 flex items-center justify-center">
                  {b.photo_url ? (
                    <div className="w-full h-full bg-grove-bloom/15 flex items-center justify-center"><img src={getFileUrl(b.photo_url)} alt={b.name} className="w-full h-full object-cover" /></div>
                  ) : (
                    <Flower2 className="h-10 w-10 text-grove-bloom opacity-30" />
                  )}
                </div>
                <div className="px-3 py-2.5">
                  <p className="font-plant text-grove-cream text-sm truncate">{b.name || 'Bouquet'}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Calendar className="h-3 w-3 text-grove-bloom" />
                    <span className="font-latin text-[10px] text-grove-bloom">{formatDate(b.received_date)}</span>
                    {b.vase_life_expected && (
                      <span className="inline-flex items-center rounded-[20px] border-[0.5px] border-grove-bloom/30 bg-grove-canopy px-1.5 py-0.5 text-[9px] font-ui text-grove-bloom">
                        {b.vase_life_expected}d life
                      </span>
                    )}
                  </div>
                  {b.occasion && (
                    <span className="inline-flex items-center rounded-[20px] border-[0.5px] border-grove-bloom/20 bg-grove-canopy px-2 py-0.5 text-[9px] font-ui text-grove-bloom mt-1.5 capitalize">
                      {b.occasion}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
