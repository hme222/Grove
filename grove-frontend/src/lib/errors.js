// What to tell someone when a save fails. A dropped connection and a server fault are not the person's mistake,
// and the message should say nothing was lost. A plain string from the server (a rule they can act on) is passed on.
export function saveErrorMessage(err) {
  const response = err && err.response;
  if (!response) return 'Couldn’t save that. Nothing was lost. Check your connection and try again.';
  const detail = response.data && response.data.detail;
  if (typeof detail === 'string') return detail;
  if (response.status >= 500) return 'Something went wrong on our side. Nothing was lost. Try again in a moment.';
  return 'Couldn’t save that. Check what you entered and try again.';
}
