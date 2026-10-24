import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationAPI } from '../lib/api';

export const REMINDER_NOTE_KEY = 'grove-reminder-note-seen';

// Said once, after someone has a plant: how many messages to expect, and an equal way to say no.
export default function ReminderNote() {
  const navigate = useNavigate();
  const [show, setShow] = useState(false);

  useEffect(() => {
    let alive = true;
    try { if (window.localStorage.getItem(REMINDER_NOTE_KEY)) return undefined; } catch { /* storage can be blocked */ }
    Promise.resolve(notificationAPI?.getPreferences?.())
      .then((res) => { if (alive && res?.data?.push_care_due) setShow(true); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  const done = () => {
    try { window.localStorage.setItem(REMINDER_NOTE_KEY, '1'); } catch { /* storage can be blocked */ }
    setShow(false);
  };
  const turnOff = async () => {
    try { await notificationAPI.updatePreferences({ push_care_due: false }); } catch { /* the settings page can still change it */ }
    done();
  };

  if (!show) return null;
  const btn = 'min-h-[44px] rounded-[12px] border-[0.5px] px-4 font-ui text-sm';
  return (
    <section aria-label="Reminders" data-testid="reminder-note" className="rounded-[22px] border-[0.5px] border-grove-moss bg-grove-canopy px-5 py-4">
      <p className="font-plant text-lg text-grove-cream">One reminder a day, only when needed</p>
      <p className="mt-1 font-ui text-sm text-grove-sage">We send a single message when plants need a check. You can turn it off any time.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={done} data-testid="reminder-keep" className={`${btn} border-grove-lime bg-grove-lime text-grove-root`}>Sounds good</button>
        <button type="button" onClick={turnOff} data-testid="reminder-off" className={`${btn} border-grove-fernLine text-grove-cream hover:border-grove-lime`}>Turn off</button>
        <button type="button" onClick={() => navigate('/settings/notifications')} className={`${btn} border-transparent text-grove-sage underline underline-offset-2`}>Settings</button>
      </div>
    </section>
  );
}
