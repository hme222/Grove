let gate;
beforeEach(() => {
  jest.isolateModules(() => { gate = require('./firstRunGate'); });
});

test('only one section tutorial opens per visit', () => {
  expect(gate.claimTutorialSlot()).toBe(true);
  expect(gate.claimTutorialSlot()).toBe(false);
  expect(gate.tutorialSlotTaken()).toBe(true);
});

test('no tutorial opens in the visit where the first care was celebrated', () => {
  gate.markFirstCareThisSession();
  expect(gate.tutorialSlotTaken()).toBe(true);
  expect(gate.claimTutorialSlot()).toBe(false);
});

test('a hold blocks until released, and releasing twice is harmless', () => {
  const release = gate.holdFirstRun();
  expect(gate.isFirstRunBlocking()).toBe(true);
  release();
  release();
  expect(gate.isFirstRunBlocking()).toBe(false);
});
