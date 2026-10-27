import LoadError from '../components/LoadError';
import Loading from '../components/Loading';
import React, { useState, useEffect } from 'react';
import { wishlistAPI } from '../lib/api';
import { PageHeader } from '../components/PageHeader';
import { X, Leaf } from 'lucide-react';
import { toast } from 'sonner';
import { EmptyState } from '../components/EmptyState';
import { EMPTY_STATES } from '../constants/emptyStates';

export default function WishlistPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const fetchItems = async () => {
    try {
      setLoadError(false);
      const res = await wishlistAPI.getAll();
      setItems(res.data);
    } catch (e) {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  const handleRemove = async (id) => {
    try {
      await wishlistAPI.remove(id);
      setItems((prev) => prev.filter(i => i.id !== id));
      toast.success('Removed from saved cuttings');
    } catch (e) {
      toast.error('Remove failed');
    }
  };

  return (
    <div>
      <PageHeader title="Saved cuttings" back />

      <div className="max-w-sheet mx-auto px-4 py-4">
        {loadError && !loading ? (<LoadError what="saved cuttings" onRetry={fetchItems} />) : loading ? (
          <Loading label="Loading saved cuttings" />
        ) : items.length === 0 ? (
          <div className="py-8" data-testid="wishlist-empty">
            <EmptyState config={EMPTY_STATES.wishlist_none} />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2" data-testid="wishlist-grid">
            {items.map(item => (
              <div
                key={item.id}
                data-testid="wishlist-item"
                className="flex items-center gap-3 rounded-card border-hairline border-grove-moss bg-grove-canopy px-3 py-3"
              >
                <div className="w-10 h-10 rounded-pill bg-grove-forest border-hairline border-grove-moss flex items-center justify-center flex-shrink-0">
                  <Leaf className="h-5 w-5 text-grove-blush" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-ui text-grove-cream text-sm font-medium truncate">{item.common_name || 'Unknown plant'}</p>
                  {item.latin_name && (
                    <p className="font-latin text-xs text-grove-cream italic truncate">{item.latin_name}</p>
                  )}
                </div>
                <button
                  onClick={() => handleRemove(item.id)}
                  aria-label="Remove from saved cuttings"
                  data-testid="wishlist-remove"
                  className="w-touch h-touch rounded-pill border-hairline border-grove-moss text-grove-cream hover:border-grove-fernLine flex items-center justify-center"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
