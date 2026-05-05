import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { encyclopediaAPI, wantsAPI } from '../lib/api';
import {
  ChevronLeft, Leaf, Droplets, Sun, AlertTriangle, Sprout, Bug, BookOpen,
  ExternalLink, ShieldAlert, Heart, Bird, Scissors, Sparkles, BarChart3, Users, Loader2,
  Bookmark, BookmarkCheck,
} from 'lucide-react';
import SectionTutorial from '../components/SectionTutorial';
import { toast } from 'sonner';

const LIGHT_COPY = {
  low: 'Low light · north window or hallway',
  medium: 'Medium · several feet from a window',
  bright_indirect: 'Bright indirect · near a window, no direct sun',
  bright_direct: 'Bright direct · several hours of full sun',
};

const TOXICITY_INFO = {
  non_toxic: { color: 'text-[#3B6D11]', bg: 'bg-[#EAF3DE]', label: 'Pet-safe', icon: Heart },
  'non-toxic': { color: 'text-[#3B6D11]', bg: 'bg-[#EAF3DE]', label: 'Pet-safe', icon: Heart },
  mild: { color: 'text-[#8A6A3D]', bg: 'bg-[#FBFAF7]', label: 'Mildly toxic', icon: AlertTriangle },
  toxic: { color: 'text-[#B42318]', bg: 'bg-[#FEE4E2]', label: 'Toxic if ingested', icon: AlertTriangle },
};

// Phase 14B.1 — Badge ladder. Order matters; the first-applicable badge per
// flag wins so the UI never double-counts (e.g. native + pollinator stack
// because they're complementary signals).
function buildBadges(species) {
  const flags = species.flags || {};
  const list = [];
  if (flags.native_to_na) list.push({ key: 'native', icon: Sprout, label: 'Native to North America', tone: 'native' });
  if (flags.pollinator) list.push({ key: 'pollinator', icon: Bird, label: 'Supports pollinators', tone: 'pollinator' });
  if (flags.invasive_outdoors) list.push({ key: 'invasive', icon: ShieldAlert, label: 'Invasive outdoors — never compost or release', tone: 'invasive' });
  if (flags.cultivar) list.push({ key: 'cultivar', icon: Sparkles, label: `Cultivar${flags.parent_species ? ` · parent: ${flags.parent_species}` : ''}`, tone: 'cultivar' });
  if (flags.cut_flower) list.push({ key: 'cut', icon: Scissors, label: 'Cut-flower staple', tone: 'cut' });
  if (flags.medicinal) list.push({ key: 'medicinal', icon: Heart, label: 'Medicinal use', tone: 'medicinal' });
  if (flags.collector) list.push({ key: 'collector', icon: Bug, label: 'Collector species', tone: 'collector' });
  return list;
}

const BADGE_TONES = {
  native: 'border-[#3B6D11] bg-[#EAF3DE] text-[#1C2E10]',
  pollinator: 'border-[#BA7517] bg-[#FBF1E1] text-[#7A4F0E]',
  invasive: 'border-[#B42318] bg-[#FEE4E2] text-[#B42318]',
  cultivar: 'border-[#5B4E9C] bg-[#EFEBFA] text-[#3F356E]',
  cut: 'border-[#D4537E] bg-[#FDF5F8] text-[#A53B61]',
  medicinal: 'border-[#5DCAA5] bg-[#E1F4EC] text-[#1C5C44]',
  collector: 'border-[#5F5E5A] bg-[#EDE5D8] text-[#1A1A17]',
};

