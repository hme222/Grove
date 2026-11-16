import React, { act, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import SettingsSheet from './SettingsSheet';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let onClose;
let setShowOpener;

function Harness({ initialOpen = false }) {
  const opener = useRef(null);
  const fallback = useRef(null);
  const [open, setOpen] = useState(initialOpen);
  const [showOpener, setShow] = useState(true);
  setShowOpener = setShow;
  return (
    <div>
      <h1 ref={fallback} tabIndex={-1} data-testid="fallback">Profile</h1>
      {showOpener && (
        <button type="button" ref={opener} data-testid="opener" onClick={() => setOpen(true)}>Your home</button>
      )}
      <SettingsSheet
        open={open}
        onClose={() => { onClose(); setOpen(false); }}
        title="Your home"
        testId="home-sheet"
        opener={opener}
        fallbackFocus={fallback}
      >
        <p>Settings go here</p>
      </SettingsSheet>
    </div>
  );
}

const mount = async () => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => { root.render(<Harness />); });
  return { container, done: () => { act(() => root.unmount()); container.remove(); } };
};
const el = (id) => document.querySelector(`[data-testid="${id}"]`);
const tick = (ms = 0) => new Promise((r) => setTimeout(r, ms));
const openIt = async () => {
  await act(async () => { el('opener').focus(); el('opener').click(); });
  await act(async () => {});
};
const pressEscape = async () => {
  await act(async () => { el('home-sheet').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); });
  // Radix hands focus back on a timer after the content unmounts.
  await act(async () => { await tick(); });
};
const pointer = (type, target, clientY) => {
  const e = new MouseEvent(type, { bubbles: true, cancelable: true, clientY, clientX: 10 });
  Object.defineProperty(e, 'pointerId', { value: 1 });
  target.dispatchEvent(e);
};

beforeEach(() => { onClose = jest.fn(); });
afterEach(async () => { await act(async () => { await tick(30); }); });

test('closed until opened', async () => {
  const { done } = await mount();
  expect(el('home-sheet')).toBeNull();
  done();
});

test('when open, focus is on the title', async () => {
  const { done } = await mount();
  await openIt();
  expect(el('home-sheet')).not.toBeNull();
  expect(document.activeElement).toBe(el('home-sheet-title'));
  expect(el('home-sheet-title').textContent).toBe('Your home');
  done();
});

test('the close button is labeled with the title, has a touch target and a focus ring', async () => {
  const { done } = await mount();
  await openIt();
  const close = el('home-sheet-close');
  expect(close.getAttribute('aria-label')).toBe('Close Your home');
  expect(close.className).toContain('h-touch');
  expect(close.className).toContain('w-touch');
  expect(close.className).toContain('focus-visible:ring-2');
  expect(close.className).toContain('focus-visible:ring-grove-lime');
  await act(async () => { close.click(); });
  await act(async () => {});
  expect(onClose).toHaveBeenCalled();
  expect(el('home-sheet')).toBeNull();
  done();
});

test('Escape calls onClose and focus returns to the opener', async () => {
  const { done } = await mount();
  await openIt();
  await pressEscape();
  expect(onClose).toHaveBeenCalledTimes(1);
  expect(el('home-sheet')).toBeNull();
  expect(document.activeElement).toBe(el('opener'));
  done();
});

test('clicking the overlay calls onClose', async () => {
  const { done } = await mount();
  await openIt();
  const overlay = el('home-sheet-overlay');
  await act(async () => {
    overlay.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, cancelable: true, button: 0 }));
    overlay.dispatchEvent(new MouseEvent('pointerup', { bubbles: true, cancelable: true, button: 0 }));
    overlay.click();
  });
  await act(async () => {});
  expect(onClose).toHaveBeenCalled();
  done();
});

test('if the opener was removed, focus goes to fallbackFocus without throwing', async () => {
  const { done } = await mount();
  await openIt();
  await act(async () => { setShowOpener(false); });
  expect(el('opener')).toBeNull();
  await pressEscape();
  expect(onClose).toHaveBeenCalledTimes(1);
  expect(document.activeElement).toBe(el('fallback'));
  done();
});

