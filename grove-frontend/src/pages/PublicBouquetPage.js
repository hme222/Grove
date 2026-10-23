import React, { useState, useEffect } from 'react';
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
        setError('Bouquet not found');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-grove-bloom/15 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-grove-bloom border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !bouquet) {
    return (
      <div className="min-h-screen bg-grove-bloom/15 flex items-center justify-center">
        <div className="text-center">
          <Flower2 className="h-12 w-12 text-grove-blush opacity-30 mx-auto mb-3" />
          <p className="font-plant text-grove-cream text-xl">{error || 'Not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-grove-bloom/15">
      {/* Header */}
      <div className="bg-grove-canopy border-b-[0.5px] border-grove-bloom/20 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FloraGroveWordmark size={16} />
        </div>
        {bouquet.studio_name && (
          <span className="font-ui text-xs text-grove-blush">{bouquet.studio_name}</span>
        )}
      </div>

      <div className="max-w-[600px] mx-auto px-4 py-6">
        {/* Bouquet info */}
        <div className="text-center mb-6">
          {bouquet.photo_url && (
            <div className="rounded-[14px] overflow-hidden border-[0.5px] border-grove-bloom/20 mb-4">
              <div className="w-full aspect-[4/3] bg-grove-bloom/15 flex items-center justify-center"><img src={getFileUrl(bouquet.photo_url)} alt={bouquet.name} className="w-full h-full object-cover" /></div>
            </div>
          )}
          <h1 className="font-plant text-grove-cream text-2xl">{bouquet.name}</h1>
          {bouquet.occasion && (
            <span className="inline-flex items-center rounded-[20px] border-[0.5px] border-grove-bloom/30 bg-grove-root px-3 py-1 text-xs font-ui text-grove-blush capitalize mt-2">{bouquet.occasion}</span>
          )}
          {bouquet.personal_note && (
            <p className="font-ui text-sm text-grove-cream mt-3 italic">"{bouquet.personal_note}"</p>
          )}
        </div>

        {/* Flowers */}
        {bouquet.flowers?.length > 0 && (
          <div className="mb-6">
            <h2 className="font-plant text-grove-cream text-base mb-3">Flowers in this arrangement</h2>
            <div className="space-y-2">
              {bouquet.flowers.map((f, i) => (
                <div key={i} className="rounded-[14px] border-[0.5px] border-grove-bloom/20 bg-grove-canopy p-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-plant text-grove-cream text-sm">{f.common_name}</p>
                      <p className="font-latin text-xs text-grove-blush">{f.latin_name}</p>
                    </div>
                    <span className="rounded-[20px] border-[0.5px] border-grove-bloom/30 bg-grove-bloom/15 px-2 py-0.5 text-[12px] font-ui text-grove-blush">
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
            <h2 className="font-plant text-grove-cream text-base mb-3">Care Instructions</h2>
            {bouquet.care_plan.immediate_steps?.length > 0 && (
              <div className="rounded-[14px] border-[0.5px] border-grove-bloom/20 bg-grove-canopy p-4 mb-2">
                <h3 className="font-plant text-grove-blush text-xs mb-2">Immediate</h3>
                <ul className="space-y-1">
                  {bouquet.care_plan.immediate_steps.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs font-ui"><span className="text-grove-blush">•</span>{s}</li>
                  ))}
                </ul>
              </div>
            )}
            {bouquet.care_plan.daily_steps?.length > 0 && (
              <div className="rounded-[14px] border-[0.5px] border-grove-bloom/20 bg-grove-canopy p-4">
                <h3 className="font-plant text-grove-blush text-xs mb-2">Daily</h3>
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
          <a href="/register" className="inline-flex items-center gap-1.5 rounded-[12px] font-ui text-xs px-6 py-3 bg-grove-bloom text-grove-root hover:bg-grove-sprout transition-colors">
            Track this bouquet in FloraGrove <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t-[0.5px] border-grove-bloom/20 text-center">
          <p className="font-plant text-grove-cream text-sm mb-2">{GROVE_BRAND.name}</p>
          <p className="font-ui text-xs text-grove-cream leading-relaxed max-w-md mx-auto">
            {GROVE_BRAND.publicFooterDescription}
          </p>
          <p className="font-ui text-xs text-grove-sage mt-3">Powered by FloraGrove</p>
        </div>
      </div>
    </div>
  );
}
