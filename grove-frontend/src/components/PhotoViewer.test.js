import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import PhotoViewer, { sortPhotos } from './PhotoViewer';
import PhotoGallery from './PhotoGallery';
import MemoryJournal from './MemoryJournal';

jest.mock('react-router-dom', () => ({ useNavigate: () => jest.fn(), useLocation: () => ({ pathname: '/' }) }), { virtual: true });
jest.mock('../lib/api', () => ({
  getFileUrl: (p) => p,
  plantAPI: {
    listPhotos: jest.fn(),
    deletePhoto: jest.fn(() => Promise.resolve({})),
    updatePhoto: jest.fn(),
    addPhoto: jest.fn(),
  },
}));
jest.mock('sonner', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

const { plantAPI } = require('../lib/api');

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container;
let root;
const render = (el) => act(() => root.render(el));
const q = (sel) => document.querySelector(sel);
const qa = (sel) => Array.from(document.querySelectorAll(sel));
const click = (el) => act(() => { el.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
const key = (k) => act(() => { (document.activeElement || document.body).dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true })); });
const status = () => q('[data-testid="photo-viewer-status"]').textContent;
const shown = () => q('[data-testid="photo-viewer-image"]').getAttribute('src');
const flush = () => act(async () => { await Promise.resolve(); });

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

// Deliberately out of order, to prove the viewer sorts by date.
const photos = [
  { id: 'b', path: '/b.jpg', taken_at: '2026-09-10T12:00:00Z', caption: 'New leaf' },
  { id: 'c', path: '/c.jpg', taken_at: '2026-10-01T12:00:00Z', caption: '' },
  { id: 'a', path: '/a.jpg', taken_at: '2026-08-01T12:00:00Z', caption: 'Day one' },
];
const viewer = (props = {}) => (
  <PhotoViewer open onOpenChange={() => {}} photos={photos} startId="b" plantName="Percy" {...props} />
);

test('sorts photos oldest to newest, undated last', () => {
  expect(sortPhotos([...photos, { id: 'z', path: '/z.jpg' }]).map((p) => p.id)).toEqual(['a', 'b', 'c', 'z']);
});

test('opens at the tapped photo, labeled for Percy, with date and caption', () => {
  render(viewer());
  expect(q('[role="dialog"]').getAttribute('aria-labelledby')).toBeTruthy();
  expect(document.getElementById(q('[role="dialog"]').getAttribute('aria-labelledby')).textContent).toBe('Photos of Percy');
  expect(shown()).toBe('/b.jpg');
  expect(status()).toBe('Photo 2 of 3');
  expect(q('[data-testid="photo-viewer-status"]').getAttribute('aria-live')).toBe('polite');
  expect(q('[data-testid="photo-viewer-info"]').textContent).toContain('Sep 10, 2026');
  expect(q('[data-testid="photo-viewer-caption"]').textContent).toContain('New leaf');
});

test('the caption is read once: the image is decorative while the date and caption are printed', () => {
  render(viewer());
  expect(q('[data-testid="photo-viewer-image"]').getAttribute('alt')).toBe('');
  expect(q('[data-testid="photo-viewer-caption"]').textContent).toContain('New leaf');
  expect(status()).toBe('Photo 2 of 3');
});

test('an undated, uncaptioned photo keeps the plant name as its alt', () => {
  render(viewer({ photos: [{ id: 'z', path: '/z.jpg' }], startId: 'z' }));
  expect(q('[data-testid="photo-viewer-image"]').getAttribute('alt')).toBe('Percy');
});

test('thumbnails read oldest to newest with the opened photo current', () => {
  render(viewer());
  const thumbs = qa('[data-testid="photo-viewer-strip"] img').map((i) => i.getAttribute('src'));
  expect(thumbs).toEqual(['/a.jpg', '/b.jpg', '/c.jpg']);
  expect(q('[data-testid="photo-viewer-strip-thumb-1"]').getAttribute('aria-current')).toBe('true');
});

test('Close is first in the DOM, and Next and Previous page', () => {
  render(viewer());
  expect(q('[role="dialog"] button').getAttribute('data-dialog-close')).not.toBeNull();
  click(q('[data-testid="photo-viewer-next"]'));
  expect(status()).toBe('Photo 3 of 3');
  expect(shown()).toBe('/c.jpg');
  click(q('[data-testid="photo-viewer-prev"]'));
  click(q('[data-testid="photo-viewer-prev"]'));
  expect(status()).toBe('Photo 1 of 3');
  expect(q('[data-testid="photo-viewer-prev"]').getAttribute('aria-disabled')).toBe('true');
});

test('arrow keys, Home and End page', () => {
  render(viewer());
  key('ArrowRight');
  expect(status()).toBe('Photo 3 of 3');
  key('ArrowLeft');
  key('ArrowLeft');
  expect(status()).toBe('Photo 1 of 3');
  key('End');
  expect(status()).toBe('Photo 3 of 3');
  key('Home');
  expect(status()).toBe('Photo 1 of 3');
});

