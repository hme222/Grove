import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import TutorialsSheetBody from './TutorialsSheetBody';
import { userAPI } from '../../lib/api';
import { toast } from 'sonner';

jest.mock('../../lib/api', () => ({ userAPI: { updateMe: jest.fn(), replayTutorial: jest.fn() } }));
jest.mock('sonner', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));
const Icon = () => <svg />;
jest.mock('../SectionTutorial', () => ({
  TUTORIAL_COPY: {
    collection: { title: 'Welcome to Plants', icon: Icon, accent: '#fff' },
    care: { title: 'Welcome to Care', icon: Icon, accent: '#fff' },
  },
}));
const mockResetAll = jest.fn();
jest.mock('../../contexts/TooltipContext', () => ({
  useTooltips: () => ({ tooltipsActive: false, daysRemaining: 0, resetAll: mockResetAll }),
}));
let mockUser;
const mockUpdateUser = jest.fn();
const applyPatch = (patch) => { mockUser = { ...mockUser, ...patch }; };
const mockRefresh = jest.fn();
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: mockUser, updateUser: mockUpdateUser, refreshUser: mockRefresh }),
}));

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let container; let root;
const q = (id) => container.querySelector(`[data-testid="${id}"]`);
const mount = async () => { await act(async () => { root.render(<TutorialsSheetBody />); }); };
beforeEach(() => {
  mockUser = { tooltips_enabled: true, tutorials_seen: ['care'] };
  mockUpdateUser.mockReset().mockImplementation(applyPatch);
  [mockResetAll, mockRefresh, toast.success, toast.error].forEach((f) => f.mockClear());
  userAPI.updateMe.mockReset().mockResolvedValue({});
  userAPI.replayTutorial.mockReset().mockResolvedValue({});
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => { act(() => root.unmount()); container.remove(); });

test('has the tooltips switch and one replay button per tutorial', async () => {
  await mount();
  expect(q('profile-tooltips-toggle')).not.toBeNull();
  expect(q('profile-replay-collection')).not.toBeNull();
  expect(q('profile-replay-care')).not.toBeNull();
});

test('a failed tooltips save puts the switch back and shows Try again', async () => {
  userAPI.updateMe.mockRejectedValue(new Error('offline'));
  await mount();
  await act(async () => { q('profile-tooltips-toggle').click(); });
  expect(mockUpdateUser).toHaveBeenNthCalledWith(1, { tooltips_enabled: false });
  expect(mockUser.tooltips_enabled).toBe(true);
  expect(q('tooltips-error').textContent).toContain('Try again');
  expect(q('profile-tooltips-toggle').getAttribute('aria-describedby')).toContain('tooltips-error');
  expect(toast.error).not.toHaveBeenCalled();
});

test('turning tooltips back on also resets the dismissed list', async () => {
  mockUser = { tooltips_enabled: false, tutorials_seen: [] };
  await mount();
  await act(async () => { q('profile-tooltips-toggle').click(); });
  expect(userAPI.updateMe).toHaveBeenCalledWith({ tooltips_enabled: true });
  expect(mockResetAll).toHaveBeenCalled();
});

test('replay keeps its toast', async () => {
  await mount();
  await act(async () => { q('profile-replay-care').click(); });
  expect(userAPI.replayTutorial).toHaveBeenCalledWith('care');
  expect(toast.success).toHaveBeenCalled();
});
