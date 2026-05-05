import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { encyclopediaAPI, guildAPI } from '../lib/api';
import { PageHeader } from '../components/PageHeader';
import { Input } from '@/components/ui/input';
import SectionTutorial from '../components/SectionTutorial';
import { Search, Leaf, Layers } from 'lucide-react';
import { toast } from 'sonner';

export default function EncyclopediaPage() {
  const navigate = useNavigate();
  const [species, setSpecies] = useState([]);
  const [guilds, setGuilds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchSpecies = async (query = '', pageNum = 1) => {
    const isSearch = query.length >= 2;
    if (isSearch) setSearching(true);
    else setLoading(true);

    try {
      const res = await encyclopediaAPI.getSpecies({ q: query, page: pageNum, limit: 20 });
      setSpecies(res.data.species);
      setTotal(res.data.total);
      setPage(pageNum);
    } catch (e) {
      toast.error('Failed to load species');
    } finally {
      setLoading(false);
      setSearching(false);
    }
  };

  // Phase 14B.2 — load guilds once for the curated row above the species list.
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await guildAPI.list();
        if (alive) setGuilds(res.data.guilds || []);
      } catch { /* non-blocking */ }
    })();
    return () => { alive = false; };
  }, []);

  useEffect(() => { fetchSpecies(); }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.length >= 2 || searchQuery.length === 0) {
        fetchSpecies(searchQuery, 1);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const TOXICITY_COLORS = {
    'non-toxic': 'text-[#3B6D11]',
    'mild': 'text-[#8A6A3D]',
    'toxic': 'text-[#B42318]',
  };

  return (
    <div>
      <SectionTutorial tutorialId="greenhouse" />
      <PageHeader title="Greenhouse" count={total} />

      <div className="max-w-[1100px] mx-auto px-4 py-4 space-y-4">
        {/* Guilds row — Phase 14B.2 */}
        {guilds.length > 0 && !searchQuery && (
          <div className="space-y-2" data-testid="greenhouse-guilds-row">
            <div className="flex items-center justify-between px-1">
              <h2 className="font-plant text-[#1C2E10] text-sm uppercase tracking-[0.08em]">
                Themed guilds
              </h2>
              <span className="font-ui text-[10px] text-[#5F5E5A]">{guilds.length} curated</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {guilds.map((g) => {
                const accent = g.accent_color || '#3B6D11';
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => navigate(`/guilds/${g.slug}`)}
                    data-testid={`guild-card-${g.slug}`}
                    className="text-left rounded-[12px] border-[0.5px] p-3 hover:scale-[1.02] transition-transform duration-150"
                    style={{
                      backgroundColor: `${accent}10`,
                      borderColor: `${accent}40`,
                    }}
                  >
                    <div
                      className="w-7 h-7 rounded-[8px] flex items-center justify-center mb-2"
                      style={{ backgroundColor: `${accent}25` }}
                    >
                      <Layers className="h-3.5 w-3.5" style={{ color: accent }} />
                    </div>
                    <p className="font-plant text-xs text-[#1C2E10] leading-tight">
                      {g.name}
                    </p>
                    <p className="font-latin text-[10px] text-[#5F5E5A] mt-1">
                      {g.species_count} species
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#3B3A33]" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search species by common or latin name..."
            className="pl-10 bg-[#F5F0E8] border-[0.5px] border-[#D3C9B8]"
            data-testid="greenhouse-search"
          />
        </div>

        {/* Species Grid */}
        {loading || searching ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-[#3B6D11] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : species.length === 0 ? (
          <div className="rounded-[14px] border-[0.5px] border-[#D3C9B8] bg-[#EAF3DE] p-6 text-center">
            <p className="text-sm text-[#2B2B26]">
              {searchQuery ? `No species found for "${searchQuery}"` : 'No species in Greenhouse yet'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {species.map((s) => (
              <div
                key={s.id}
                onClick={() => navigate(`/greenhouse/${s.id}`)}
                className="rounded-[14px] border-[0.5px] border-[#D3C9B8] bg-[#EDE5D8] p-4 cursor-pointer hover:border-[#3B6D11] transition-all duration-150"
                data-testid="species-card"
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#EAF3DE] flex items-center justify-center flex-shrink-0">
                    <Leaf className="h-6 w-6 text-[#3B6D11]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-plant text-[#1C2E10] text-base truncate">{s.common_name}</h3>
                    <p className="text-xs italic text-[#3B3A33] truncate">{s.latin_name}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs font-sans uppercase tracking-[0.12em] text-[#2B2B26]">
                        {s.family}
                      </span>
                      {s.toxicity && (
                        <span className={`text-xs font-sans uppercase tracking-[0.12em] ${TOXICITY_COLORS[s.toxicity] || 'text-[#2B2B26]'}`}>
                          • {s.toxicity}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {s.care_summary && (
                  <p className="text-sm text-[#2B2B26] mt-3 line-clamp-2">{s.care_summary}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {total > 20 && (
          <div className="flex items-center justify-center gap-2 pt-4">
            <button
              onClick={() => fetchSpecies(searchQuery, page - 1)}
              disabled={page === 1}
              className="px-4 py-2 text-xs font-sans uppercase tracking-[0.12em] text-[#1C2E10] border-[0.5px] border-[#D3C9B8] rounded-[2px] hover:border-[#3B6D11] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <span className="text-xs text-[#2B2B26]">
              Page {page} of {Math.ceil(total / 20)}
            </span>
            <button
              onClick={() => fetchSpecies(searchQuery, page + 1)}
              disabled={page >= Math.ceil(total / 20)}
              className="px-4 py-2 text-xs font-sans uppercase tracking-[0.12em] text-[#1C2E10] border-[0.5px] border-[#D3C9B8] rounded-[2px] hover:border-[#3B6D11] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