export default function SpeciesDetailPage() {
  const { speciesId } = useParams();
  const navigate = useNavigate();
  const [species, setSpecies] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLighting, setShowLighting] = useState(false);
  // Phase 14B.2 — community performance + narrative (lazy-loaded)
  const [performance, setPerformance] = useState(null);
  const [perfLoading, setPerfLoading] = useState(false);
  const [narrative, setNarrative] = useState(null);
  const [narrativeLoading, setNarrativeLoading] = useState(false);
  // Phase 14C — want list state
  const [wanted, setWanted] = useState(false);
  const [wantBusy, setWantBusy] = useState(false);

  // Hydrate want state once species loads
  useEffect(() => {
    if (!species) return;
    let alive = true;
    (async () => {
      try {
        const res = await wantsAPI.list();
        if (alive) setWanted((res.data?.wants || []).some((w) => w.species_id === species.id));
      } catch { /* non-blocking */ }
    })();
    return () => { alive = false; };
  }, [species]);

  const toggleWant = async () => {
    if (!species || wantBusy) return;
    setWantBusy(true);
    try {
      if (wanted) {
        await wantsAPI.remove(species.id);
        setWanted(false);
        toast.success(`Removed ${species.common_name} from your want list`);
      } else {
        await wantsAPI.add(species.id);
        setWanted(true);
        toast.success(`Added ${species.common_name} to your want list`);
      }
    } catch {
      toast.error('Failed to update want list');
    } finally {
      setWantBusy(false);
    }
  };

  useEffect(() => {
    const fetchSpecies = async () => {
      try {
        const res = await encyclopediaAPI.getSpeciesDetail(speciesId);
        setSpecies(res.data);
      } catch (e) {
        toast.error('Failed to load species');
        navigate('/greenhouse');
      } finally {
        setLoading(false);
      }
    };
    fetchSpecies();
  }, [speciesId, navigate]);

  // Phase 14B.2 — fetch performance + narrative in parallel after species
  // loads, but make them non-blocking so the main page renders immediately.
  useEffect(() => {
    if (!species) return;
    let alive = true;
    (async () => {
      setPerfLoading(true);
      try {
        const res = await encyclopediaAPI.getPerformance(species.id);
        if (alive) setPerformance(res.data);
      } catch { /* non-blocking */ }
      finally { if (alive) setPerfLoading(false); }
    })();
    (async () => {
      setNarrativeLoading(true);
      try {
        const res = await encyclopediaAPI.getNarrative(species.id);
        if (alive) setNarrative(res.data);
      } catch { /* non-blocking */ }
      finally { if (alive) setNarrativeLoading(false); }
    })();
    return () => { alive = false; };
  }, [species]);

  const badges = useMemo(() => (species ? buildBadges(species) : []), [species]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F5F0E8]">
        <div className="w-6 h-6 border-2 border-[#3B6D11] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!species) return null;

  const toxKey = (species.toxicity || '').replace('-', '_');
  const toxData = TOXICITY_INFO[toxKey] || TOXICITY_INFO.non_toxic;
  const ToxIcon = toxData.icon;
  const lightCopy = LIGHT_COPY[species.default_light_level] || 'Bright indirect light';
  const nativeAlts = species.flags?.native_alternatives_us || [];

  return (
    <div className="min-h-screen bg-[#F5F0E8] pb-6">
      {showLighting && (
        <SectionTutorial tutorialId="lighting" autoShow={true} />
      )}

      <div className="sticky top-0 z-40 bg-[#F5F0E8] border-b-[0.5px] border-[#D3C9B8] px-4 py-3">
        <div className="flex items-center gap-3 max-w-[1100px] mx-auto">
          <button
            onClick={() => navigate('/greenhouse')}
            className="text-[#1C2E10] hover:text-[#3B6D11] transition-colors"
            data-testid="species-back-button"
            aria-label="Go back"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h1 className="font-plant text-xl text-[#1C2E10]">{species.common_name}</h1>
        </div>
      </div>

      <div className="max-w-[1100px] mx-auto px-4 pt-6 space-y-4" data-testid="species-detail">
        {/* Header card */}
        <div className="rounded-[14px] border-[0.5px] border-[#D3C9B8] bg-[#EDE5D8] p-5">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-[#EAF3DE] flex items-center justify-center flex-shrink-0">
              <Leaf className="h-8 w-8 text-[#3B6D11]" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-plant text-2xl text-[#1C2E10]">{species.common_name}</h2>
              <p className="font-latin text-base italic text-[#3B3A33] mt-1">{species.latin_name}</p>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="px-2 py-1 rounded-[20px] bg-[#EAF3DE] text-[#1C2E10] text-xs font-ui uppercase tracking-[0.12em]">
                  {species.family}
                </span>
                <span className={`px-2 py-1 rounded-[20px] ${toxData.bg} ${toxData.color} text-xs font-ui uppercase tracking-[0.12em] flex items-center gap-1`}>
                  <ToxIcon className="h-3 w-3" />
                  {toxData.label}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={toggleWant}
              disabled={wantBusy}
              data-testid="species-want-toggle"
              aria-pressed={wanted}
              title={wanted ? 'On your want list' : 'Add to your want list'}
              className={`flex-shrink-0 w-10 h-10 rounded-full border-[0.5px] flex items-center justify-center transition-colors duration-150 ${
                wanted
                  ? 'bg-[#1C2E10] border-[#1C2E10] text-[#F5F0E8]'
                  : 'bg-[#FDFAF6] border-[#D3C9B8] text-[#1C2E10] hover:border-[#3B6D11]'
              }`}
            >
              {wanted ? <BookmarkCheck className="h-5 w-5" /> : <Bookmark className="h-5 w-5" />}
            </button>
          </div>

          {/* Conservation / cultivar / cut-flower badges */}
          {badges.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4" data-testid="species-badges">
              {badges.map((b) => {
                const Icon = b.icon;
                return (
                  <span
                    key={b.key}
                    data-testid={`species-badge-${b.key}`}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[20px] border-[0.5px] text-[11px] font-ui ${BADGE_TONES[b.tone]}`}
                  >
                    <Icon className="h-3 w-3" />
                    {b.label}
                  </span>
                );
              })}
            </div>
          )}

          {/* Invasive native alternatives */}
          {nativeAlts.length > 0 && (
            <div
              className="mb-4 rounded-[10px] border-[0.5px] border-[#3B6D11] bg-[#EAF3DE] p-3"
              data-testid="species-native-alternatives"
            >
              <p className="font-plant text-[#1C2E10] text-xs mb-1">Try these natives instead:</p>
              <ul className="font-ui text-xs text-[#2B2B26] list-disc pl-4 space-y-0.5">
                {nativeAlts.map((alt) => (<li key={alt}><em>{alt}</em></li>))}
              </ul>
            </div>
          )}

          {species.care_summary && (
            <p className="font-ui text-sm text-[#2B2B26] leading-relaxed">{species.care_summary}</p>
          )}
        </div>

        {/* Care info grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-[14px] border-[0.5px] border-[#D3C9B8] bg-[#EDE5D8] p-4" data-testid="species-watering-card">
            <div className="flex items-center gap-2 mb-2">
              <Droplets className="h-5 w-5 text-[#3B6D11]" />
              <h3 className="font-ui text-xs uppercase tracking-[0.12em] text-[#1C2E10]">Watering</h3>
            </div>
            <p className="font-ui text-sm text-[#2B2B26]">Every {species.default_watering_days} days</p>
            <p className="font-latin text-xs text-[#3B3A33] mt-1 capitalize">Medium: {species.default_grow_medium || 'soil'}</p>
          </div>

          <button
            type="button"
            onClick={() => setShowLighting(true)}
            data-testid="species-lighting-card"
            className="text-left rounded-[14px] border-[0.5px] border-[#D3C9B8] bg-[#EDE5D8] p-4 hover:border-[#3B6D11] transition-colors duration-150"
          >
            <div className="flex items-center gap-2 mb-2">
              <Sun className="h-5 w-5 text-[#BA7517]" />
              <h3 className="font-ui text-xs uppercase tracking-[0.12em] text-[#1C2E10]">Light</h3>
            </div>
            <p className="font-ui text-sm text-[#2B2B26]">{lightCopy}</p>
            <p className="font-latin text-[10px] text-[#3B3A33] mt-1 underline">Tap for a primer on light</p>
          </button>

          {(species.native_range || species.native_habitat) && (
            <div className="rounded-[14px] border-[0.5px] border-[#D3C9B8] bg-[#EDE5D8] p-4" data-testid="species-origin-card">
              <div className="flex items-center gap-2 mb-2">
                <Leaf className="h-5 w-5 text-[#3B6D11]" />
                <h3 className="font-ui text-xs uppercase tracking-[0.12em] text-[#1C2E10]">Origin</h3>
              </div>
              <p className="font-ui text-sm text-[#2B2B26]">{species.native_range || species.native_habitat}</p>
            </div>
          )}
        </div>

        {/* Companions — Phase 14B.2 */}
        {Array.isArray(species.companions) && species.companions.length > 0 && (
          <div className="rounded-[14px] border-[0.5px] border-[#D3C9B8] bg-[#EDE5D8] p-4" data-testid="species-companions">
            <div className="flex items-center gap-2 mb-3">
              <Sprout className="h-4 w-4 text-[#3B6D11]" />
              <h3 className="font-ui text-xs uppercase tracking-[0.12em] text-[#1C2E10]">Pairs well with</h3>
            </div>
            <ul className="space-y-2">
              {species.companions.map((c) => (
                <li key={c.id} data-testid={`species-companion-${c.slug}`}>
                  <button
                    type="button"
                    onClick={() => navigate(`/greenhouse/${c.id}`)}
                    className="w-full text-left rounded-[10px] border-[0.5px] border-[#D3C9B8] bg-[#FDFAF6] p-3 hover:border-[#3B6D11] transition-colors duration-150"
                  >
                    <div className="flex items-baseline justify-between gap-2 mb-1">
                      <span className="font-plant text-sm text-[#1C2E10]">{c.common_name}</span>
                      <span className="font-latin italic text-[11px] text-[#3B3A33]">{c.latin_name}</span>
                    </div>
                    <p className="font-ui text-xs text-[#2B2B26] leading-snug">{c.reasoning}</p>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Community performance + AI narrative — Phase 14B.2 */}
        <CommunityPerformanceSection
          loading={perfLoading || narrativeLoading}
          performance={performance}
          narrative={narrative}
        />

        {/* Citations */}
        {Array.isArray(species.citations) && species.citations.length > 0 && (
          <div className="rounded-[14px] border-[0.5px] border-[#D3C9B8] bg-[#FDFAF6] p-4" data-testid="species-citations">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="h-4 w-4 text-[#5F5E5A]" />
              <h3 className="font-ui text-xs uppercase tracking-[0.12em] text-[#1C2E10]">Sources</h3>
            </div>
            <ul className="space-y-1.5">
              {species.citations.map((c, i) => (
                <li key={i}>
                  <a
                    href={c.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-testid={`species-citation-${i}`}
                    className="font-ui text-xs text-[#2D5016] hover:text-[#1C2E10] underline underline-offset-2 inline-flex items-center gap-1"
                  >
                    {c.label}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
              ))}
            </ul>
            <p className="font-latin italic text-[10px] text-[#888780] mt-3 leading-snug">
              Care defaults curated against published sources. Local conditions vary — adjust to what your space tells you.
            </p>
          </div>
        )}

        {/* Community count */}
        {species.in_collections_count !== undefined && (
          <div className="rounded-[14px] border-[0.5px] border-[#D3C9B8] bg-[#EDE5D8] p-4 text-center" data-testid="species-community-card">
            <p className="font-ui text-sm text-[#2B2B26]">
              <strong className="text-[#1C2E10]">{species.in_collections_count}</strong> {species.in_collections_count === 1 ? 'grower has' : 'growers have'} this plant in Grove.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Phase 14B.2 — Community performance + AI narrative
function CommunityPerformanceSection({ loading, performance, narrative }) {
  if (!performance && !narrative && !loading) return null;
  const sample = performance?.sample;
  const empty = performance && performance.sample.total_plants === 0;
  const confidenceLabel = {
    low: 'Early data',
    emerging: 'Emerging dataset',
    established: 'Established dataset',
  }[sample?.confidence || 'low'];

  return (
    <div className="rounded-[14px] border-[0.5px] border-[#D3C9B8] bg-[#EDE5D8] p-4" data-testid="species-performance">
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 className="h-4 w-4 text-[#1C2E10]" />
        <h3 className="font-ui text-xs uppercase tracking-[0.12em] text-[#1C2E10]">How growers fare</h3>
        {sample && (
          <span
            data-testid="species-performance-confidence"
            className="ml-auto text-[10px] font-ui text-[#5F5E5A]"
          >
            {confidenceLabel} · {sample.total_plants} plant{sample.total_plants === 1 ? '' : 's'} from {sample.unique_growers} grower{sample.unique_growers === 1 ? '' : 's'}
          </span>
        )}
      </div>

      {loading && !performance && (
        <div className="flex items-center gap-2 py-4 text-[#5F5E5A]">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="font-ui text-xs">Computing community averages…</span>
        </div>
      )}

      {empty && (
        <p className="font-ui text-xs text-[#5F5E5A] leading-snug">
          No one in Grove has added this plant yet. Stats will appear here as growers add it to their collections.
        </p>
      )}

      {performance && !empty && (
        <div className="grid grid-cols-2 gap-2 mb-3" data-testid="species-performance-stats">
          <PerfStat
            label="1-year survival"
            value={performance.success_rate_1y_pct !== null ? `${performance.success_rate_1y_pct}%` : '—'}
            sub={
              sample.cohort_one_year > 0
                ? `${sample.cohort_one_year} plant${sample.cohort_one_year === 1 ? '' : 's'} ≥1y old`
                : 'No 1y cohort yet'
            }
            testid="perf-survival"
          />
          <PerfStat
            label="Days to first bloom"
            value={performance.avg_days_to_first_bloom !== null ? `${performance.avg_days_to_first_bloom}` : '—'}
            sub={performance.avg_days_to_first_bloom !== null ? 'avg, recorded blooms' : 'No blooms logged yet'}
            testid="perf-bloom"
          />
          <PerfStat
            label="Healthy watering cadence"
            value={
              performance.median_watering_days_healthy !== null
                ? `Every ${performance.median_watering_days_healthy} days`
                : '—'
            }
            sub="median across healthy plants"
            testid="perf-water"
          />
          <PerfStat
            label="Common problems"
            value={
              performance.common_problems?.length > 0
                ? performance.common_problems[0].label
                : 'None reported'
            }
            sub={
              performance.common_problems?.length > 1
                ? `+${performance.common_problems.length - 1} more`
                : '—'
            }
            testid="perf-problems"
          />
        </div>
      )}

      {/* AI-generated narrative */}
      {narrative?.narrative && !empty && (
        <div
          className="rounded-[10px] border-[0.5px] border-[#D3C9B8] bg-[#FDFAF6] p-3"
          data-testid="species-performance-narrative"
        >
          <div className="flex items-center gap-1.5 mb-2">
            <Sparkles className="h-3 w-3 text-[#BA7517]" />
            <span className="font-plant text-[10px] uppercase tracking-[0.12em] text-[#5F5E5A]">
              Editorial summary
            </span>
          </div>
          <p className="font-ui text-xs leading-relaxed text-[#2B2B26]">{narrative.narrative}</p>
        </div>
      )}

      {sample && sample.confidence === 'low' && !empty && (
        <p className="font-latin italic text-[10px] text-[#888780] mt-2 leading-snug">
          Sample size is small — treat these numbers as a starting point, not a verdict.
        </p>
      )}
    </div>
  );
}

function PerfStat({ label, value, sub, testid }) {
  return (
    <div
      className="rounded-[10px] border-[0.5px] border-[#D3C9B8] bg-[#FDFAF6] p-2.5"
      data-testid={testid}
    >
      <p className="font-ui text-[9px] uppercase tracking-[0.12em] text-[#5F5E5A]">{label}</p>
      <p className="font-plant text-sm text-[#1C2E10] mt-0.5 leading-tight">{value}</p>
      {sub && <p className="font-latin text-[10px] text-[#888780] mt-0.5">{sub}</p>}
    </div>
  );
}
