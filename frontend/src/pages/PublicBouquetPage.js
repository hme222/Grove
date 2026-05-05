import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { bouquetAPI } from '../lib/api';
import { getFileUrl } from '../lib/api';
import { Flower2, Leaf, ExternalLink } from 'lucide-react';
import { GROVE_BRAND } from '@/constants/brand';

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
      <div className="min-h-screen bg-[#FBEAF0] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#D4537E] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !bouquet) {
    return (
      <div className="min-h-screen bg-[#FBEAF0] flex items-center justify-center">
        <div className="text-center">
          <Flower2 className="h-12 w-12 text-[#D4537E] opacity-30 mx-auto mb-3" />
          <p className="font-plant text-[#1C2E10] text-xl">{error || 'Not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBEAF0]">
      {/* Header */}
      <div className="bg-white border-b-[0.5px] border-[#D4537E]/20 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Leaf className="h-5 w-5 text-[#3B6D11]" />
          <span className="font-plant text-[#1C2E10] text-sm tracking-[0.12em]">Grove</span>
        </div>
        {bouquet.studio_name && (
          <span className="font-ui text-[10px] text-[#D4537E]">{bouquet.studio_name}</span>
        )}
      </div>

      <div className="max-w-[600px] mx-auto px-4 py-6">
        {/* Bouquet info */}
        <div className="text-center mb-6">
          {bouquet.photo_url && (
            <div className="rounded-[14px] overflow-hidden border-[0.5px] border-[#D4537E]/20 mb-4">
              <div className="w-full aspect-[4/3] bg-[#FDF5F8] flex items-center justify-center"><img src={getFileUrl(bouquet.photo_url)} alt={bouquet.name} className="max-w-full max-h-full w-auto h-auto object-contain" /></div>
            </div>
          )}
          <h1 className="font-plant text-[#1C2E10] text-2xl">{bouquet.name}</h1>
          {bouquet.occasion && (
            <span className="inline-flex items-center rounded-[20px] border-[0.5px] border-[#D4537E]/30 bg-white px-3 py-1 text-xs font-ui text-[#D4537E] capitalize mt-2">{bouquet.occasion}</span>
          )}
          {bouquet.personal_note && (
            <p className="font-ui text-sm text-[#2B2B26] mt-3 italic">"{bouquet.personal_note}"</p>
          )}
        </div>

        {/* Flowers */}
        {bouquet.flowers?.length > 0 && (
          <div className="mb-6">
            <h2 className="font-plant text-[#1C2E10] text-base mb-3">Flowers in this arrangement</h2>
            <div className="space-y-2">
              {bouquet.flowers.map((f, i) => (
                <div key={i} className="rounded-[14px] border-[0.5px] border-[#D4537E]/20 bg-white p-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-plant text-[#1C2E10] text-sm">{f.common_name}</p>
                      <p className="font-latin text-[10px] text-[#D4537E]">{f.latin_name}</p>
                    </div>
                    <span className="rounded-[20px] border-[0.5px] border-[#D4537E]/30 bg-[#FBEAF0] px-2 py-0.5 text-[9px] font-ui text-[#D4537E]">
                      {f.vase_life_days}d life
                    </span>
                  </div>
                  {f.care_instructions && (
                    <p className="font-ui text-xs text-[#2B2B26] mt-2">{f.care_instructions}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Care plan */}
        {bouquet.care_plan && (
          <div className="mb-6">
            <h2 className="font-plant text-[#1C2E10] text-base mb-3">Care Instructions</h2>
            {bouquet.care_plan.immediate_steps?.length > 0 && (
              <div className="rounded-[14px] border-[0.5px] border-[#D4537E]/20 bg-white p-4 mb-2">
                <h3 className="font-plant text-[#D4537E] text-xs mb-2">Immediate</h3>
                <ul className="space-y-1">
                  {bouquet.care_plan.immediate_steps.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs font-ui"><span className="text-[#D4537E]">•</span>{s}</li>
                  ))}
                </ul>
              </div>
            )}
            {bouquet.care_plan.daily_steps?.length > 0 && (
              <div className="rounded-[14px] border-[0.5px] border-[#D4537E]/20 bg-white p-4">
                <h3 className="font-plant text-[#D4537E] text-xs mb-2">Daily</h3>
                <ul className="space-y-1">
                  {bouquet.care_plan.daily_steps.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs font-ui"><span className="text-[#D4537E]">•</span>{s}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* CTA */}
        <div className="text-center mt-8 mb-4">
          <a href="/register" className="inline-flex items-center gap-1.5 rounded-[2px] font-plant uppercase tracking-[0.08em] text-xs px-6 py-3 bg-[#D4537E] text-white hover:bg-[#b8446a] transition-colors">
            Track this bouquet in Grove <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t-[0.5px] border-[#D4537E]/20 text-center">
          <p className="font-plant text-[#1C2E10] text-sm mb-2">{GROVE_BRAND.name}</p>
          <p className="font-ui text-xs text-[#2B2B26] leading-relaxed max-w-md mx-auto">
            {GROVE_BRAND.publicFooterDescription}
          </p>
          <p className="font-ui text-[10px] text-[#D3C9B8] mt-3">Powered by Grove</p>
        </div>
      </div>
    </div>
  );
}
