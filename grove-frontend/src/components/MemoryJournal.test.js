import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import MemoryJournal, { buildJournal } from './MemoryJournal';

jest.mock('../lib/api', () => ({ getFileUrl: (p) => p }));

global.IS_REACT_ACT_ENVIRONMENT = true;

function mount(ui) {
  const el = document.createElement('div');
  document.body.appendChild(el);
  const root = createRoot(el);
  act(() => root.render(ui));
  return { el, unmount: () => { act(() => root.unmount()); el.remove(); } };
}

const plant = { id: 'p1', nickname: 'Rudy', common_name: 'Rubber plant', created_at: '2026-09-02T10:00:00Z' };
const logs = [
  { id: 'a', action: 'water', logged_at: '2026-10-02T09:00:00Z' },
  { id: 'b', action: 'water', logged_at: '2026-10-09T09:00:00Z' },
  { id: 'c', action: 'feed', logged_at: '2026-10-10T09:00:00Z' },
  { id: 'd', action: 'photo', logged_at: '2026-09-05T09:00:00Z', photo_url: '/x.jpg', notes: 'New leaf!' },
  { id: 'e', action: 'photo', logged_at: '2026-10-12T09:00:00Z', photo_url: '/y.jpg' },
  { id: 'f', action: 'note', logged_at: '2026-10-14T09:00:00Z', notes: 'Leaves are perking up.' },
];

describe('buildJournal', () => {
  const months = buildJournal(logs, plant);

  test('groups by month, newest first', () => {
    expect(months.map((m) => m.key)).toEqual(['2026-10', '2026-09']);
  });

  test('folds routine care into one sentence per month', () => {
    expect(months[0].summary).toBe('You watered twice and fed once.');
    expect(months[1].summary).toBe('');
  });

  test('marks only the earliest photo as the first photo', () => {
    const photos = months.flatMap((m) => m.items).filter((i) => i.type === 'photo');
    expect(photos.filter((p) => p.first).map((p) => p.id)).toEqual(['d']);
  });

  test('keeps notes as their own entries and adds a welcome milestone', () => {
    const items = months.flatMap((m) => m.items);
    expect(items.some((i) => i.type === 'note' && i.id === 'f')).toBe(true);
    expect(items.some((i) => i.type === 'milestone' && i.title === 'Welcome home')).toBe(true);
  });

  test('ignores entries with a bad date', () => {
    expect(() => buildJournal([{ id: 'z', action: 'water', logged_at: 'nope' }], plant)).not.toThrow();
  });
});

describe('MemoryJournal', () => {
  test('shows a warm empty state', () => {
    const { el, unmount } = mount(<MemoryJournal logs={[]} plant={plant} />);
    expect(el.querySelector('[data-testid="timeline-empty"]').textContent).toContain('Rudy\u2019s story starts here.');
    unmount();
  });

  test('renders month headings as headings and photos with alt text', () => {
    const { el, unmount } = mount(<MemoryJournal logs={logs} plant={plant} />);
    const headings = [...el.querySelectorAll('h2')].map((h) => h.textContent);
    expect(headings).toEqual(['October', 'September']);
    expect(el.querySelector('img[alt="New leaf!"]')).not.toBeNull();
    unmount();
  });
});
