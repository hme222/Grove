import { ROOM_W } from './drawRoom';

// The nook is scaled by whole numbers only, never smaller than 2x.
export function integerScale(width) {
  return Math.max(2, Math.floor((width || 0) / ROOM_W));
}
