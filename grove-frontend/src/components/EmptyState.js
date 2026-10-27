import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LeafIllustration } from '@/components/illustrations/LeafIllustration';
import { ClusterIllustration } from '@/components/illustrations/ClusterIllustration';
import { BloomIllustration } from '@/components/illustrations/BloomIllustration';
import PhotoBand from '@/components/PhotoBand';

const illustrations = {
  leaf: LeafIllustration,
  cluster: ClusterIllustration,
  bloom: BloomIllustration,
};

export function EmptyState({ config }) {
  const navigate = useNavigate();
  const IllustrationComponent = illustrations[config.illustration] || illustrations.leaf;

  const handleCta = () => {
    if (config.ctaPath) {
      navigate(config.ctaPath);
    }
  };

  return (
    <div
      className={`rounded-card border-hairline border-grove-moss bg-grove-moss text-left max-w-md mx-auto ${config.photo ? 'overflow-hidden' : 'p-5'}`}
      data-testid="empty-state"
    >
      {config.photo && <PhotoBand src={config.photo} className="rounded-none" ratio="band" />}
      <div className={`flex flex-col items-center gap-4 ${config.photo ? 'p-5' : ''}`}>
        {!config.photo && <IllustrationComponent className="opacity-60" />}
        <div className="space-y-2 text-center">
          <h3 className="font-plant text-base font-semibold text-grove-cream">{config.heading}</h3>
          <p className="text-sm text-grove-cream">{config.body}</p>
        </div>
        {config.cta && (
          <Button
            onClick={handleCta}
            data-testid="empty-state-cta"
            
          >
            {config.cta}
          </Button>
        )}
      </div>
    </div>
  );
}
