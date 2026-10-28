import { shareInvite } from './share';
import { INVITE } from '../constants/brand';

afterEach(() => {
  delete navigator.share;
  delete navigator.clipboard;
});

test('uses the share sheet when the phone has one', async () => {
  navigator.share = jest.fn().mockResolvedValue();
  expect(await shareInvite()).toBe('shared');
  expect(navigator.share).toHaveBeenCalledWith(INVITE);
});

test('copies the text and link when there is no share sheet', async () => {
  Object.defineProperty(navigator, 'clipboard', { value: { writeText: jest.fn().mockResolvedValue() }, configurable: true });
  expect(await shareInvite()).toBe('copied');
  expect(navigator.clipboard.writeText).toHaveBeenCalledWith(`${INVITE.text} ${INVITE.url}`);
});

test('closing the share sheet is not a failure', async () => {
  navigator.share = jest.fn().mockRejectedValue(Object.assign(new Error('x'), { name: 'AbortError' }));
  expect(await shareInvite()).toBe('cancelled');
});

test('says so when neither works', async () => {
  expect(await shareInvite()).toBe('failed');
});
