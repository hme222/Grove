import LoadError from '../components/LoadError';
import Loading from '../components/Loading';
import { buttonVariants } from '../components/ui/button';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { wantsAPI } from '../lib/api';
import { PageHeader } from '../components/PageHeader';
import { EmptyState } from '../components/EmptyState';
import ConfirmDialog from '../components/ConfirmDialog';
import { Bookmark, ChevronRight, Trash2, Sun, Droplets, Leaf } from 'lucide-react';
import { toast } from 'sonner';

const LIGHT_LABEL = {
  low: 'Low', medium: 'Medium', bright_indirect: 'Bright indirect', bright_direct: 'Bright direct',
};

export default function WantListPage() {
  const navigate = useNavigate();
  const [wants, setWants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [pending, setPending] = useState(null); // { speciesId, name } awaiting remove confirmation

  const fetchWants = async () => {
    try {
      setLoadError(false);
      const res = await wantsAPI.list();
      setWants(res.data.wants || []);
    } catch (_e) {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchWants(); }, []);

  const handleRemove = (e, speciesId, name) => {
    e.stopPropagation();
    setPending({ speciesId, name });
  };

  const performRemove = async ({ speciesId }) => {
    try {
      await wantsAPI.remove(speciesId);
      toast.success('Removed');
      await fetchWants();
    } catch {
      toast.error('Failed to remove');
    }
  };

  return (
    <div className="pb-24" data-testid="want-list-page">
      <PageHeader title="Want list" back />

      <div className="max-w-page mx-auto px-4 pt-4">
        {loadError && !loading ? (<LoadError what="want list" onRetry={fetchWants} />) : loading ? (
          <Loading label="Loading your want list" className="py-10" />
        ) : wants.length === 0 ? (
          <EmptyState
            data-testid="want-list-empty"
            icon={Bookmark}
            title="Nothing on your want list yet"
            body="Browse the plant guide and tap the bookmark on any species to save it for later."
            action={{ label: 'Browse the plant guide', onClick: () => navigate('/greenhouse') }}
          />
        ) : (
          <ul className="space-y-2" data-testid="want-list-items">
            {wants.map((w) => {
              const s = w.species;
              return (
                <li key={w.id}>
                  <button
                    type="button"
                    onClick={() => navigate(`/greenhouse/${s.id}`)}
                    data-testid={`want-list-item-${s.slug}`}
                    className="w-full text-left rounded-card border-hairline border-grove-moss bg-grove-canopy p-5 hover:border-grove-fernLine transition-colors duration-150"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-ui text-sm font-medium text-grove-cream">{s.common_name}</p>
                        <p className="font-latin italic text-xs text-grove-cream mt-0.5">{s.latin_name}</p>
                        <div className="flex flex-wrap gap-2 mt-1.5 text-xs font-ui text-grove-sage">
                          {s.default_light_level && (
                            <span className="inline-flex items-center gap-1">
                              <Sun className="h-2.5 w-2.5" /> {LIGHT_LABEL[s.default_light_level] || s.default_light_level}
                            </span>
                          )}
                          {s.default_watering_days && (
                            <span className="inline-flex items-center gap-1">
                              <Droplets className="h-2.5 w-2.5" /> Every {s.default_watering_days} days
                            </span>
                          )}
                          {s.flags?.native_to_na && (
                            <span className="inline-flex items-center gap-1 text-grove-sprout">
                              <Leaf className="h-2.5 w-2.5" /> Native
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          type="button"
                          onClick={(e) => handleRemove(e, s.id, s.common_name)}
                          aria-label={`Remove ${s.common_name || s.slug} from want list`}
                          data-testid={`want-list-remove-${s.slug}`}
                          className={buttonVariants({ variant: 'outline', size: 'icon' })}
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </button>
                        <ChevronRight className="h-4 w-4 text-grove-sage" />
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <ConfirmDialog
        open={pending != null}
        onOpenChange={(o) => { if (!o) setPending(null); }}
        title={`Remove ${pending?.name ?? 'this plant'} from your want list?`}
        description="It leaves your want list, and you can add it back any time from the guide."
        confirmLabel="Remove plant"
        testId="want-remove-confirm"
        onConfirm={() => { const t = pending; setPending(null); performRemove(t); }}
      />
    </div>
  );
}
