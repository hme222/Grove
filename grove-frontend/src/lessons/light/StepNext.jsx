import React from 'react';
import { ArrowRight } from 'lucide-react';

// The same next button the lesson player uses, for steps that draw their own card footer.
export default function StepNext({ cta, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full min-h-[44px] flex items-center justify-center gap-2 rounded-[2px] font-plant uppercase tracking-[0.08em] text-xs px-4 py-3 border-[0.5px] bg-[#1C2E10] text-[#F5F0E8] border-[#1C2E10] hover:bg-[#2D5016]"
      data-testid="step-next"
    >
      <span dangerouslySetInnerHTML={{ __html: cta || 'Next' }} />
      <ArrowRight className="h-4 w-4" aria-hidden="true" />
    </button>
  );
}
