import { renderKeepsake, saveKeepsake, canvasSupported } from './keepsake';

const WINDOW = { draw_direction: 'S', direction: 'S', season: 'summer', view: 'open', lamp: false };

const fakeContext = () => ({ fillStyle: '', fillRect: jest.fn(), scale: jest.fn() });

afterEach(() => {
  jest.restoreAllMocks();
});

test('renders at four times size, scaled so the room fills it', () => {
  const ctx = fakeContext();
  jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(ctx);
  const canvas = renderKeepsake(WINDOW);
  expect([canvas.width, canvas.height]).toEqual([512, 320]);
  expect(ctx.scale).toHaveBeenCalledWith(4, 4);
  expect(ctx.fillRect).toHaveBeenCalled();
});

test('returns null without a canvas, and says it is not supported', () => {
  jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
  expect(renderKeepsake(WINDOW)).toBeNull();
  expect(canvasSupported()).toBe(false);
});

test('saving makes a png download with the right name and cleans up', () => {
  jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(fakeContext());
  jest.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((cb) => cb(new Blob(['x'], { type: 'image/png' })));
  URL.createObjectURL = jest.fn(() => 'blob:abc');
  URL.revokeObjectURL = jest.fn();
  const anchor = document.createElement('a');
  const click = jest.spyOn(anchor, 'click').mockImplementation(() => {});
  const doc = { createElement: (tag) => (tag === 'a' ? anchor : document.createElement(tag)) };
  expect(saveKeepsake(WINDOW, doc)).toBe(true);
  expect(anchor.download).toBe('my-window-light.png');
  expect(anchor.href).toContain('blob:abc');
  expect(click).toHaveBeenCalledTimes(1);
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:abc');
});

test('saving returns false when the canvas cannot make a blob', () => {
  jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(fakeContext());
  jest.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(undefined);
  Object.defineProperty(HTMLCanvasElement.prototype, 'toBlob', { value: undefined, configurable: true });
  expect(saveKeepsake(WINDOW, document)).toBe(false);
});
