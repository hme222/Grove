import React, { useRef, useState } from 'react';
import { toast } from 'sonner';
import { RotateCcw } from 'lucide-react';
import SwitchRow from '../SwitchRow';
import SaveError from './SaveError';
import useInstantSave from './useInstantSave';
import { TUTORIAL_COPY } from '../SectionTutorial';
import { useAuth } from '../../contexts/AuthContext';
import { useTooltips } from '../../contexts/TooltipContext';
import { userAPI } from '../../lib/api';
import { actionErrorMessage } from '../../lib/errors';
import { tint } from '../../lib/color';

// Body of the "Tutorials and tips" sheet: the tooltips switch (saves instantly) and a replay button per section tutorial.
export default function TutorialsSheetBody() {
  const { user, updateUser, refreshUser } = useAuth();
  const { tooltipsActive, daysRemaining, resetAll } = useTooltips();
  const tips = useInstantSave();
  const tipsRef = useRef(null);
  const [replayingId, setReplayingId] = useState(null);

  const tooltipsOn = user?.tooltips_enabled !== false;
  const seen = user?.tutorials_seen || [];

  const toggleTooltips = () => {
    const previous = tooltipsOn;
    const next = !previous;
    tips.run(
      () => updateUser({ tooltips_enabled: next }),
      async () => {
        await userAPI.updateMe({ tooltips_enabled: next });
        // When re-enabling, also wipe the dismissed list so the hints show again.
        if (next) await resetAll();
      },
      () => updateUser({ tooltips_enabled: previous }),
    );
  };

  const handleReplay = async (tutorialId) => {
    setReplayingId(tutorialId);
    try {
      await userAPI.replayTutorial(tutorialId);
      if (refreshUser) await refreshUser();
      toast.success(`${TUTORIAL_COPY[tutorialId].title} will show next time you open it`);
    } catch (err) {
      toast.error(actionErrorMessage(err, 'replay the tutorial'));
    } finally {
      setReplayingId(null);
    }
  };

  return (
    <>
      <div>
        <SwitchRow
          label="Show tooltips"
          help={tooltipsActive
            ? `${daysRemaining} day${daysRemaining === 1 ? '' : 's'} of training-wheel hints left.`
            : tooltipsOn
              ? 'Auto-hidden after your first 30 days. Turn on to bring them back.'
              : 'Turn on to see contextual hints again.'}
          checked={!!tooltipsOn}
          disabled={tips.busy}
          onChange={toggleTooltips}
          testId="profile-tooltips-toggle"
          describedBy={tips.error ? 'tooltips-error' : undefined}
          buttonRef={tipsRef}
        />
        <SaveError id="tooltips-error" error={tips.error} onRetry={tips.retry} testId="tooltips-error" focusAfter={tipsRef} />
      </div>

      <div className="mt-4 pt-4 border-t-hairline border-grove-moss">
        <p className="font-ui text-grove-cream text-xs font-medium mb-2">Replay a section tutorial</p>
        <div className="space-y-1.5">
          {Object.keys(TUTORIAL_COPY).map((tid) => {
            const meta = TUTORIAL_COPY[tid];
            const Icon = meta.icon;
            const wasSeen = seen.includes(tid);
            return (
              <button
                key={tid}
                type="button"
                onClick={() => handleReplay(tid)}
                disabled={replayingId === tid}
                data-testid={`profile-replay-${tid}`}
                className="w-full flex items-center gap-3 rounded-small border-hairline border-grove-moss bg-grove-canopy px-4 py-3 hover:border-grove-fernLine disabled:opacity-50 transition-colors duration-150"
              >
                <span
                  className="w-8 h-8 rounded-inset flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: tint(meta.accent, 20) }}
                >
                  <Icon className="h-4 w-4" style={{ color: meta.accent }} aria-hidden="true" />
                </span>
                <span className="flex-1 min-w-0 text-left">
                  <span className="font-ui text-xs font-medium text-grove-cream block">{meta.title}</span>
                  <span className="font-ui text-xs text-grove-sage block">
                    {wasSeen ? 'Tap to replay' : 'Not seen yet'}
                  </span>
                </span>
                <RotateCcw className="h-3 w-3 text-grove-sage" aria-hidden="true" />
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
