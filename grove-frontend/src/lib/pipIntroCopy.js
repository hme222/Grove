// What Pip says when he introduces himself. One place, so the onboarding screen and the first-visit card say the same thing.
// While the plan is being built, Pip says hello in a few words. The turn-off choice comes later, on the first visit to Today.
export const PIP_LOADING = {
  line: 'Hi, I’m Pip, your plant helper. While I put your plan together: I’ll point out when a plant needs attention and where to find help.',
  note: 'You can turn me off any time in Profile.',
};

export const PIP_INTRO = {
  title: 'Meet Pip',
  body: 'Hi, I’m Pip. I’ll point out when a plant needs attention and where to find help. You can turn me off any time in Profile.',
  agree: 'Nice to meet you',
  off: 'Turn me off',
  error: 'Couldn’t save that. Try again.',
  spriteLabel: 'Pip, a small pixel plant in a pot',
};

// "Nice to meet you" only records the hello. "Turn me off" records it and switches Pip off.
export const introPatch = (turnOff) => (turnOff ? { pip_introduced: true, pip_enabled: false } : { pip_introduced: true });
