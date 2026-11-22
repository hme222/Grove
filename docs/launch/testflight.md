# FloraGrove on TestFlight: runbook

Written 2026-11-22. The iPhone app is `grove-mobile/`, an Expo shell that loads the web app in a WebView. Nothing here has been built, deployed or submitted yet. Items marked **MISSING** are facts only the owner can supply; none are guessed.

## What is ready (checked 2026-11-22)

- `grove-mobile/` compiles: `npx expo export --platform ios` bundles 604 modules; `npx expo-doctor` passes 20 of 20 checks.
- Name FloraGrove, iPhone only, portrait, dark. Icon is the brand icon (`design/brand/icon-1024.png`, 1024 px, no transparency). Splash is the brand mark on the forest color.
- Camera and photo-library purpose strings are set. `ITSAppUsesNonExemptEncryption` is false (HTTPS only), so there is no export-compliance prompt on each build.
- `eas.json` has three profiles: `development` (iOS simulator), `preview` (internal), `production` (auto-incrementing build number).
- The shell shows a retry screen when the app can't be reached and opens links to other sites in Safari.
- `grove-frontend/vercel.json` makes deep links and refreshes work (single-page rewrite).
- Backend limits for the plan (3 free photo IDs, Pro-only diagnosis, fair-use caps) are built and tested but not deployed.

## What is blocked

| Item | Blocked on |
|---|---|
| Apple Developer Program membership | owner (waiting on the verification PIN) |
| App Store Connect app record and bundle identifier | membership |
| `eas build` for iOS and `eas submit` | membership and the owner's Apple sign-in |
| Push notifications | an APNs key (membership) and a backend sender (not built) |
| Web app and API deployed | owner's go-ahead (see "Deploy first") |

## Deploy first (the shell has nothing to load until this is done)

1. **API on Render.** Follow `docs/deploy-backend.md` (Blueprint in `render.yaml`). Set `MONGO_URL`, `CORS_ORIGINS`, `APP_BASE_URL`, `ANTHROPIC_API_KEY`, and the email settings. Atlas must allow Render. Check `https://<service>.onrender.com/healthz` returns `{"ok": true}`.
   - `CORS_ORIGINS` is the web app's address. The WebView sends that origin, so no extra origin is needed for the app.
   - The free Render plan sleeps when idle, so the first request can take about a minute. Use a paid plan for testers.
2. **Web app on Vercel.** New project, root directory `grove-frontend`. Set `REACT_APP_BACKEND_URL` to the API's address (no trailing slash). It is read at build time, so changing it needs a new build. Leave `REACT_APP_COMMUNITY`, `REACT_APP_GUILDS`, `REACT_APP_ZIP_ZONE` and `REACT_APP_FLORIST` unset for v1.
3. **Try it in a phone browser** before wrapping it: sign up, add a plant by name, add one with a photo, log a soil check, sign out and in.
4. **Production server settings** to leave at their defaults unless decided otherwise: `FREE_ID_ALLOWANCE=3`, `DIAGNOSIS_REQUIRES_PRO=on`, `AI_DAILY_CAP=30`, `AI_MONTHLY_CAP=300`, `AI_BURST_PER_MINUTE=6`. `PET_SAFETY_LABELS` stays unset (labels held back until the ASPCA gives written permission).

## Build and submit (needs the membership; run in your own terminal)

From `grove-mobile/`:

1. `eas init` and pick a project named `floragrove`. The older EAS project named `grove-landing` was created by mistake from the wrong folder and can be deleted on expo.dev.
2. Choose the bundle identifier and add it to `app.json` under `expo.ios.bundleIdentifier`. **MISSING: owner's choice.** It cannot be changed after the app is created in App Store Connect.
3. `eas env:create --name EXPO_PUBLIC_APP_URL --value https://<web app address> --environment production --visibility plaintext` (repeat for `preview`). The local `.env` is ignored by git and is not uploaded, so the variable has to be set this way.
4. `eas build --platform ios --profile production`. It asks for your Apple sign-in and creates the certificates and profile. Do not share your Apple password or codes with anyone, including me.
5. `eas submit --platform ios --latest`. EAS will ask for the App Store Connect app and creates it if you allow it.
6. In App Store Connect, TestFlight tab: add yourself under **Internal Testing** (up to 100 people with App Store Connect roles; **no Apple review**). The build appears after processing, usually 10 to 30 minutes.
7. Install the TestFlight app on your iPhone and accept the invite.

