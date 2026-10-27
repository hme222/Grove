import { ROOM_W } from './drawRoom';

// The room is always shown at the full width of its container. To keep the pixels sharp it is
// drawn into a backing canvas at the largest whole-number multiple of the room that fits the
// container's device pixels (never below 1x). The browser then stretches that canvas the last
// fraction of a step with nearest-neighbor scaling, so it fills the width exactly.
export function backingScale(cssWidth, dpr = 1) {
  const device = (cssWidth || 0) * (dpr > 0 ? dpr : 1);
  return Math.max(1, Math.floor(device / ROOM_W));
}
