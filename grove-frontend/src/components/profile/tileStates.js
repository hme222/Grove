import { LESSON_META } from '../../lessons/lessonMeta';
import { showDailyTrivia } from '../../lib/dailyTrivia';
import { careTextMode } from '../../lib/careCopy';

// The one-line state under each Profile tile, read from the saved user (and the notification preferences, once loaded).
export function tileStates(user, { pipOn = false, peeksPref = false, notifPrefs = null, zipZone = false } = {}) {
  const seen = (user && user.tutorials_seen) || [];
  const lessonIds = Object.keys(LESSON_META);
  const done = lessonIds.filter((id) => seen.includes(`lesson:${id}`)).length;

  const pets = user?.has_pets === true ? 'Pets at home' : user?.has_pets === false ? 'No pets' : 'Pets not set';
  const hemisphere = user?.hemisphere === 'north' ? 'Northern' : user?.hemisphere === 'south' ? 'Southern' : 'Hemisphere not set';
  const zone = zipZone && user?.hardiness_zone ? ` · Zone ${user.hardiness_zone}` : '';

  let notifications = 'Reminders and quiet hours';
  if (notifPrefs && typeof notifPrefs === 'object') {
    notifications = notifPrefs.push_care_due ? 'Daily care check on' : 'Daily care check off';
  }

  return {
    lessons: `${done} of ${lessonIds.length} done`,
    tutorials: user?.tooltips_enabled === false ? 'Tooltips off' : 'Tooltips on',
    careStyle: `${careTextMode(user) === 'detailed' ? 'Detailed tips' : 'Simple tips'}${showDailyTrivia(user) ? ' · Daily tip on' : ''}`,
    home: `${pets} · ${hemisphere}${zone}`,
    pip: !pipOn ? 'Off' : peeksPref ? 'On · peeks in' : 'On · no peeks',
    notifications,
  };
}

export default tileStates;
