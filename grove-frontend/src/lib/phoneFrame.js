// FloraGrove is a phone app. On a desktop browser it is shown only as an iPhone-sized phone, with no
// full-width layout and no way to turn the frame off. Phones, installed apps and the embedded preview
// itself are never framed.
// FRAME_KEY is the retired "hide the frame" preference; it is cleared if an earlier visit stored one.
export const FRAME_KEY = 'grove-phone-frame';
export const PHONE = { width: 390, height: 844, statusBar: 54, homeBar: 34 };

export function shouldFrame({ embedded, standalone, width }) {
  if (embedded || standalone) return false;
  return width >= 900;
}

export function fitScale(viewportHeight, deviceHeight = PHONE.height + 28) {
  return Math.max(0.5, Math.min(1, (viewportHeight - 96) / deviceHeight));
}

export function clockText(date = new Date()) {
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).replace(/\s?[AP]M$/i, '');
}
