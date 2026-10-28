import LoadError from '../components/LoadError';
import { LoadingList } from '../components/Loading';
import ToxicityBadge from '../components/ToxicityBadge';
import { guildIcon } from '../lib/guildIcon';
import { GUILDS_ENABLED } from '../lib/features';
import React, { useState, useEffect } from 'react';
import AppLink from '../components/AppLink';
import { encyclopediaAPI, guildAPI } from '../lib/api';
import { PageHeader } from '../components/PageHeader';
import { Input } from '@/components/ui/input';
import SectionTutorial from '../components/SectionTutorial';
import { Search, Leaf, ChevronRight } from 'lucide-react';
import { getToxicityInfo } from '../lib/toxicity';
import { cn } from '../lib/utils';
import { buttonVariants } from '../components/ui/button';
import PhotoBand from '../components/PhotoBand';

const GUILD_PLACEHOLDERS = 4;

export default function EncyclopediaPage() {
  const [species, setSpecies] = useState([]);
  const [guilds, setGuilds] = useState([]);
  const [guildsFailed, setGuildsFailed] = useState(false);
  const [guildsLoading, setGuildsLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchSpecies = async (query = '', pageNum = 1) => {
    const isSearch = query.length >= 2;
    if (isSearch) setSearching(true);
    else setLoading(true);

    try {
      setLoadError(false);
      const res = await encyclopediaAPI.getSpecies({ q: query, page: pageNum, limit: 20 });
      setSpecies(res.data.species);
      setTotal(res.data.total);
      setPage(pageNum);
    } catch (e) {
      setLoadError(true);
    } finally {
      setLoading(false);
      setSearching(false);
    }
  };

  // Phase 14B.2 — load guilds once for the curated row above the species list.
  useEffect(() => {
    if (!GUILDS_ENABLED) { setGuildsLoading(false); return undefined; }
    let alive = true;
    (async () => {
      try {
        const res = await guildAPI.list();
        if (alive) setGuilds(res.data.guilds || []);
      } catch { if (alive) setGuildsFailed(true); }
      finally { if (alive) setGuildsLoading(false); }
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

  return (
    <div>
      <SectionTutorial tutorialId="greenhouse" />
      <PageHeader title="Learn" />

      <div className="max-w-page mx-auto px-4 py-4 space-y-4">
        <AppLink to="/lessons" data-testid="learn-lessons-card"
          className="block w-full overflow-hidden rounded-card border-hairline border-grove-sun/25 bg-gradient-to-br from-grove-canopy to-grove-moss text-left transition-colors duration-200 hover:border-grove-sun/80">
          <PhotoBand src="/photos/watering-1.jpg" ratio="band" className="rounded-none" eager />
          <span className="flex items-center justify-between gap-3 p-5">
            <span className="min-w-0">
              <span className="block font-plant text-base font-semibold text-grove-cream">Short lessons</span>
              <span className="mt-1 block font-ui text-sm leading-snug text-grove-sage">Watering, light and soil, explained in a few minutes each.</span>
            </span>
            <ChevronRight className="h-5 w-5 shrink-0 text-grove-sage" aria-hidden="true" />
          </span>
        </AppLink>
        {/* Guilds row — Phase 14B.2 */}
        {guildsFailed && !loadError && !searchQuery && (
          <LoadError compact what="the themed guilds" note="The plant guide below still works." testId="guilds-failed" />
        )}
        {/* While the guilds load, the row's place is held by tinted blocks of the same size (a guild card's
            title is always two lines tall), so the plant guide below does not jump when they arrive. */}
        {guildsLoading && !searchQuery && (
          <div className="space-y-2" role="status" data-testid="greenhouse-guilds-loading">
            <h2 className="font-plant text-grove-cream text-xl font-semibold">Themed guilds</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2" aria-hidden="true">
              {Array.from({ length: GUILD_PLACEHOLDERS }, (_, i) => (
                <div key={i} className="rounded-chip border-hairline border-grove-moss bg-grove-canopy p-3">
                  <div className="mb-2 h-7 w-7 rounded-inset bg-grove-moss motion-safe:animate-soft-pulse" />
                  <div className="h-10" />
                  <div className="mt-1 h-4 w-1/2 rounded-inset bg-grove-moss motion-safe:animate-soft-pulse" />
                </div>
              ))}
            </div>
            <span className="sr-only">Loading themed guilds</span>
          </div>
        )}
        {guilds.length > 0 && !searchQuery && (
          <div className="space-y-2" data-testid="greenhouse-guilds-row">
            <div className="flex items-center justify-between">
              <h2 className="font-plant text-grove-cream text-xl font-semibold">
                Themed guilds
              </h2>
              <span className="font-ui text-xs text-grove-sage">{guilds.length} curated</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {guilds.map((g) => {
                return (
                  <AppLink
                    key={g.id}
                    to={`/guilds/${g.slug}`}
                    state={{ name: g.name }}
                    data-testid={`guild-card-${g.slug}`}
                    className="block rounded-chip border-hairline border-grove-moss bg-grove-canopy p-3 text-left transition-colors duration-150 hover:border-grove-fernLine"
                  >
                    <div className="mb-2 flex h-7 w-7 items-center justify-center rounded-inset bg-grove-moss">
                      <GuildGlyph guild={g} className="h-3.5 w-3.5 text-grove-sprout" />
                    </div>
                    <h3 className="h-10 overflow-hidden font-plant text-base font-semibold text-grove-cream leading-tight line-clamp-2">
                      {g.name}
                    </h3>
                    <p className="font-ui text-xs font-normal text-grove-sage mt-1">
                      {g.species_count} species
                    </p>
                  </AppLink>
                );
              })}
            </div>
          </div>
        )}

        {/* Search */}
        <div className="flex items-center justify-between">
          <h2 className="font-plant text-xl font-semibold text-grove-cream">Plant guide</h2>
          {!loadError && !loading && <span className="font-ui text-xs text-grove-sage">{total} species</span>}
        </div>
        {!loadError && (
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-grove-sage" aria-hidden="true" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search the plant guide by common or Latin name"
            placeholder="Search species by common or Latin name"
            className="h-12 rounded-control border-hairline bg-grove-canopy pl-10"
            data-testid="greenhouse-search"
          />
        </div>
        )}

        {/* Species Grid */}
        {loadError && !loading ? (<LoadError what={guildsFailed ? 'the plant guide and themed guilds' : 'the plant guide'} onRetry={() => (guildsFailed ? window.location.reload() : fetchSpecies())} />) : loading || searching ? (
          <LoadingList label="Loading the plant guide" />
        ) : species.length === 0 ? (
          <div className="rounded-small border-hairline border-grove-moss bg-grove-moss p-6 text-center">
            <p className="text-sm text-grove-cream">
              {searchQuery ? `No species found for "${searchQuery}"` : 'No species in the guide yet'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {species.map((s) => (
              <AppLink
                key={s.id}
                to={`/greenhouse/${s.id}`}
                state={{ name: s.common_name }}
                className="block w-full text-left rounded-card border-hairline border-grove-moss bg-grove-moss p-5 cursor-pointer hover:border-grove-fernLine transition-all duration-150"
                data-testid="species-card"
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-pill bg-grove-moss flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {(s.botanical_illustration_thumb || s.bhl_primary_thumbnail || s.wiki_thumbnail || s.wiki_image) ? (
                      <PhotoBand
                        src={s.botanical_illustration_thumb || s.bhl_primary_thumbnail || s.wiki_thumbnail || s.wiki_image}
                        aspect="thumb"
                        fit={s.botanical_illustration_thumb ? 'contain' : 'cover'}
                        className="h-full w-full rounded-none"
                      />
                    ) : (
                      <Leaf className="h-6 w-6 text-grove-sprout" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-plant text-grove-cream text-base font-semibold truncate">{s.common_name}</h3>
                    <p className="text-xs italic text-grove-sage truncate">{s.latin_name}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className="min-w-0 max-w-full break-words text-xs text-grove-sage">{s.family}</span>
                      {s.toxicity && getToxicityInfo(s.toxicity).level !== 'unknown' && (
                        <ToxicityBadge toxicity={s.toxicity} size="sm" className="max-w-full" />
                      )}
                    </div>
                  </div>
                </div>
                {s.care_summary && (
                  <p className="text-sm text-grove-cream mt-3 line-clamp-2">{s.care_summary}</p>
                )}
              </AppLink>
            ))}
          </div>
        )}

        {/* Pagination */}
        {total > 20 && (
          <div className="flex items-center justify-center gap-2 pt-4">
            <button
              onClick={() => fetchSpecies(searchQuery, page - 1)}
              disabled={page === 1}
              className={cn(buttonVariants({ variant: 'outline' }), 'disabled:border-grove-moss disabled:text-grove-lichen disabled:opacity-100')}
            >
              Previous
            </button>
            <span className="text-xs text-grove-cream">
              Page {page} of {Math.ceil(total / 20)}
            </span>
            <button
              onClick={() => fetchSpecies(searchQuery, page + 1)}
              disabled={page >= Math.ceil(total / 20)}
              className={cn(buttonVariants({ variant: 'outline' }), 'disabled:border-grove-moss disabled:text-grove-lichen disabled:opacity-100')}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function GuildGlyph({ guild, ...props }) {
  const Icon = guildIcon(guild);
  return <Icon aria-hidden="true" {...props} />;
}
