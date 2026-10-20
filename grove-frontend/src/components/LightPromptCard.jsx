import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { lightAPI } from '../lib/api';
import { lessonPath } from '../lessons/lessonMeta';

const button =
  'min-h-[44px] rounded-[2px] font-plant uppercase tracking-[0.08em] text-xs px-4 py-3 border-[0.5px]';

// A quiet, one-time prompt on Care Today for people who said "I'll check at noon" in a light
// lesson. It shows only around midday, and once dismissed it never returns.
export default function LightPromptCard({ now = new Date() }) {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [hidden, setHidden] = useState(false);
  const busy = useRef(false);

  const hour = now.getHours();
  const midday = hour >= 11 && hour < 15;
  if (hidden || !user || !user.light_prompt_pending || user.light_prompt_dismissed || !midday) return null;

  // Where they left off: no shadow test and no window yet means Part 1, otherwise Part 2.
  const target = user.window_sun || user.light_reading ? 'window-map' : 'light-basics';

  const dismiss = async () => {
    if (busy.current) return;
    busy.current = true;
    setHidden(true);
    if (updateUser) updateUser({ light_prompt_pending: false, light_prompt_dismissed: true });
    try {
      await lightAPI.prompt('dismiss');
    } catch (_e) {
      // The card is already gone for now. It will not show again after the next save.
    }
  };

  return (
    <section
      className="rounded-[14px] border-[0.5px] border-[#D3C9B8] bg-[#FDFAF6] p-4 mb-3 flex items-center justify-between gap-3"
      data-testid="light-prompt"
    >
      <p className="font-plant text-[#1C2E10] text-lg">Ready to check your light?</p>
      <div className="flex gap-2 shrink-0">
        <button
          type="button"
          onClick={dismiss}
          className={`${button} border-[#D3C9B8] text-[#1C2E10]`}
          data-testid="light-prompt-dismiss"
        >
          Not today
        </button>
        <button
          type="button"
          onClick={() => navigate(lessonPath(target))}
          className={`${button} bg-[#1C2E10] text-[#F5F0E8] border-[#1C2E10]`}
          data-testid="light-prompt-go"
        >
          Check now
        </button>
      </div>
    </section>
  );
}