External testers (strangers, the Dec 1 presale) need **Beta App Review** first. See "Before external testers".

## When something changes after the first build

- **Web-only fixes** (almost everything we do): deploy the web app and reopen the app. No new TestFlight build is needed, because the shell loads the live site.
- **Shell or native changes** (icon, splash, permissions, plugins): bump nothing by hand, run `eas build` again; `autoIncrement` raises the build number.

## Before external testers (Beta App Review)

Apple reviews the first external build. Known risks and gaps:

- **Guideline 4.2 (minimum functionality).** A bare WebView can be rejected. The shell has no native feature yet. Candidates, in order of effort: native share sheet, native camera capture, local notifications for the daily care reminder, push notifications. Push needs an APNs key and a backend that sends; the backend stores the preference (`push_care_due`) but sends nothing.
- **Privacy policy URL.** The app has no privacy policy page and the sales page has none either. **MISSING.** Required for external testing and for the App Store.
- **App Privacy answers.** Draft below; confirm against the real privacy policy.
- **Demo account for the reviewer.** **MISSING:** create a real account on the deployed API for Apple to sign in with, and put its login in App Review Information. Do not use `ENABLE_TEST_LOGIN`.
- **Name.** Your own pricing plan flags a live FLORA registered mark. Have an attorney clear "FloraGrove" before taking payments.
- **Subscriptions.** Founder pricing and anything sold must use in-app purchase (guideline 3.1.1). None is built. Do not mention prices or Pro purchase inside the app build until it is.
- **AI disclosure.** Photos are sent to an AI service (Anthropic) to identify plants. Say so in the privacy policy and in the review notes. Photo location data should be stripped before upload; confirm that this is done.

### Draft App Privacy answers (to verify)

From the code on 2026-11-22. **Verify each against the final deployed behavior.**

- **Contact info:** email address (account); name (display name, optional). Linked to the user. Used for app functionality.
- **User content:** photos of plants, care logs, notes, plant names. Linked to the user. App functionality. Photos are processed by an AI service to identify plants.
- **Identifiers:** a user ID tied to the account.
- **Usage data:** the web app includes Vercel Analytics (page views). Declare it unless it is removed for the app.
- **Tracking:** none found in the code. Confirm there is no advertising or cross-app tracking.
- **Location:** hemisphere is asked as a choice, not read from the device. No device location found.

### Draft store listing (placeholders to fill; do not publish unverified claims)

- **Name:** FloraGrove
- **Subtitle (30 characters max):** Plant care that explains itself
- **Promotional text:** FloraGrove tells you what each plant needs today, and why. (from the existing landing copy)
- **Description:** **MISSING.** Write after the feature list is final. Claims about features must match what is built and what is shipped.
- **Keywords, support URL, marketing URL, age rating, category:** **MISSING.** Likely category: Lifestyle.
- **Screenshots:** take from the real TestFlight build on a 6.9-inch and a 6.5-inch device size. Do not use the demo's fake data.

### Draft App Review notes

> FloraGrove is a plant-care app for new plant owners. It is a native iPhone app that presents the FloraGrove service. Sign in with the demo account below. Photo plant ID uses the device camera and sends the photo to an AI service to suggest the plant's name. **MISSING: demo account, contact, and the list of native features once added.**

## Local checks (run before each submission)

- `grove-frontend`: `npm run verify`
- `grove-backend`: `python3 -m pytest -q tests`
- `grove-mobile`: `npx expo-doctor` and `EXPO_PUBLIC_APP_URL=https://example.com npx expo export --platform ios`
