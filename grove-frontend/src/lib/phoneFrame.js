// On a desktop browser the app is shown inside an iPhone-sized preview so the layout and the status
// bar feel like the phone. Phones, installed apps and the embedded preview itself are never framed.
export const FRAME_KEY = 'grove-phone-frame';
export const PHONE = { width: 390, height: 844, statusBar: 54, homeBar: 34 };

export function frameChoice(search, stored) {
  const p = new URLSearchParams(search || '').get('frame');
  if (p === 'off') return 'off';
  if (p === 'on') return 'on';
  return stored === 'off' ? 'off' : 'on';
}

export function shouldFrame({ embedded, standalone, width, search, stored }) {
  if (embedded || standalone) return false;
  if (width < 900) return false;
  return frameChoice(search, stored) === 'on';
}

export function fitScale(viewportHeight, deviceHeight = PHONE.height + 28) {
  return Math.max(0.5, Math.min(1, (viewportHeight - 96) / deviceHeight));
}

export function clockText(date = new Date()) {
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).replace(/\s?[AP]M$/i, '');
}
