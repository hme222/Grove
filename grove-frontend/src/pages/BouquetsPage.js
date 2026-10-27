import LoadError from '../components/LoadError';
import Loading from '../components/Loading';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { bouquetAPI } from '../lib/api';
import { getFileUrl } from '../lib/api';
import { PageHeader, HeaderAction } from '../components/PageHeader';
import { EmptyState } from '../components/EmptyState';
import { EMPTY_STATES } from '@/constants/emptyStates';
import { Plus, Flower2, Calendar, Lock } from 'lucide-react';
import { toast } from 'sonner';
import PhotoBand from '../components/PhotoBand';

export default function BouquetsPage() {
  const navigate = useNavigate();
  const [bouquets, setBouquets] = useState([]);
  const [limits, setLimits] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoadError(false);
        const [listRes, limitRes] = await Promise.all([
          bouquetAPI.getAll(),
          bouquetAPI.getLimits().catch(() => ({ data: null })),
        ]);
        setBouquets(listRes.data);
        setLimits(limitRes.data);
      } catch (e) {
        setLoadError(true);
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
        back
      />

      <div className="max-w-page mx-auto px-4 py-4">
        {!loadError && (
          <div className="mb-3 flex items-center justify-end gap-2" data-testid="bouquets-toolbar">
            <HeaderAction
              icon={atLimit ? Lock : Plus}
              onClick={handleAddClick}
              data-testid="add-bouquet-button"
              disabled={atLimit}
            >
              {atLimit ? 'Limit reached' : 'Add bouquet'}
            </HeaderAction>
          </div>
        )}
        {/* Free-tier limit banner / counter */}
        {isFree && limits && (
          <div
            data-testid="bouquet-limit-banner"
            className="mb-4 flex items-center justify-between gap-3 rounded-small border-hairline border-grove-moss bg-grove-canopy px-4 py-3"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-pill flex items-center justify-center bg-grove-forest">
                <Flower2 className={`h-4 w-4 ${atLimit ? 'text-grove-bloom' : 'text-grove-sprout'}`} />
              </div>
              <div>
                <p className="font-ui text-grove-cream text-sm font-medium">
                  {limits.active_count}/{limits.max_active} active bouquets
                </p>
                <p className="font-ui text-xs text-grove-cream leading-snug">
                  {atLimit
                    ? 'The free tier is full. Archive one to add another, or upgrade for unlimited bouquets.'
                    : 'Bouquet tracking is free. Keep up to 2 active at a time.'}
                </p>
              </div>
            </div>
            <span
              data-testid="bouquet-limit-counter"
              className="inline-flex items-center rounded-pill border-hairline border-grove-moss bg-grove-canopy px-2.5 py-1 font-ui text-xs text-grove-cream min-h-6"
            >
              {atLimit ? 'Full' : 'Free'}
            </span>
          </div>
        )}

        {loadError && !loading ? (<LoadError what="bouquets" onRetry={() => window.location.reload()} />) : loading ? (
          <Loading label="Loading your bouquets" />
        ) : bouquets.length === 0 ? (
          <EmptyState config={EMPTY_STATES.bouquet_none} />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {bouquets.map(b => (
              <button
                key={b.id}
                onClick={() => navigate(`/bouquets/${b.id}`, { state: { name: b.name } })}
                data-testid="bouquet-card"
                className="rounded-card border-hairline border-grove-moss bg-grove-canopy overflow-hidden text-left hover:border-grove-fernLine transition-colors duration-150"
              >
                <div className="aspect-square bg-grove-forest flex items-center justify-center">
                  {b.photo_url ? (
                    <PhotoBand src={getFileUrl(b.photo_url)} alt={b.name} aspect="square" className="rounded-none" />
                  ) : (
                    <Flower2 className="h-10 w-10 text-grove-bloom opacity-60" aria-hidden="true" />
                  )}
                </div>
                <div className="px-3 py-2.5">
                  <p className="font-ui text-grove-cream text-sm font-medium truncate">{b.name || 'Bouquet'}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Calendar className="h-3 w-3 text-grove-sage" aria-hidden="true" />
                    <span className="font-ui text-xs text-grove-sage">{formatDate(b.received_date)}</span>
                    {Number(b.vase_life_expected) > 0 && (
                      <span className="inline-flex items-center rounded-pill border-hairline border-grove-moss bg-grove-canopy px-2.5 py-1 text-xs font-ui text-grove-cream min-h-6">
                        About {b.vase_life_expected} days
                      </span>
                    )}
                  </div>
                  {b.occasion && (
                    <span className="inline-flex items-center rounded-pill border-hairline border-grove-moss bg-grove-canopy px-2.5 py-1 text-xs font-ui text-grove-cream mt-1.5 capitalize min-h-6">
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
