import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import PhotoBand from './PhotoBand';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container;
let root;
const mount = (el) => act(() => root.render(el));
const q = (sel) => container.querySelector(sel);

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

describe('PhotoBand', () => {
  test('is decorative by default: empty alt, hidden from screen readers, lazy, reserved ratio', () => {
    mount(<PhotoBand src="/photos/watering-1.jpg" />);
    const img = q('img');
    expect(img.getAttribute('alt')).toBe('');
    expect(img.getAttribute('loading')).toBe('lazy');
    expect(img.getAttribute('decoding')).toBe('async');
    expect(img.getAttribute('src')).toContain('/photos/watering-1.jpg');
    const box = q('[data-testid="photo-band"]');
    expect(box.getAttribute('aria-hidden')).toBe('true');
    expect(box.style.aspectRatio).toBe('2 / 1');
  });

  test('a given alt names the photo for screen readers', () => {
    mount(<PhotoBand src="/photos/watering-1.jpg" alt="A snake plant" aspect="square" />);
    const box = q('[data-testid="photo-band"]');
    expect(box.getAttribute('role')).toBe('img');
    expect(box.getAttribute('aria-label')).toBe('A snake plant');
    expect(box.style.aspectRatio).toBe('1 / 1');
  });

  test('ratio takes a token name and refuses anything else', () => {
    mount(<PhotoBand src="/photos/a.jpg" ratio="band" />);
    expect(q('[data-testid="photo-band"]').style.aspectRatio).toBe('5 / 2');
    mount(<PhotoBand src="/photos/a.jpg" ratio="tall" />);
    expect(q('[data-testid="photo-band"]').style.aspectRatio).toBe('5 / 4');
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => mount(<PhotoBand src="/photos/a.jpg" ratio="5 / 2" />)).toThrow(/unknown ratio/);
    spy.mockRestore();
  });

  test('falls back to the moss tile with a leaf when the picture fails', () => {
    mount(<PhotoBand src="/photos/missing.jpg" />);
    expect(q('[data-testid="photo-fallback"]')).toBeNull();
    act(() => { q('img').dispatchEvent(new Event('error')); });
    expect(q('img')).toBeNull();
    expect(q('[data-testid="photo-fallback"]')).not.toBeNull();
    expect(q('[data-testid="photo-band"]').className).toContain('bg-grove-moss');
  });

  test('shows the fallback with no src, and the scrim only when asked', () => {
    mount(<PhotoBand />);
    expect(q('[data-testid="photo-fallback"]')).not.toBeNull();
    mount(<PhotoBand src="/photos/a.jpg" overlay>Words</PhotoBand>);
    expect(q('[data-testid="photo-overlay"]').textContent).toBe('Words');
    mount(<PhotoBand src="/photos/a.jpg" />);
    expect(q('[data-testid="photo-overlay"]')).toBeNull();
  });

  test('square is a token ratio; fit="contain" letterboxes an illustration on the moss tile', () => {
    mount(<PhotoBand src="/a.png" aspect="square" fit="contain" />);
    expect(q('[data-testid="photo-band"]').style.aspectRatio).toBe('1 / 1');
    expect(q('img').className).toContain('object-contain');
    expect(q('[data-testid="photo-band"]').className).toContain('bg-grove-moss');
    mount(<PhotoBand src="/a.png" ratio="tall" />);
    expect(q('[data-testid="photo-band"]').style.aspectRatio).toBe('5 / 4');
    expect(q('img').className).toContain('object-cover');
  });

  test('onFail fires when the picture cannot load, and the moss tile takes over', () => {
    const onFail = jest.fn();
    mount(<PhotoBand src="/gone.jpg" onFail={onFail} />);
    act(() => { q('img').dispatchEvent(new Event('error')); });
    expect(onFail).toHaveBeenCalledTimes(1);
    expect(q('[data-testid="photo-fallback"]')).not.toBeNull();
  });
});
