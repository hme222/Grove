import { sanitizeLessonHtml } from '../../lib/safeHtml';
import React from 'react';
import { ArrowRight } from 'lucide-react';
import { PAPER_BUTTON } from '../../nook/paperStyles';

// The same next button the lesson player uses, for steps that draw their own card footer.
export default function StepNext({ cta, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${PAPER_BUTTON} w-full`}
      data-testid="step-next"
    >
      <span dangerouslySetInnerHTML={{ __html: sanitizeLessonHtml(cta || 'Next') }} />
      <ArrowRight className="h-4 w-4" aria-hidden="true" />
    </button>
  );
}
