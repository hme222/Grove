import { tint, guildAccent } from '../lib/color';
import Loading from '../components/Loading';
import { checkInterval } from '../lib/careCopy';
import ToxicityBadge from '../components/ToxicityBadge';
import NotFoundPage from './NotFoundPage';
import { guildIcon } from '../lib/guildIcon';
import React, { useState, useEffect, useCallback } from 'react';
import { LoadErrorPage } from '../components/LoadError';
import { PageHeader } from '../components/PageHeader';
import { useParams, useLocation } from 'react-router-dom';
import AppLink from '../components/AppLink';
import { guildAPI } from '../lib/api';
import { Leaf, Droplets, Sun } from 'lucide-react';

const LIGHT_LABEL = {
  low: 'Low',
  medium: 'Medium',
  bright_indirect: 'Bright indirect',
  bright_direct: 'Bright direct',
};

export default function GuildDetailPage() {
  const { slug } = useParams();
  const location = useLocation();
  const knownName = location.state?.name;
  const [guild, setGuild] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const run = useCallback(async () => {
    setLoadError(false);
    try {
      const res = await guildAPI.get(slug);
      setGuild(res.data);
    } catch (e) {
      if (e?.response?.status === 404) {
        setNotFound(true);
      } else {
        setLoadError(true);
      }
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => { run(); }, [run]);
  useEffect(() => { if (loadError && knownName) document.title = `${knownName} · FloraGrove`; }, [loadError, knownName]);

  if (notFound) return <NotFoundPage title="Guild not found" heading="We can't find that guild" message="It may have been renamed or removed." to="/greenhouse" toLabel="Back to Learn" />;
  if (loadError) {
    return <LoadErrorPage title={knownName || 'Guild'} what={knownName ? `the ${knownName} guild` : 'this guild'} back={{ to: '/greenhouse', where: 'Learn' }} onRetry={run} />;
  }

  if (loading) {
    return (
      <Loading label="Loading this guild" className="min-h-screen bg-grove-forest" />
    );
  }
  if (!guild) return null;
  const accent = guildAccent(guild);
  const paragraphs = (guild.description || '').split('\n\n').filter(Boolean);

  return (
    <div className="min-h-screen bg-grove-forest pb-6" data-testid="guild-detail">
      <PageHeader title={guild.name} back={{ to: '/greenhouse', where: 'Learn', testId: 'guild-back-button' }} />

      <div className="max-w-page mx-auto px-4 pt-6 space-y-4">
        {/* Hero */}
        <div
          className="rounded-card border-hairline bg-grove-canopy p-5 relative overflow-hidden"
          style={{ borderColor: tint(accent, 25) }}
        >
          <div
            className="w-12 h-12 rounded-control flex items-center justify-center mb-3"
            style={{ backgroundColor: tint(accent, 15) }}
          >
            <GuildGlyph guild={guild} className="h-6 w-6" style={{ color: accent }} />
          </div>
          <p className="sr-only" data-testid="guild-name">{guild.name}</p>
          {guild.subtitle && (
            <p className="font-latin italic text-sm text-grove-cream">{guild.subtitle}</p>
          )}
          {guild.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {guild.tags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center px-2.5 py-1 rounded-pill bg-grove-canopy border-hairline border-grove-moss text-xs font-ui text-grove-sage min-h-6"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Species */}
        <div data-testid="guild-species-list">
          <h2 className="font-plant text-grove-cream text-xl font-semibold mb-2">
            The {guild.species.length} species in this guild
          </h2>
          <ul className="space-y-2">
            {guild.species.map((s) => (
              <li key={s.id}>
                <AppLink
                  to={`/greenhouse/${s.id}`}
                  state={{ name: s.common_name }}
                  data-testid={`guild-species-${s.slug}`}
                  className="block w-full text-left rounded-small border-hairline border-grove-moss bg-grove-canopy px-4 py-3 hover:border-grove-fernLine transition-colors duration-150"
                >
                  <div className="flex items-baseline justify-between gap-2 mb-1">
                    <span className="font-plant text-base text-grove-cream">{s.common_name}</span>
                    <span className="font-latin italic text-xs text-grove-cream">{s.latin_name}</span>
                  </div>
                  {s.toxicity && <ToxicityBadge toxicity={s.toxicity} size="sm" className="mb-1.5" />}
                  <div className="flex flex-wrap gap-3 mt-1.5 text-xs font-ui text-grove-sage">
                    <span className="inline-flex items-center gap-1">
                      <Sun className="h-3 w-3" /> {LIGHT_LABEL[s.default_light_level] || s.default_light_level || '—'}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Droplets className="h-3 w-3" /> {checkInterval(s.default_watering_days)}
                    </span>
                    {s.flags?.native_to_na && (
                      <span className="inline-flex items-center gap-1 text-grove-sprout">
                        <Leaf className="h-3 w-3" /> Native to NA
                      </span>
                    )}
                  </div>
                </AppLink>
              </li>
            ))}
          </ul>
        </div>

        {/* Description */}
        <div className="rounded-card border-hairline border-grove-moss bg-grove-canopy p-5" data-testid="guild-description">
          {paragraphs.map((p, i) => (
            <p key={i} className={`font-ui text-sm leading-relaxed text-grove-cream ${i > 0 ? 'mt-3' : ''}`}>
              {p}
            </p>
          ))}
        </div>

        {/* Design notes */}
        {guild.design_notes && (
          <div
            className="rounded-card border-hairline bg-grove-canopy p-5"
            style={{ borderColor: tint(accent, 25) }}
            data-testid="guild-design-notes"
          >
            <h2 className="font-plant text-base font-semibold text-grove-cream mb-1.5">
              Design notes
            </h2>
            <p className="font-ui text-xs leading-relaxed text-grove-cream">{guild.design_notes}</p>
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
