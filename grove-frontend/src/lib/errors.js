// What to tell someone when a save fails. A dropped connection and a server fault are not the person's mistake,
// and the message should say nothing was lost. A plain string from the server is passed on only when it is a rule the
// person can act on ("Free tier limited to 15 plants."). A missing route (404), a wrong method, a sign-in failure or a
// server fault never shows its own words ("Not Found").
const NEVER_SHOWN = new Set([401, 404, 405]);

export function saveErrorMessage(err, { fallback } = {}) {
  const response = err && err.response;
  if (!response) return 'Couldn’t save that. Nothing was lost. Check your connection and try again.';
  const detail = response.data && response.data.detail;
  if (typeof detail === 'string' && response.status < 500 && !NEVER_SHOWN.has(response.status)) return detail;
  if (response.status >= 500 || response.status === 404 || response.status === 405) {
    return fallback || 'Something went wrong on our side. Nothing was lost. Try again in a moment.';
  }
  return 'Couldn’t save that. Check what you entered and try again.';
}

// The same rule for an action that is not a form save: "Couldn’t post that. Nothing was lost. Check your connection and try again."
export function actionErrorMessage(err, what) {
  const response = err && err.response;
  if (!response) return `Couldn’t ${what}. Nothing was lost. Check your connection and try again.`;
  const detail = response.data && response.data.detail;
  if (typeof detail === 'string' && response.status < 500 && !NEVER_SHOWN.has(response.status)) return detail;
  if (response.status >= 500 || NEVER_SHOWN.has(response.status)) return `Couldn’t ${what}. That’s on our side. Try again in a moment.`;
  return `Couldn’t ${what}. Check what you entered and try again.`;
}
