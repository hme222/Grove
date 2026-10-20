import { drawRoom, ROOM_W, ROOM_H } from '../../nook/drawRoom';
import { lessonView } from './lessonView';

// A picture of the room lit the person's way, for people who did not turn the nook on.
// Drawn off screen at `scale` times the room's size, so it is sharp when saved.
export function renderKeepsake(window, scale = 4) {
  const canvas = document.createElement('canvas');
  canvas.width = ROOM_W * scale;
  canvas.height = ROOM_H * scale;
  const ctx = canvas.getContext && canvas.getContext('2d');
  if (!ctx) return null;
  ctx.scale(scale, scale);
  drawRoom(ctx, lessonView(window), 0);
  return canvas;
}

export function canvasSupported() {
  try {
    return !!document.createElement('canvas').getContext('2d');
  } catch (_e) {
    return false;
  }
}

// Starts a download of the picture. Returns false when this device cannot make one.
export function saveKeepsake(window, doc = document) {
  const canvas = renderKeepsake(window);
  if (!canvas || typeof canvas.toBlob !== 'function') return false;
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = doc.createElement('a');
    link.href = url;
    link.download = 'my-window-light.png';
    link.click();
    URL.revokeObjectURL(url);
  }, 'image/png');
  return true;
}