test('the title and close sit outside the body, and only the body scrolls', async () => {
  const { done } = await mount();
  await openIt();
  const body = el('home-sheet-body');
  expect(body).not.toBeNull();
  expect(body.contains(el('home-sheet-title'))).toBe(false);
  expect(body.contains(el('home-sheet-close'))).toBe(false);
  expect(body.textContent).toContain('Settings go here');
  expect(body.className).toContain('overflow-y-auto');
  const scrollers = el('home-sheet').querySelectorAll('.overflow-y-auto');
  expect(scrollers).toHaveLength(1);
  expect(scrollers[0]).toBe(body);
  expect(el('home-sheet').className).not.toContain('overflow-y-auto');
  done();
});

test('the sheet slides only with motion allowed, and fades with reduced motion', async () => {
  const { done } = await mount();
  await openIt();
  const cls = el('home-sheet').className.split(/\s+/);
  expect(cls).toContain('motion-safe:slide-in-from-bottom');
  expect(cls).toContain('motion-reduce:fade-in');
  expect(cls).not.toContain('slide-in-from-bottom');
  done();
});

test('dragging the handle down more than 80px closes the sheet', async () => {
  const { done } = await mount();
  await openIt();
  const handle = el('home-sheet-handle');
  expect(handle.getAttribute('aria-hidden')).toBe('true');
  await act(async () => { pointer('pointerdown', handle, 100); pointer('pointermove', handle, 150); pointer('pointerup', handle, 150); });
  expect(onClose).not.toHaveBeenCalled();
  expect(el('home-sheet')).not.toBeNull();
  await act(async () => { pointer('pointerdown', handle, 100); pointer('pointermove', handle, 190); pointer('pointerup', handle, 190); });
  await act(async () => {});
  expect(onClose).toHaveBeenCalledTimes(1);
  done();
});

test('dragging the body does not close the sheet', async () => {
  const { done } = await mount();
  await openIt();
  const body = el('home-sheet-body');
  await act(async () => { pointer('pointerdown', body, 100); pointer('pointermove', body, 400); pointer('pointerup', body, 400); });
  expect(onClose).not.toHaveBeenCalled();
  done();
});

test('the back gesture closes the sheet', async () => {
  const { done } = await mount();
  await openIt();
  expect(window.history.state && window.history.state.groveSheet).toBeTruthy();
  await act(async () => { window.history.back(); await tick(20); });
  await act(async () => {});
  expect(onClose).toHaveBeenCalledTimes(1);
  expect(el('home-sheet')).toBeNull();
  expect(window.history.state && window.history.state.groveSheet).toBeFalsy();
  done();
});

test('closing with Escape leaves no extra history entry', async () => {
  const { done } = await mount();
  const stateBefore = window.history.state;
  await openIt();
  expect(window.history.state.groveSheet).toBeTruthy();
  await pressEscape();
  await act(async () => { await tick(20); });
  expect(window.history.state).toEqual(stateBefore);
  expect(onClose).toHaveBeenCalledTimes(1);
  done();
});

test('the sheet is a dialog, so Pip keeps his peek hidden', async () => {
  const { done } = await mount();
  await openIt();
  expect(document.querySelector('[role="dialog"]')).toBe(el('home-sheet'));
  done();
});

test('a bottom fade shows only while the body can still scroll down', async () => {
  const { done } = await mount();
  await openIt();
  const body = el('home-sheet-body');
  expect(el('home-sheet-fade')).toBeNull();
  Object.defineProperty(body, 'scrollHeight', { configurable: true, value: 600 });
  Object.defineProperty(body, 'clientHeight', { configurable: true, value: 300 });
  await act(async () => { body.scrollTop = 0; body.dispatchEvent(new Event('scroll')); });
  const fade = el('home-sheet-fade');
  expect(fade).not.toBeNull();
  expect(fade.className).toContain('pointer-events-none');
  expect(fade.className).toContain('from-transparent');
  expect(fade.className).toContain('to-grove-canopy');
  await act(async () => { body.scrollTop = 300; body.dispatchEvent(new Event('scroll')); });
  expect(el('home-sheet-fade')).toBeNull();
  done();
});
