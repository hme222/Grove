import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import ShareCardSheet from './ShareCardSheet';

jest.mock('../lib/shareCards', () => {
  const actual = jest.requireActual('../lib/shareCards');
  return {
    ...actual,
    loadFontCss: jest.fn(() => Promise.resolve('')),
    photoDataUrl: jest.fn(() => Promise.resolve('')),
    svgToPngBlob: jest.fn(() => Promise.resolve(new Blob(['x'], { type: 'image/png' }))),
  };
});
jest.mock('@/components/ui/dialog', () => {
  const React = require('react');
  const box = (name) => ({ children }) => React.createElement('div', { 'data-mock': name }, children);
  return {
    Dialog: ({ open, children }) => (open ? React.createElement('div', null, children) : null),
    DialogContent: box('content'),
    DialogHeader: box('header'),
    DialogTitle: ({ children }) => React.createElement('h2', null, children),
    DialogDescription: ({ children }) => React.createElement('p', null, children),
  };
});

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const day = (n) => new Date(Date.now() - n * 86400000).toISOString();
const plant = { id: 'p1', nickname: 'Monty', common_name: 'Monstera', created_at: day(10) };
const withLeaf = [{ id: 'a', action: 'water', logged_at: day(0) }, { id: 'b', action: 'new_leaf', logged_at: day(1) }];

let container;
let root;
const q = (id) => container.querySelector(`[data-testid="${id}"]`);
const flush = () => act(async () => {});
const mount = async (logs) => {
  await act(async () => { root.render(<ShareCardSheet open onClose={() => {}} plant={plant} logs={logs} photoSrc="" />); });
  await flush();
};

beforeAll(() => {
  global.URL.createObjectURL = jest.fn(() => 'blob:x');
  global.URL.revokeObjectURL = jest.fn();
});
beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

describe('ShareCardSheet', () => {
  it('names the plant, previews a card with alt text, and says what is shared', async () => {
    await mount(withLeaf);
    expect(container.querySelector('h2').textContent).toBe('Share Monty');
    expect(q('share-save')).not.toBeNull();
    expect(container.querySelector('[data-testid="share-preview"] img').getAttribute('alt')).toMatch(/day 11 with monty/i);
    expect(container.textContent).toMatch(/never your email or username/i);
  });

  it('offers all five cards when there is a new leaf and care this week', async () => {
    await mount(withLeaf);
    expect(q('share-cards').querySelectorAll('button')).toHaveLength(5);
  });

  it('hides the new-leaf and this-week cards when they would not be true', async () => {
    await mount([]);
    expect(q('share-cards').querySelectorAll('button')).toHaveLength(3);
    expect(container.querySelector('[aria-label="New leaf card"]')).toBeNull();
  });

  it('explains the transparent sticker when it is picked', async () => {
    await mount(withLeaf);
    expect(q('share-transparent-note')).toBeNull();
    await act(async () => { container.querySelector('[aria-label="Sticker card"]').click(); });
    expect(q('share-transparent-note').textContent).toMatch(/paste it onto your own photo/i);
  });

  it('copies the image and says so', async () => {
    const write = jest.fn(() => Promise.resolve());
    Object.defineProperty(global.navigator, 'clipboard', { value: { write }, configurable: true });
    window.ClipboardItem = function ClipboardItem(data) { this.data = data; };
    await mount(withLeaf);
    await act(async () => { q('share-copy').click(); });
    await flush();
    expect(write).toHaveBeenCalled();
    expect(q('share-status').textContent).toMatch(/copied/i);
  });
});