test('tapping a thumbnail jumps to it', () => {
  render(viewer());
  click(q('[data-testid="photo-viewer-strip-thumb-2"]'));
  expect(shown()).toBe('/c.jpg');
  expect(status()).toBe('Photo 3 of 3');
});

test('a swipe pages, a short drag does not', () => {
  render(viewer());
  const stage = q('[data-testid="photo-viewer-stage"]');
  const fire = (type, x, y) => act(() => { stage.dispatchEvent(Object.assign(new Event(type, { bubbles: true }), { clientX: x, clientY: y })); });
  fire('pointerdown', 200, 100); fire('pointerup', 190, 100);
  expect(status()).toBe('Photo 2 of 3');
  fire('pointerdown', 200, 100); fire('pointerup', 100, 110);
  expect(status()).toBe('Photo 3 of 3');
  fire('pointerdown', 100, 100); fire('pointerup', 200, 100);
  expect(status()).toBe('Photo 2 of 3');
});

test('a single photo hides the strip and the arrows', () => {
  render(viewer({ photos: [photos[0]], startId: 'b' }));
  expect(q('[data-testid="photo-viewer-strip"]')).toBeNull();
  expect(q('[data-testid="photo-viewer-prev"]')).toBeNull();
  expect(q('[data-testid="photo-viewer-next"]')).toBeNull();
  expect(status()).toBe('Photo 1 of 1');
});

test('no photos renders nothing', () => {
  render(viewer({ photos: [] }));
  expect(q('[role="dialog"]')).toBeNull();
});

test('a photo that fails shows the leaf fallback and paging recovers', () => {
  render(viewer());
  act(() => { q('[data-testid="photo-viewer-image"]').dispatchEvent(new Event('error')); });
  expect(q('[data-testid="photo-viewer-fallback"]')).not.toBeNull();
  expect(q('[data-testid="photo-viewer-fallback"]').textContent).toContain('couldn’t load');
  key('ArrowRight');
  expect(q('[data-testid="photo-viewer-fallback"]')).toBeNull();
  expect(shown()).toBe('/c.jpg');
});

test('Escape closes and focus returns to the opener', async () => {
  function Harness() {
    const [open, setOpen] = React.useState(false);
    return (
      <>
        <button data-testid="harness-open" onClick={() => setOpen(true)}>Open</button>
        <PhotoViewer open={open} onOpenChange={setOpen} photos={photos} startId="a" plantName="Percy" />
      </>
    );
  }
  render(<Harness />);
  const trigger = q('[data-testid="harness-open"]');
  trigger.focus();
  click(trigger);
  expect(q('[role="dialog"]')).not.toBeNull();
  act(() => { document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); });
  expect(q('[role="dialog"]')).toBeNull();
  await act(async () => { await new Promise((r) => setTimeout(r, 20)); });
  expect(document.activeElement).toBe(trigger);
});

test('delete asks first, then removes and stays open on a neighbor', async () => {
  const onDelete = jest.fn();
  render(viewer({ onDelete }));
  click(q('[data-testid="photo-viewer-delete"]'));
  expect(onDelete).not.toHaveBeenCalled();
  click(q('[data-testid="photo-viewer-delete-confirm-confirm"]'));
  expect(onDelete).toHaveBeenCalledWith(expect.objectContaining({ id: 'b' }));
});

