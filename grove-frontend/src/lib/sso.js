// Apple and Google sign-in. Each provider's own script runs in the browser and hands back an ID token,
// which the server checks. The scripts load only when someone taps the button, and only when the
// server says the provider is on (GET /auth/config), so with the flags off nothing here runs.
// Needs the provider credentials on the server; not yet exercised against the real providers.

const loaded = {};

function loadScript(src) {
  if (!loaded[src]) {
    loaded[src] = new Promise((resolve, reject) => {
      const el = document.createElement('script');
      el.src = src;
      el.async = true;
      el.onload = resolve;
      el.onerror = () => { delete loaded[src]; reject(new Error('script')); };
      document.head.appendChild(el);
    });
  }
  return loaded[src];
}

export const CANCELLED = 'cancelled';

async function googleToken(clientId) {
  await loadScript('https://accounts.google.com/gsi/client');
  return new Promise((resolve, reject) => {
    const gsi = window.google && window.google.accounts && window.google.accounts.id;
    if (!gsi) { reject(new Error('google')); return; }
    gsi.initialize({
      client_id: clientId,
      callback: (res) => (res && res.credential ? resolve({ idToken: res.credential }) : reject(new Error(CANCELLED))),
      cancel_on_tap_outside: true,
    });
    gsi.prompt((note) => {
      if (note.isNotDisplayed && (note.isNotDisplayed() || note.isSkippedMoment())) reject(new Error(CANCELLED));
    });
  });
}

async function appleToken(clientId, redirectUri) {
  await loadScript('https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js');
  const apple = window.AppleID && window.AppleID.auth;
  if (!apple) throw new Error('apple');
  apple.init({ clientId, scope: 'name email', redirectURI: redirectUri, usePopup: true });
  try {
    const res = await apple.signIn();
    const first = res.user && res.user.name ? `${res.user.name.firstName || ''} ${res.user.name.lastName || ''}`.trim() : '';
    return { idToken: res.authorization.id_token, name: first || undefined };
  } catch (e) {
    throw new Error(e && e.error === 'popup_closed_by_user' ? CANCELLED : 'apple');
  }
}

// Resolves to { idToken, name? }. Rejects with Error('cancelled') when the person closed the prompt.
export function getProviderToken(provider, config) {
  if (provider === 'google') return googleToken(config.client_id);
  return appleToken(config.client_id, config.redirect_uri);
}
