import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import fs from 'fs';
import path from 'path';
import { Onboarding, firstName } from './Onboarding';
import { authAPI, userAPI, zoneAPI, lessonAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { PLAN_QUESTIONS } from '@/constants/onboardingQuiz';
import { suggestEmail, looksLikeEmail, nameFromEmail } from '@/lib/emailSuggest';

jest.mock('react-router-dom', () => ({ useNavigate: () => jest.fn() }), { virtual: true });
jest.mock('@/lib/api', () => ({
  authAPI: { config: jest.fn(), sso: jest.fn(), sendConfirmation: jest.fn(), changeEmail: jest.fn() },
  userAPI: { updateMe: jest.fn() },
  zoneAPI: { lookup: jest.fn() },
  lessonAPI: { submitPlan: jest.fn() },
}));
jest.mock('@/contexts/AuthContext', () => ({ useAuth: jest.fn() }));
jest.mock('./WelcomeScreen', () => ({
  WelcomeScreen: ({ onContinue, showSkip }) => (
    <div data-testid="onboarding-welcome">
      <button type="button" onClick={onContinue} data-testid="welcome-continue">Continue</button>
      {showSkip && <button type="button" data-testid="welcome-skip">Skip</button>}
    </div>
  ),
}));

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container;
let root;
let auth;
const q = (id) => container.querySelector(`[data-testid="${id}"]`);
const text = () => container.textContent;
const click = (el) => act(async () => { el.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
const flush = () => act(async () => { await Promise.resolve(); });
const type = (el, value) => act(async () => {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  setter.call(el, value);
  el.dispatchEvent(new Event('input', { bubbles: true }));
});

const mount = async (props = {}) => {
  const onComplete = props.onComplete || jest.fn();
  await act(async () => {
    root.render(<Onboarding onComplete={onComplete} {...props} />);
  });
  await flush();
  return onComplete;
};

const OFF = { email_verification: false, sso: { google: { enabled: false }, apple: { enabled: false } } };
const ON = {
  email_verification: true,
  sso: { google: { enabled: true, client_id: 'g' }, apple: { enabled: true, client_id: 'a', redirect_uri: 'https://x' } },
};

beforeEach(() => {
  jest.clearAllMocks();
  authAPI.config.mockResolvedValue({ data: OFF });
  userAPI.updateMe.mockImplementation((data) => Promise.resolve({ data: { ...data } }));
  zoneAPI.lookup.mockResolvedValue({ data: { zone: '7b', source: 'zip-prefix', description: '5 to 10°F', hemisphere: 'north' } });
  lessonAPI.submitPlan.mockResolvedValue({
    data: { primary_track: 'rescue', queue: ['plant-er', 'soil-finger-test'], matched: [{ question: 'q1', answer: 'gift' }], plan_answers: { q1: 'gift' } },
  });
  auth = { user: null, updateUser: jest.fn(), fetchUser: jest.fn(), register: jest.fn(), acceptSession: jest.fn() };
  useAuth.mockImplementation(() => auth);
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

// ---------- signed out: welcome, three intro slides, account ----------

const toAccount = async () => {
  await click(q('welcome-continue'));
  await click(q('onboarding-continue'));
  await click(q('onboarding-continue'));
  await click(q('onboarding-continue'));
};

test('a signed-out visitor sees the welcome with a way to sign in and no skip that needs an account', async () => {
  await mount();
  expect(q('onboarding-welcome')).not.toBeNull();
  expect(q('welcome-skip')).toBeNull();
  expect(q('welcome-signin').getAttribute('href')).toBe('/login');
});

test('the three intro slides move on and carry no day-7 or day-30 promise', async () => {
  await mount();
  await click(q('welcome-continue'));
  expect(text()).toContain('Welcome to FloraGrove');
  expect(text()).toContain('1 of 3');
  await click(q('onboarding-continue'));
  expect(text()).toContain('Track care, not metrics');
  await click(q('onboarding-continue'));
  expect(text()).toContain('Each plant has a story');
  expect(text()).not.toMatch(/day 7|day 30|7 days|30 days|unlock/i);
  await click(q('onboarding-continue'));
  expect(q('onboarding-account')).not.toBeNull();
});

test('skipping the intro as a signed-out visitor goes to the account step', async () => {
  await mount();
  await click(q('welcome-continue'));
  await click(q('onboarding-skip'));
  expect(q('onboarding-account')).not.toBeNull();
});

test('the account step says Step 1 of 3 and puts focus on its headline', async () => {
  await mount();
  await toAccount();
  expect(q('onboarding-progress').textContent).toBe('Step 1 of 3 · Your account');
  expect(document.activeElement).toBe(q('onboarding-heading'));
});

test('with the flags off there is no Apple or Google button and no "or" divider', async () => {
  await mount();
  await toAccount();
  expect(q('sso-buttons')).toBeNull();
  expect(q('sso-apple')).toBeNull();
  expect(q('sso-google')).toBeNull();
  expect(text()).not.toMatch(/Continue with/);
});

test('a failed config fetch behaves like flags off', async () => {
  authAPI.config.mockRejectedValue(new Error('down'));
  await mount();
  await toAccount();
  expect(q('sso-buttons')).toBeNull();
  expect(q('signup-submit')).not.toBeNull();
});

test('with the flags on both provider buttons appear', async () => {
  authAPI.config.mockResolvedValue({ data: ON });
  await mount();
  await toAccount();
  expect(q('sso-apple').textContent).toBe('Continue with Apple');
  expect(q('sso-google').textContent).toBe('Continue with Google');
});

test('a provider that is off is not drawn while the other is', async () => {
  authAPI.config.mockResolvedValue({ data: { ...ON, sso: { ...ON.sso, apple: { enabled: false } } } });
  await mount();
  await toAccount();
  expect(q('sso-apple')).toBeNull();
  expect(q('sso-google')).not.toBeNull();
});

test('an email that looks incomplete is explained and a fix is offered, nothing is sent', async () => {
  await mount();
  await toAccount();
  await type(q('signup-email'), 'maya@gmail');
  await type(q('signup-password'), 'secret1');
  await click(q('signup-submit'));
  expect(auth.register).not.toHaveBeenCalled();
  expect(q('signup-email').getAttribute('aria-invalid')).toBe('true');
  expect(text()).toContain('That email looks incomplete.');
  expect(q('signup-email-suggestion').textContent).toBe('maya@gmail.com');
  await click(q('signup-email-suggestion'));
  expect(q('signup-email').value).toBe('maya@gmail.com');
});

test('a short password is refused with a reason', async () => {
  await mount();
  await toAccount();
  await type(q('signup-email'), 'maya@gmail.com');
  await type(q('signup-password'), '123');
  await click(q('signup-submit'));
  expect(text()).toContain('Use at least 6 characters.');
  expect(auth.register).not.toHaveBeenCalled();
});

test('the password can be shown and hidden', async () => {
  await mount();
  await toAccount();
  expect(q('signup-password').type).toBe('password');
  await click(q('signup-password-toggle'));
  expect(q('signup-password').type).toBe('text');
});

test('creating an account sends no username, uses the first name from the email, and with verification off goes to the zone step', async () => {
  auth.register.mockResolvedValue({ user: { id: 'u', onboarding_complete: false } });
  await mount();
  await toAccount();
  await type(q('signup-email'), 'maya.r88@gmail.com');
  await type(q('signup-password'), 'secret1');
  await click(q('signup-submit'));
  await flush();
  expect(auth.register).toHaveBeenCalledWith(undefined, 'maya.r88@gmail.com', 'secret1', 'Maya');
  expect(q('onboarding-zone')).not.toBeNull();
  expect(q('onboarding-progress').textContent).toBe('Step 2 of 3 · Your space');
});

test('with verification on, a new unconfirmed account is sent to the check-your-email screen', async () => {
  authAPI.config.mockResolvedValue({ data: ON });
  auth.register.mockResolvedValue({ user: { id: 'u', email: 'maya@gmail.com', email_confirmed: false, onboarding_complete: false } });
  await mount();
  await toAccount();
  await type(q('signup-email'), 'maya@gmail.com');
  await type(q('signup-password'), 'secret1');
  await click(q('signup-submit'));
  await flush();
  expect(q('onboarding-check-email')).not.toBeNull();
  expect(text()).toContain('Not there? Check spam.');
  expect(q('use-different-email')).not.toBeNull();
  expect(q('confirm-later')).not.toBeNull();
});

test('an email that is already registered offers sign in, and stays on the step', async () => {
  auth.register.mockRejectedValue({ response: { data: { detail: 'Email already registered' } } });
  await mount();
  await toAccount();
  await type(q('signup-email'), 'maya@gmail.com');
  await type(q('signup-password'), 'secret1');
  await click(q('signup-submit'));
  await flush();
  expect(q('signup-form-error').textContent).toContain('Email already registered');
  expect(q('signup-form-error').textContent).toContain('Sign in instead');
  expect(q('onboarding-account')).not.toBeNull();
});

test('Open email app opens a picker that Escape closes', async () => {
  authAPI.config.mockResolvedValue({ data: ON });
  const created = { id: 'u', email: 'maya@gmail.com', email_confirmed: false, onboarding_complete: false };
  auth.register.mockImplementation(async () => { auth.user = created; return { user: created }; });
  await mount();
  await toAccount();
  await type(q('signup-email'), 'maya@gmail.com');
  await type(q('signup-password'), 'secret1');
  await click(q('signup-submit'));
  await flush();
  await click(q('open-email-app'));
  expect(q('email-app-picker')).not.toBeNull();
  expect(q('email-app-gmail')).not.toBeNull();
  await act(async () => { document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); });
  expect(q('email-app-picker')).toBeNull();
});

// ---------- signed in: zone, hemisphere, questions, plan ----------

const signedIn = (extra = {}) => { auth.user = { id: 'u', display_name: 'Maya', ...extra }; };

test('a signed-in person starts after the account step, at the zone step', async () => {
  signedIn();
  await mount();
  expect(q('onboarding-zone')).not.toBeNull();
  expect(q('zone-continue').disabled).toBe(true);
  expect(text()).toContain('US zip codes only for now');
});

test('a found zip shows the zone as an estimate, saves, and does not ask for the hemisphere', async () => {
  signedIn();
  await mount();
  await type(q('zone-zip'), '10019');
  await flush();
  expect(q('zone-found').textContent).toContain('Zone 7b');
  expect(q('zone-found').textContent).toContain('estimate');
  userAPI.updateMe.mockResolvedValueOnce({ data: { hemisphere: 'north', hardiness_zone: '7b' } });
  await click(q('zone-continue'));
  await flush();
  expect(userAPI.updateMe).toHaveBeenCalledWith({ location_country: 'US', location_postcode: '10019' });
  expect(q('onboarding-hemisphere')).toBeNull();
  expect(q('onboarding-quiz-intro')).not.toBeNull();
});

test('a zip that is not found says so, blocks Continue, and never shows a zone', async () => {
  signedIn();
  zoneAPI.lookup.mockResolvedValue({ data: { zone: null, source: null, hemisphere: null } });
  await mount();
  await type(q('zone-zip'), '00000');
  await flush();
  expect(q('zone-missing').textContent).toContain('Zip not found');
  expect(q('zone-found')).toBeNull();
  expect(q('zone-continue').disabled).toBe(true);
  expect(q('zone-zip').getAttribute('aria-invalid')).toBe('true');
});

test('a zip we can place but have no zone for is saved without showing a zone', async () => {
  signedIn();
  zoneAPI.lookup.mockResolvedValue({ data: { zone: '6a', source: 'state-default', hemisphere: 'north' } });
  await mount();
  await type(q('zone-zip'), '10019');
  await flush();
  expect(q('zone-known')).not.toBeNull();
  expect(q('zone-found')).toBeNull();
  expect(q('zone-continue').disabled).toBe(false);
});

test('the zip field takes digits only, five at most', async () => {
  signedIn();
  await mount();
  await type(q('zone-zip'), '10a0-19999');
  expect(q('zone-zip').value).toBe('10019');
});

test('a lookup that fails still lets the zip be saved', async () => {
  signedIn();
  zoneAPI.lookup.mockRejectedValue(new Error('offline'));
  await mount();
  await type(q('zone-zip'), '10019');
  await flush();
  expect(q('zone-unchecked')).not.toBeNull();
  expect(q('zone-continue').disabled).toBe(false);
});

test('skipping the zip asks the hemisphere once, with the reason, and saves the choice', async () => {
  signedIn();
  await mount();
  await click(q('zone-skip'));
  expect(userAPI.updateMe).not.toHaveBeenCalled();
  expect(q('onboarding-hemisphere')).not.toBeNull();
  expect(text()).toContain('The seasons run the other way in the south');
  expect(document.activeElement).toBe(q('onboarding-heading'));
  await click(q('hemisphere-south'));
  await flush();
  expect(userAPI.updateMe).toHaveBeenCalledWith({ hemisphere: 'south' });
  expect(q('onboarding-quiz-intro')).not.toBeNull();
});

test('the hemisphere can be skipped too, and is not asked when it is already known', async () => {
  signedIn();
  await mount();
  await click(q('zone-skip'));
  await click(q('hemisphere-skip'));
  expect(userAPI.updateMe).not.toHaveBeenCalled();
  expect(q('onboarding-quiz-intro')).not.toBeNull();
  act(() => root.unmount());
  root = createRoot(container);
  signedIn({ hemisphere: 'south' });
  await mount();
  await click(q('zone-skip'));
  expect(q('onboarding-hemisphere')).toBeNull();
  expect(q('onboarding-quiz-intro')).not.toBeNull();
});

const toQuestions = async () => {
  signedIn({ hemisphere: 'north' });
  const onComplete = await mount();
  await click(q('zone-skip'));
  await click(q('quiz-intro-start'));
  return onComplete;
};

test('the quiz intro says why it asks and offers to skip all of it', async () => {
  signedIn({ hemisphere: 'north' });
  await mount();
  await click(q('zone-skip'));
  expect(q('onboarding-progress').textContent).toBe('Step 3 of 3 · Your plant style');
  expect(text()).toContain('Skip any question you like');
  expect(q('quiz-intro-skip')).not.toBeNull();
});

test('each question says why it is asked, needs a pick for Next, and can be skipped', async () => {
  await toQuestions();
  expect(q('question-count').textContent).toBe('Question 1 of 4');
  expect(q('question-why').textContent).toMatch(/^Why we ask:/);
  expect(q('question-next').disabled).toBe(true);
  expect(q('question-skip')).not.toBeNull();
  expect(document.activeElement).toBe(q('onboarding-heading'));
  await click(q('option-q1-gift'));
  expect(q('option-q1-gift').getAttribute('aria-checked')).toBe('true');
  expect(q('question-next').disabled).toBe(false);
});

test('every option is a 44px-high radio and the last button says See my plan', async () => {
  await toQuestions();
  PLAN_QUESTIONS[0].options.forEach((o) => {
    const el = q(`option-q1-${o.id}`);
    expect(el.getAttribute('role')).toBe('radio');
    expect(el.className).toContain('min-h-touch');
  });
  for (let i = 0; i < 3; i += 1) await click(q('question-skip'));
  expect(q('question-next').textContent).toBe('See my plan');
});

test('Back returns to the previous question with its answer kept', async () => {
  await toQuestions();
  await click(q('option-q1-gift'));
  await click(q('question-next'));
  expect(q('question-count').textContent).toBe('Question 2 of 4');
  await click(q('onboarding-back'));
  expect(q('question-count').textContent).toBe('Question 1 of 4');
  expect(q('option-q1-gift').getAttribute('aria-checked')).toBe('true');
});

test('answers are sent once at the end, a skipped question is left out, and the plan quotes what was said', async () => {
  const onComplete = await toQuestions();
  await click(q('option-q1-gift'));
  await click(q('question-next'));
  await click(q('option-q2-feel_guilty'));
  await click(q('question-skip')); // skipping clears Q2
  await click(q('option-q3-save_gift'));
  await click(q('question-next'));
  await click(q('option-q4-know_basics'));
  await click(q('question-next'));
  expect(lessonAPI.submitPlan).toHaveBeenCalledTimes(1);
  expect(lessonAPI.submitPlan).toHaveBeenCalledWith({ q1: 'gift', q3: 'save_gift', q4: 'know_basics' });
  await act(async () => { await new Promise((r) => setTimeout(r, 700)); });
  expect(q('onboarding-plan')).not.toBeNull();
  expect(q('plan-lesson-title').textContent).toBe('Plant ER');
  expect(q('plan-because').textContent).toContain('I got one as a gift');
  expect(q('plan-then').textContent).toContain('Soil Finger-Test');
  expect(text()).toContain('Welcome, Maya');
  expect(auth.updateUser).toHaveBeenCalledWith({ primary_track: 'rescue' });
  userAPI.updateMe.mockClear();
  await click(q('plan-start'));
  await flush();
  expect(userAPI.updateMe).toHaveBeenCalledWith({ onboarding_complete: true });
  expect(onComplete).toHaveBeenCalledWith({ to: '/lessons/plant-er', planned: true });
});

test('skipping every question still builds a plan and says the questions were skipped', async () => {
  signedIn({ hemisphere: 'north' });
  lessonAPI.submitPlan.mockResolvedValue({ data: { primary_track: 'rebirth', queue: ['soil-finger-test', 'plant-parent-reset'], matched: [], plan_answers: {} } });
  const onComplete = await mount();
  await click(q('zone-skip'));
  await click(q('quiz-intro-skip'));
  expect(lessonAPI.submitPlan).toHaveBeenCalledWith({});
  await act(async () => { await new Promise((r) => setTimeout(r, 700)); });
  expect(q('plan-lesson-title').textContent).toBe('Soil Finger-Test');
  expect(q('plan-because').textContent).toContain('You skipped the questions');
  await click(q('plan-explore'));
  await flush();
  expect(onComplete).toHaveBeenCalledWith({ planned: true });
});

test('if the plan cannot be saved the screen says so, offers Try again and a way out', async () => {
  signedIn({ hemisphere: 'north' });
  lessonAPI.submitPlan.mockRejectedValueOnce(new Error('network'));
  const onComplete = await mount();
  await click(q('zone-skip'));
  await click(q('quiz-intro-skip'));
  await flush();
  expect(q('building-error').textContent).toContain("We couldn't save your answers");
  await click(q('building-retry'));
  expect(lessonAPI.submitPlan).toHaveBeenCalledTimes(2);
  await act(async () => { await new Promise((r) => setTimeout(r, 700)); });
  expect(q('onboarding-plan')).not.toBeNull();
  expect(onComplete).not.toHaveBeenCalled();
});

test('a person signed in with an unfinished replay can skip the intro to finish', async () => {
  signedIn();
  const onComplete = await mount({ replay: true });
  expect(q('onboarding-welcome')).not.toBeNull();
  await click(q('welcome-continue'));
  await click(q('onboarding-skip'));
  await flush();
  expect(userAPI.updateMe).toHaveBeenCalledWith({ onboarding_complete: true });
  expect(onComplete).toHaveBeenCalledWith(undefined);
});

// ---------- small things ----------

test('the quiz ids match the ids the server maps to tracks', () => {
  const py = fs.readFileSync(path.resolve(__dirname, '../../../grove-backend/tracks.py'), 'utf8');
  const block = py.slice(py.indexOf('PLAN_QUESTIONS = {'), py.indexOf('def resolve_plan'));
  PLAN_QUESTIONS.forEach((question) => {
    const start = block.indexOf(`"${question.id}": {`);
    expect(start).toBeGreaterThan(-1);
    const end = block.indexOf('},', start);
    const ids = [...block.slice(start, end).matchAll(/"([a-z_]+)": (?:"[a-z_]+"|None)/g)].map((m) => m[1]).filter((id) => id !== question.id);
    expect(question.options.map((o) => o.id).sort()).toEqual(ids.sort());
  });
});

test('every question has four to six options, a reason, and sentence-case text', () => {
  PLAN_QUESTIONS.forEach((question) => {
    expect(question.why).toMatch(/^Why we ask: /);
    expect(question.options).toHaveLength(6);
  });
});

test('the flow source holds no raw colour and no day-7 promise', () => {
  const dir = path.resolve(__dirname, 'onboarding');
  const files = [path.resolve(__dirname, 'Onboarding.js'), ...fs.readdirSync(dir).map((f) => path.join(dir, f))];
  files.forEach((file) => {
    const src = fs.readFileSync(file, 'utf8');
    expect(src).not.toMatch(/#[0-9a-fA-F]{6}\b/);
    expect(src).not.toMatch(/day 7|day 30|feed unlocks/i);
  });
});

test('email helpers', () => {
  expect(suggestEmail('maya@gmail')).toBe('maya@gmail.com');
  expect(suggestEmail('maya@Yahoo')).toBe('maya@yahoo.com');
  expect(suggestEmail('maya@company')).toBeNull();
  expect(suggestEmail('maya@gmail.com')).toBeNull();
  expect(looksLikeEmail('maya@gmail.com')).toBe(true);
  expect(looksLikeEmail('maya@gmail')).toBe(false);
  expect(looksLikeEmail('maya gmail.com')).toBe(false);
  expect(nameFromEmail('maya.r88@gmail.com')).toBe('Maya');
  expect(nameFromEmail('x1@y.com')).toBe('');
  expect(nameFromEmail('JORDAN_lee@y.com')).toBe('Jordan');
  expect(firstName('Ana Lopez')).toBe('Ana');
  expect(firstName('maya.r88')).toBe('');
  expect(firstName('')).toBe('');
});

// ---------- photos ----------

const photo = () => q('hero-image');

test('each intro slide carries its photo from the Figma frames, decorative and with a fixed shape', async () => {
  await mount();
  await click(q('welcome-continue'));
  expect(photo().getAttribute('data-photo')).toBe('forest');
  await click(q('onboarding-continue'));
  expect(photo().getAttribute('data-photo')).toBe('shelf');
  await click(q('onboarding-continue'));
  expect(photo().getAttribute('data-photo')).toBe('plants');
  expect(photo().getAttribute('aria-hidden')).toBe('true');
  expect(photo().style.aspectRatio).toBe('3 / 2');
  const img = photo().querySelector('img');
  expect(img.getAttribute('alt')).toBe('');
  expect(img.className).toContain('object-cover');
  expect(img.getAttribute('src')).toBe('/onboarding/plants.jpg');
});

test('a photo that fails to load is replaced by a designed tile of the same shape', async () => {
  await mount();
  await click(q('welcome-continue'));
  const box = photo();
  await act(async () => { box.querySelector('img').dispatchEvent(new Event('error')); });
  expect(q('hero-fallback')).not.toBeNull();
  expect(photo().querySelector('img')).toBeNull();
  expect(photo().style.aspectRatio).toBe('3 / 2');
});

test('the quiz intro and the plan screen carry their photos, and the soil photo shows only for the soil lesson', async () => {
  signedIn({ hemisphere: 'north' });
  lessonAPI.submitPlan.mockResolvedValue({ data: { primary_track: 'rebirth', queue: ['soil-finger-test', 'plant-parent-reset'], matched: [], plan_answers: {} } });
  await mount();
  await click(q('zone-skip'));
  expect(photo().getAttribute('data-photo')).toBe('windowsill');
  await click(q('quiz-intro-skip'));
  await act(async () => { await new Promise((r) => setTimeout(r, 700)); });
  const photos = [...container.querySelectorAll('[data-testid="hero-image"]')].map((el) => el.getAttribute('data-photo'));
  expect(photos).toEqual(['sprouts', 'soil']);
});

test('a plan for another lesson has the sprouts hero but no soil photo', async () => {
  signedIn({ hemisphere: 'north' });
  await mount();
  await click(q('zone-skip'));
  await click(q('quiz-intro-skip'));
  await act(async () => { await new Promise((r) => setTimeout(r, 700)); });
  const photos = [...container.querySelectorAll('[data-testid="hero-image"]')].map((el) => el.getAttribute('data-photo'));
  expect(photos).toEqual(['sprouts']);
});

test('the shipped photos exist and each is under 300KB', () => {
  const dir = path.resolve(__dirname, '../../public/onboarding');
  ['forest', 'shelf', 'plants', 'windowsill', 'sprouts', 'soil'].forEach((name) => {
    const size = fs.statSync(path.join(dir, `${name}.jpg`)).size;
    expect(size).toBeGreaterThan(10000);
    expect(size).toBeLessThan(300 * 1024);
  });
});
