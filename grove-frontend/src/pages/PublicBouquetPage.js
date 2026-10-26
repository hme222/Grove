import { buttonVariants } from '../components/ui/button';
import React, { useState, useEffect } from 'react';
import LoadError from '../components/LoadError';
import Loading from '../components/Loading';
import { useParams } from 'react-router-dom';
import { bouquetAPI } from '../lib/api';
import { getFileUrl } from '../lib/api';
import { Flower2, ExternalLink } from 'lucide-react';
import { GROVE_BRAND } from '@/constants/brand';
import { FloraGroveWordmark } from '@/components/brand/FloraGroveWordmark';

export default function PublicBouquetPage() {
  const { slug } = useParams();
  const [bouquet, setBouquet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await bouquetAPI.getPublic(slug);
        setBouquet(res.data);
      } catch (e) {
        setError(e?.response?.status === 404 ? 'Bouquet not found' : 'unreachable');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [slug]);

  if (loading) {
    return (
      <Loading label="Loading the bouquet" className="min-h-screen bg-grove-bloom/15" />
    );
  }

  if (error || !bouquet) {
    return (
      <div className="min-h-screen bg-grove-bloom/15 flex items-center justify-center">
        <div className="text-center">
          <Flower2 className="h-12 w-12 text-grove-blush opacity-30 mx-auto mb-3" />
          {error === 'unreachable' ? (
            <div className="mx-auto max-w-form px-4 text-left"><LoadError compact what="this bouquet" note="The link is fine." /></div>
          ) : (
            <div className="mx-auto max-w-form px-4">
              <h1 className="font-plant text-2xl text-grove-cream">This bouquet isn&rsquo;t here</h1>
              <p className="mt-2 font-ui text-sm text-grove-sage">The link may be old, or the bouquet was removed by its owner.</p>
              <a href="/login" className={buttonVariants({ className: 'mt-4' })}>Go to FloraGrove</a>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-grove-bloom/15">
      {/* Header */}
      <div className="bg-grove-canopy border-b-hairline border-grove-bloom/20 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FloraGroveWordmark size={16} />
        </div>
        {bouquet.studio_name && (
          <span className="font-ui text-xs text-grove-blush">{bouquet.studio_name}</span>
        )}
      </div>

      <div className="max-w-column mx-auto px-4 py-6">
        {/* Bouquet info */}
        <div className="text-center mb-6">
          {bouquet.photo_url && (
            <div className="rounded-small overflow-hidden border-hairline border-grove-bloom/20 mb-4">
              <div className="w-full aspect-[4/3] bg-grove-bloom/15 flex items-center justify-center"><img src={getFileUrl(bouquet.photo_url)} alt={bouquet.name} className="w-full h-full object-cover" /></div>
            </div>
          )}
          <h1 className="font-plant text-grove-cream text-2xl">{bouquet.name}</h1>
          {bouquet.occasion && (
            <span className="inline-flex items-center rounded-round border-hairline border-grove-bloom/30 bg-grove-root px-2.5 py-1 text-xs font-ui text-grove-blush capitalize mt-2 min-h-6">{bouquet.occasion}</span>
          )}
          {bouquet.personal_note && (
            <p className="font-ui text-sm text-grove-cream mt-3 italic">"{bouquet.personal_note}"</p>
          )}
        </div>

        {/* Flowers */}
        {bouquet.flowers?.length > 0 && (
          <div className="mb-6">
            <h2 className="font-plant text-grove-cream text-xl font-semibold mb-3">Flowers in this arrangement</h2>
            <div className="space-y-2">
              {bouquet.flowers.map((f, i) => (
                <div key={i} className="rounded-card border-hairline border-grove-bloom/20 bg-grove-canopy p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-ui text-grove-cream text-sm font-medium">{f.common_name}</p>
                      <p className="font-latin text-xs text-grove-blush">{f.latin_name}</p>
                    </div>
                    <span className="inline-flex items-center rounded-round border-hairline border-grove-bloom/30 bg-grove-bloom/15 px-2.5 py-1 text-xs font-ui text-grove-blush min-h-6">
                      {f.vase_life_days}d life
                    </span>
                  </div>
                  {f.care_instructions && (
                    <p className="font-ui text-xs text-grove-cream mt-2">{f.care_instructions}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Care plan */}
        {bouquet.care_plan && (
          <div className="mb-6">
            <h2 className="font-plant text-grove-cream text-xl font-semibold mb-3">Care Instructions</h2>
            {bouquet.care_plan.immediate_steps?.length > 0 && (
              <div className="rounded-card border-hairline border-grove-bloom/20 bg-grove-canopy p-5 mb-2">
                <h3 className="font-plant text-grove-blush text-base font-semibold  mb-2">Immediate</h3>
                <ul className="space-y-1">
                  {bouquet.care_plan.immediate_steps.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs font-ui"><span className="text-grove-blush">•</span>{s}</li>
                  ))}
                </ul>
              </div>
            )}
            {bouquet.care_plan.daily_steps?.length > 0 && (
              <div className="rounded-card border-hairline border-grove-bloom/20 bg-grove-canopy p-5">
                <h3 className="font-plant text-grove-blush text-base font-semibold  mb-2">Daily</h3>
                <ul className="space-y-1">
                  {bouquet.care_plan.daily_steps.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs font-ui"><span className="text-grove-blush">•</span>{s}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* CTA */}
        <div className="text-center mt-8 mb-4">
          <a href="/register" className="inline-flex items-center gap-1.5 rounded-control font-ui text-xs px-6 py-3 bg-grove-bloom text-grove-root hover:bg-grove-sprout transition-colors">
            Track this bouquet in FloraGrove <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t-hairline border-grove-bloom/20 text-center">
          <p className="font-ui text-grove-cream text-sm font-medium mb-2">{GROVE_BRAND.name}</p>
          <p className="font-ui text-xs text-grove-cream leading-relaxed max-w-md mx-auto">
            {GROVE_BRAND.publicFooterDescription}
          </p>
          <p className="font-ui text-xs text-grove-sage mt-3">Powered by FloraGrove</p>
        </div>
      </div>
    </div>
  );
}
