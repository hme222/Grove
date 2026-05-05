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

export function EmptyState({ config, currentStreak }) {
  const navigate = useNavigate();
  const IllustrationComponent = illustrations[config.illustration] || illustrations.leaf;

  const handleCta = () => {
    if (config.ctaPath) {
      navigate(config.ctaPath);
    }
  };

  return (
    <div
      className="rounded-[14px] border-[0.5px] border-[#D3C9B8] bg-[#EAF3DE] p-6 text-left max-w-md mx-auto"
      data-testid="empty-state"
    >
      <div className="flex flex-col items-center gap-4">
        <IllustrationComponent className="opacity-60" />
        <div className="space-y-2 text-center">
          <h3 className="font-plant text-lg text-[#1C2E10]">{config.heading}</h3>
          <p className="text-sm text-[#2B2B26]">{config.body}</p>
          {config.streakProgress && currentStreak !== undefined && (
            <p className="text-xs font-mono uppercase tracking-[0.12em] text-[#3B6D11] mt-3">
              Current Streak: {currentStreak} / 30 days
            </p>
          )}
        </div>
        {config.cta && (
          <Button
            onClick={handleCta}
            data-testid="empty-state-cta"
            className="rounded-[2px] font-[Georgia] uppercase tracking-[0.08em] text-xs px-4 py-3 bg-[#1C2E10] text-[#F5F0E8] border-[0.5px] border-[#1C2E10] hover:bg-[#2D5016] hover:border-[#2D5016] transition-colors duration-150"
          >
            {config.cta}
          </Button>
        )}
      </div>
    </div>
  );
}