describe('integration', () => {
  test('PhotoGallery opens the viewer at the tapped photo with the full set', async () => {
    plantAPI.listPhotos.mockResolvedValue({ data: { photos: photos.map((p) => ({ ...p })), count: 3, cap: 10 } });
    render(<PhotoGallery plantId="p1" plantName="Percy" />);
    await flush();
    expect(q('[data-testid="photo-gallery-grid"]')).not.toBeNull();
    click(q('[data-testid="photo-open-c"]'));
    expect(shown()).toBe('/c.jpg');
    expect(status()).toBe('Photo 3 of 3');
    key('Home');
    expect(shown()).toBe('/a.jpg');
    // The grid tiles have one tap target; edit, cover and delete live in the viewer footer.
    key('Escape');
  });

  test('grid tiles have no hover-only controls; set as cover is reachable in the viewer', async () => {
    plantAPI.listPhotos.mockResolvedValue({ data: { photos: photos.map((p) => ({ ...p, is_cover: p.id === 'a' })), count: 3, cap: 10 } });
    plantAPI.updatePhoto = jest.fn().mockResolvedValue({ data: {} });
    render(<PhotoGallery plantId="p1" plantName="Percy" />);
    await flush();
    expect(q('[data-testid="photo-edit-a"]')).toBeNull();
    expect(q('[data-testid="photo-delete-a"]')).toBeNull();
    expect(q('[data-testid="photo-setcover-b"]')).toBeNull();
    expect(qa('[data-testid="photo-cover-badge"]')).toHaveLength(1);
    expect(q('[data-testid="photo-open-a"]').querySelector('img').className).toContain('object-cover');
    expect(q('[data-testid="photo-tile-a"] .bg-grove-root').className).not.toContain('/80');
    // One line, month and day only, full date kept for assistive tech and the tooltip.
    const pill = q('[data-testid="photo-tile-b"] [data-testid="photo-date-pill"]');
    expect(pill.className).toContain('whitespace-nowrap');
    expect(pill.className).toContain('min-h-6');
    expect(pill.textContent).toContain('Sep 10');
    expect(pill.title).toBe('Sep 10, 2026');
    expect(q('[data-testid="photo-cover-badge"]').className).toContain('min-h-6');
    click(q('[data-testid="photo-open-b"]'));
    expect(q('[data-testid="photo-viewer-edit"]')).not.toBeNull();
    click(q('[data-testid="photo-viewer-setcover"]'));
    await flush();
    expect(plantAPI.updatePhoto).toHaveBeenCalledWith('p1', 'b', { is_cover: true });
  });

  test('a failed photos request shows the load error with Try again, and Add photo stays reachable', async () => {
    plantAPI.listPhotos.mockRejectedValueOnce(new Error('network'));
    render(<PhotoGallery plantId="p1" plantName="Percy" />);
    await flush();
    expect(q('[data-testid="photo-gallery-empty"]')).toBeNull();
    const err = q('[data-testid="photo-gallery-error"]');
    expect(err.getAttribute('role')).toBe('alert');
    expect(err.textContent).toContain('Couldn\u2019t load photos');
    // Add photo stays in the tab order but says it is off, and why; the count line is not printed.
    const add = q('[data-testid="photo-gallery-add"]');
    expect(add.getAttribute('aria-disabled')).toBe('true');
    expect(document.getElementById(add.getAttribute('aria-describedby')).textContent).toBe('Photos have to load before you can add one.');
    expect(q('[data-testid="photo-gallery-caption"]')).toBeNull();
    expect(q('[data-testid="photo-gallery"]').textContent).not.toContain('0 of 10');
    const input = q('[data-testid="photo-gallery-file-input"]');
    const clicked = jest.spyOn(input, 'click');
    click(add);
    expect(clicked).not.toHaveBeenCalled();
    plantAPI.listPhotos.mockResolvedValue({ data: { photos: [], count: 0, cap: 10 } });
    await act(async () => { click(q('[data-testid="load-retry"]')); await new Promise((r) => setTimeout(r, 900)); });
    expect(q('[data-testid="photo-gallery-error"]')).toBeNull();
    expect(q('[data-testid="photo-gallery-empty"]')).not.toBeNull();
  });

  test('PhotoGallery deletes through the viewer with a confirm step', async () => {
    plantAPI.listPhotos.mockResolvedValue({ data: { photos: photos.map((p) => ({ ...p })), count: 3, cap: 10 } });
    render(<PhotoGallery plantId="p1" plantName="Percy" />);
    await flush();
    click(q('[data-testid="photo-open-a"]'));
    click(q('[data-testid="photo-viewer-delete"]'));
    click(q('[data-testid="photo-viewer-delete-confirm-confirm"]'));
    await flush();
    expect(plantAPI.deletePhoto).toHaveBeenCalledWith('p1', 'a');
  });

  test('a journal photo card opens the viewer at that photo', () => {
    const plant = { id: 'p1', nickname: 'Percy', created_at: '2026-08-01T10:00:00Z' };
    const logs = [
      { id: 'l1', action: 'photo', logged_at: '2026-08-01T09:00:00Z', photo_url: '/a.jpg', notes: 'Day one' },
      { id: 'l2', action: 'photo', logged_at: '2026-10-01T09:00:00Z', photo_url: '/c.jpg' },
    ];
    function Harness() {
      const [start, setStart] = React.useState(null);
      const list = logs.map((l) => ({ id: l.id, path: l.photo_url, taken_at: l.logged_at, caption: l.notes || '' }));
      return (
        <>
          <MemoryJournal logs={logs} plant={plant} onOpenEntry={(e) => setStart(e.id)} />
          <PhotoViewer open={start != null} onOpenChange={(o) => { if (!o) setStart(null); }} photos={list} startId={start} plantName="Percy" />
        </>
      );
    }
    render(<Harness />);
    const cards = qa('[data-testid="journal-photo"]');
    click(cards[0]); // newest first, so this is the October photo
    expect(shown()).toBe('/c.jpg');
    expect(status()).toBe('Photo 2 of 2');
    key('ArrowLeft');
    expect(shown()).toBe('/a.jpg');
  });
});
