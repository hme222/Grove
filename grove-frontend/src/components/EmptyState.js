import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LeafIllustration } from '@/components/illustrations/LeafIllustration';
import { ClusterIllustration } from '@/components/illustrations/ClusterIllustration';
import { BloomIllustration } from '@/components/illustrations/BloomIllustration';

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
      className="rounded-card border-hairline border-grove-moss bg-grove-moss p-5 text-left max-w-md mx-auto"
      data-testid="empty-state"
    >
      <div className="flex flex-col items-center gap-4">
        <IllustrationComponent className="opacity-60" />
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
