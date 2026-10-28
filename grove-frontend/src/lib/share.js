import { INVITE } from '../constants/brand';

// Opens the phone's share sheet. Where there is none, copies the invite text and link instead.
// Returns 'shared', 'copied', 'cancelled' or 'failed' so the caller can say what happened.
export async function shareInvite() {
  try {
    if (typeof navigator !== 'undefined' && navigator.share) {
      await navigator.share(INVITE);
      return 'shared';
    }
    await navigator.clipboard.writeText(`${INVITE.text} ${INVITE.url}`);
    return 'copied';
  } catch (e) {
    return e && e.name === 'AbortError' ? 'cancelled' : 'failed';
  }
}
