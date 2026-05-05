import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { wantsAPI } from '../lib/api';
import { PageHeader } from '../components/PageHeader';
import { EmptyState } from '../components/EmptyState';
import { Bookmark, ChevronRight, Trash2, Sun, Droplets, Leaf } from 'lucide-react';
import { toast } from 'sonner';

const LIGHT_LABEL = {
  low: 'Low', medium: 'Medium', bright_indirect: 'Bright indirect', bright_direct: 'Bright direct',
};

export default function WantListPage() {
  const navigate = useNavigate();
  const [wants, setWants] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchWants = async () => {
    try {
      const res = await wantsAPI.list();
      setWants(res.data.wants || []);
    } catch (_e) {
      toast.error('Failed to load want list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchWants(); }, []);

  const handleRemove = async (e, speciesId, name) => {
    e.stopPropagation();
    if (!window.confirm(`Remove ${name} from your want list?`)) return;
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
      <PageHeader title="Want list" subtitle="Plants you'd like to add next" />

      <div className="max-w-[1100px] mx-auto px-4 pt-4">
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <div className="w-5 h-5 border-2 border-[#3B6D11] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : wants.length === 0 ? (
          <EmptyState
            data-testid="want-list-empty"
            icon={Bookmark}
            title="Nothing on your want list yet"
            body="Browse the Greenhouse and tap the bookmark on any species to save it for later."
            action={{ label: 'Browse Greenhouse', onClick: () => navigate('/greenhouse') }}
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
                    className="w-full text-left rounded-[12px] border-[0.5px] border-[#D3C9B8] bg-[#EDE5D8] p-3 hover:border-[#3B6D11] transition-colors duration-150"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-plant text-sm text-[#1C2E10]">{s.common_name}</p>
                        <p className="font-latin italic text-[11px] text-[#3B3A33] mt-0.5">{s.latin_name}</p>
                        <div className="flex flex-wrap gap-2 mt-1.5 text-[10px] font-ui text-[#5F5E5A]">
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
                            <span className="inline-flex items-center gap-1 text-[#3B6D11]">
                              <Leaf className="h-2.5 w-2.5" /> Native
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          type="button"
                          onClick={(e) => handleRemove(e, s.id, s.common_name)}
                          aria-label="Remove from want list"
                          data-testid={`want-list-remove-${s.slug}`}
                          className="w-7 h-7 rounded-full border-[0.5px] border-[#D3C9B8] bg-transparent text-[#5F5E5A] hover:text-[#E24B4A] hover:border-[#E24B4A] flex items-center justify-center transition-colors duration-150"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                        <ChevronRight className="h-4 w-4 text-[#5F5E5A]" />
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
