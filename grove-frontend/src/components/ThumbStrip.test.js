import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import ThumbStrip from './ThumbStrip';
import PhotoGuideCards from './PhotoGuideCards';
import PlantTiles from '../nook/PlantTiles';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container;
let root;
const mount = (el) => act(() => root.render(el));
const q = (sel) => container.querySelector(sel);
const qa = (sel) => Array.from(container.querySelectorAll(sel));

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

const items = [
  { id: 'a', src: '/a.jpg', label: 'Show photo 1 of 3: Percy' },
  { id: 'b', src: '/b.jpg', label: 'Show photo 2 of 3: Fern' },
  { id: 'c', src: null, label: 'Show photo 3 of 3: Moss' },
];

test('renders one button per item inside a labeled group', () => {
  mount(<ThumbStrip items={items} activeIndex={0} onSelect={() => {}} label="Photos" />);
  expect(q('[data-testid="thumb-strip"]').getAttribute('role')).toBe('group');
  expect(q('[data-testid="thumb-strip"]').getAttribute('aria-label')).toBe('Photos');
  expect(qa('button')).toHaveLength(3);
  expect(qa('button')[1].getAttribute('aria-label')).toBe('Show photo 2 of 3: Fern');
  expect(qa('img').every((img) => img.getAttribute('alt') === '')).toBe(true);
});

test('marks only the active thumb as current', () => {
  mount(<ThumbStrip items={items} activeIndex={1} onSelect={() => {}} />);
  const b = qa('button');
  expect(b[1].getAttribute('aria-current')).toBe('true');
  expect(b[0].hasAttribute('aria-current')).toBe(false);
  expect(b[2].hasAttribute('aria-current')).toBe(false);
});

test('tapping a thumb calls onSelect with its index', () => {
  const onSelect = jest.fn();
  mount(<ThumbStrip items={items} activeIndex={0} onSelect={onSelect} />);
  act(() => qa('button')[2].click());
  expect(onSelect).toHaveBeenCalledWith(2);
});

test('an item without a photo, or with a broken one, shows the leaf tile', () => {
  mount(<ThumbStrip items={items} activeIndex={0} onSelect={() => {}} />);
  expect(qa('[data-testid="thumb-fallback"]')).toHaveLength(1);
  act(() => qa('img')[0].dispatchEvent(new Event('error')));
  expect(qa('[data-testid="thumb-fallback"]')).toHaveLength(2);
});

test('thumbs are real buttons, so Enter and Space activate them', () => {
  mount(<ThumbStrip items={items} activeIndex={0} onSelect={() => {}} />);
  qa('button').forEach((b) => {
    expect(b.tagName).toBe('BUTTON');
    expect(b.getAttribute('type')).toBe('button');
  });
});

test('the paper variant outlines the current thumb in paperGreen', () => {
  mount(<ThumbStrip items={items} activeIndex={0} variant="paper" onSelect={() => {}} />);
  expect(qa('button')[0].className).toContain('outline-grove-paperGreen');
});

test('photo guide cards paginate with thumbnails, not dots', () => {
  mount(<PhotoGuideCards />);
  expect(qa('[data-testid^="photo-guide-dot-"]')).toHaveLength(0);
  expect(qa('[data-testid^="photo-guide-thumbs-thumb-"]')).toHaveLength(6);
  expect(q('[data-testid="photo-guide-prev"]')).not.toBeNull();
  act(() => q('[data-testid="photo-guide-thumbs-thumb-2"]').click());
  expect(q('[data-testid="photo-guide-thumbs-thumb-2"]').getAttribute('aria-current')).toBe('true');
});

test('nook tiles show a thumbnail strip with a tinted leaf for a plant with no photo', () => {
  const plants = [
    { id: 1, name: 'Percy', condition: 'fine', looks_off: false, photo_url: '/p.jpg' },
    { id: 2, name: 'Fern', condition: 'fine', looks_off: false },
  ];
  mount(<PlantTiles plants={plants} onToggleLooksOff={() => {}} />);
  expect(qa('[data-testid^="nook-thumbs-thumb-"]')).toHaveLength(2);
  expect(q('[data-testid="nook-thumbs-thumb-1"] [data-testid="thumb-fallback"]')).not.toBeNull();
  expect(q('[data-testid="nook-thumbs-thumb-0"]').getAttribute('aria-label')).toBe('Show plant 1 of 2: Percy');
  act(() => q('[data-testid="nook-thumbs-thumb-1"]').click());
  expect(q('[data-testid="nook-thumbs-thumb-1"]').getAttribute('aria-current')).toBe('true');
  expect(q('[data-testid="nook-tiles"]')).not.toBeNull();
});
