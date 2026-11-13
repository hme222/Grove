import React, { act } from 'react';
import { createRoot } from 'react-dom/client';

let mockPath = '/plants';
jest.mock('react-router-dom', () => ({ useNavigate: () => jest.fn(), useLocation: () => ({ pathname: mockPath }) }), { virtual: true });
jest.mock('./NotificationBell', () => ({ __esModule: true, default: () => <span data-testid="bell" /> }));
jest.mock('./BackButton', () => ({ __esModule: true, default: () => null }));
jest.mock('./PhotoBand', () => ({ __esModule: true, default: () => null }));

import { PageHeader } from './PageHeader';
import { HelpSheetContext } from './help/helpSheetContext';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const show = async (props, sheet) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  const header = <PageHeader title="Plants" {...props} />;
  await act(async () => { root.render(sheet ? <HelpSheetContext.Provider value={sheet}>{header}</HelpSheetContext.Provider> : header); });
  return { container, done: () => { act(() => root.unmount()); container.remove(); } };
};
const btn = (c) => c.querySelector('[data-testid="header-help-button"]');

beforeEach(() => { mockPath = '/plants'; });

test('the Help button shows with the sheet available, and opens it', async () => {
  const open = jest.fn();
  const { container, done } = await show({}, { open });
  expect(btn(container)).not.toBeNull();
  expect(btn(container).getAttribute('aria-label')).toBe('Help with a plant');
  await act(async () => { btn(container).click(); });
  expect(open).toHaveBeenCalledTimes(1);
  done();
});

test('no Help button without a sheet, on the help page, or where the bell is hidden', async () => {
  let m = await show({});
  expect(btn(m.container)).toBeNull();
  m.done();
  mockPath = '/help-my-plant';
  m = await show({}, { open: jest.fn() });
  expect(btn(m.container)).toBeNull();
  m.done();
  mockPath = '/plants';
  m = await show({ hideBell: true }, { open: jest.fn() });
  expect(btn(m.container)).toBeNull();
  m.done();
});
