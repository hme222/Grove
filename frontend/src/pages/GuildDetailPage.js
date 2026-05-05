import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { guildAPI } from '../lib/api';
import { ChevronLeft, Leaf, Droplets, Sun, Layers } from 'lucide-react';
import { toast } from 'sonner';

const LIGHT_LABEL = {
  low: 'Low',
  medium: 'Medium',
  bright_indirect: 'Bright indirect',
  bright_direct: 'Bright direct',
};

export default function GuildDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [guild, setGuild] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      try {
        const res = await guildAPI.get(slug);
        setGuild(res.data);
      } catch (_e) {
        toast.error('Guild not found');
        navigate('/greenhouse');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [slug, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F5F0E8]">
        <div className="w-6 h-6 border-2 border-[#3B6D11] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!guild) return null;
  const accent = guild.accent_color || '#3B6D11';
  const paragraphs = (guild.description || '').split('\n\n').filter(Boolean);

  return (
    <div className="min-h-screen bg-[#F5F0E8] pb-6" data-testid="guild-detail">
      <div className="sticky top-0 z-40 bg-[#F5F0E8] border-b-[0.5px] border-[#D3C9B8] px-4 py-3">
        <div className="flex items-center gap-3 max-w-[1100px] mx-auto">
          <button
            onClick={() => navigate('/greenhouse')}
            className="text-[#1C2E10] hover:text-[#3B6D11] transition-colors"
            data-testid="guild-back-button"
            aria-label="Back to Greenhouse"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h1 className="font-plant text-xl text-[#1C2E10]">Guild</h1>
        </div>
      </div>

      <div className="max-w-[1100px] mx-auto px-4 pt-6 space-y-4">
        {/* Hero */}
        <div
          className="rounded-[14px] border-[0.5px] p-5 relative overflow-hidden"
          style={{
            backgroundColor: `${accent}10`,
            borderColor: `${accent}40`,
          }}
        >
          <div
            className="w-12 h-12 rounded-[12px] flex items-center justify-center mb-3"
            style={{ backgroundColor: `${accent}25` }}
          >
            <Layers className="h-6 w-6" style={{ color: accent }} />
          </div>
          <h2
            className="font-plant text-2xl leading-tight mb-1"
            style={{ color: '#1C2E10' }}
            data-testid="guild-name"
          >
            {guild.name}
          </h2>
          {guild.subtitle && (
            <p className="font-latin italic text-sm text-[#3B3A33]">{guild.subtitle}</p>
          )}
          {guild.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {guild.tags.map((t) => (
                <span
                  key={t}
                  className="px-2 py-0.5 rounded-[20px] bg-[#FDFAF6] border-[0.5px] border-[#D3C9B8] text-[10px] font-ui uppercase tracking-[0.08em] text-[#5F5E5A]"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Description */}
        <div className="rounded-[14px] border-[0.5px] border-[#D3C9B8] bg-[#EDE5D8] p-5" data-testid="guild-description">
          {paragraphs.map((p, i) => (
            <p key={i} className={`font-ui text-sm leading-relaxed text-[#2B2B26] ${i > 0 ? 'mt-3' : ''}`}>
              {p}
            </p>
          ))}
        </div>

        {/* Design notes */}
        {guild.design_notes && (
          <div
            className="rounded-[14px] border-[0.5px] p-4"
            style={{ borderColor: `${accent}40`, backgroundColor: `${accent}08` }}
            data-testid="guild-design-notes"
          >
            <p className="font-plant text-[10px] uppercase tracking-[0.12em] text-[#1C2E10] mb-1.5">
              Design notes
            </p>
            <p className="font-ui text-xs leading-relaxed text-[#2B2B26]">{guild.design_notes}</p>
          </div>
        )}

        {/* Species */}
        <div data-testid="guild-species-list">
          <h3 className="font-plant text-[#1C2E10] text-sm uppercase tracking-[0.08em] mb-2">
            The {guild.species.length} species in this guild
          </h3>
          <ul className="space-y-2">
            {guild.species.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => navigate(`/greenhouse/${s.id}`)}
                  data-testid={`guild-species-${s.slug}`}
                  className="w-full text-left rounded-[12px] border-[0.5px] border-[#D3C9B8] bg-[#FDFAF6] p-3 hover:border-[#3B6D11] transition-colors duration-150"
                >
                  <div className="flex items-baseline justify-between gap-2 mb-1">
                    <span className="font-plant text-base text-[#1C2E10]">{s.common_name}</span>
                    <span className="font-latin italic text-xs text-[#3B3A33]">{s.latin_name}</span>
                  </div>
                  <div className="flex flex-wrap gap-3 mt-1.5 text-[11px] font-ui text-[#5F5E5A]">
                    <span className="inline-flex items-center gap-1">
                      <Sun className="h-3 w-3" /> {LIGHT_LABEL[s.default_light_level] || s.default_light_level || '—'}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Droplets className="h-3 w-3" /> Every {s.default_watering_days || '—'} days
                    </span>
                    {s.flags?.native_to_na && (
                      <span className="inline-flex items-center gap-1 text-[#3B6D11]">
                        <Leaf className="h-3 w-3" /> Native to NA
                      </span>
                    )}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
