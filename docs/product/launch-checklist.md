# Launch checklist (v1)

Decisions from the owner interview on 2026-11-18, after the panel critiques, the synthetic persona heat map
(10 synthetic personas, not real users) and the full-app pass on branch `worktree-agent-a9ba0df50a90eba28`.
Items marked **approval** stop for the owner before anything ships. Nothing here is deployed, published or emailed
without her go-ahead.

## Decided

### Merge and scope
- [x] Rerun every check on the full-app-pass branch, then merge into `main` and push (merged as 0bfc597).
- [x] Goals ("Working toward") stay out of v1 with badges and challenges (`/badges` and `/challenges` redirect to Today). Nothing deleted.
- [ ] Hide the florist pages for v1 (redirect like badges). Florists need their own discovery first (`confirmed-context.md`).

### Legal and accounts
- [ ] Draft a privacy policy and terms from what the code actually collects (email, plants, photos, care logs, Vercel Analytics, Anthropic calls). Every claim marked for review. **Approval** (owner, ideally a lawyer) before publishing.
- [ ] Add a contact address. **Owner supplies** it.
- [ ] Email through **Resend**. Owner creates the account, a sending address and DNS records; the API key goes in the server settings only (never in code or docs). Wire up password reset.
- [x] Email confirmation at sign-up stays **off** for v1 (turn on if spam sign-ups appear).
- [ ] Minimum password length **8** characters, with a clear error message.

### AI features
- [ ] Ship photo ID, bouquet identification and room scan **with an Anthropic key and a monthly spend cap** set by the owner in the Anthropic console. Clear failure states when the key is missing or the cap is hit.
- [ ] Soften the bouquet promise ("identifies every stem and tells you exactly how to keep them alive") to what it really does, including that it can be wrong.
- [ ] Label AI where it acts (photo ID, room scan, AI Suggest, AI biography), with a line that it can be wrong.
- [ ] Say in Meet Pip that Pip is a guide, not AI (Pip's lines are written, not generated).

### Hosting and look
- [ ] Render **paid always-on** plan for launch (owner confirms current price and upgrades).
- [ ] Theme color: **Forest #202D14** for both the installed-app color and the browser bar.

### Content (each claim needs a recorded source, per CLAUDE.md)
- [ ] Emergency numbers: **US numbers by default**; show UK numbers only to people whose account country is the UK. Claude researches official UK sources and shows each number with its source. **Approval** before it goes in. Note: the owner says the user base is in the US; the persona set assumed US and UK.
- [ ] Pet safety: Claude finds the ASPCA listing for common plants with no cited entry (fiddle-leaf fig, ZZ plant, others found on the way) and records each URL as the citation. **Approval** of the list before it is added.
- [ ] Yellow-leaf help: Claude drafts "how worried should I be / when to get help", sun and heat causes, low-light and no-plant-food fixes from named extension-service or RHS pages, each line linked. **Approval** before it ships.
- [ ] Voice: keep the headlines; add short plain explanations for jargon (LECA, grow medium, propagation jar) and fix the lowercase "leca".

### Technical, before launch
- [ ] Account deletion from Profile (account and data). Required for the privacy policy and Apple.
- [ ] Limits on repeated sign-in, sign-up and forgot-password attempts.
- [ ] Error monitoring (Sentry or similar; owner creates the account, the key goes in settings).
- [ ] Server cleanup: trim `requirements.txt` to what the code imports, pin the Anthropic library, test a fresh install on Python 3.12, add the hosting route file so reset links open directly, `robots.txt`, and a link-preview image.
- [ ] Pass the error to the remaining 26 `LoadError` messages so server faults say "on our side", plus the notification-settings save error.

### Leftovers
- [ ] Today's due-plant dot and the "Healthy" label elsewhere: make status consistent.
- [ ] Help & tutorial shows the mission twice: remove the duplicate.
- [ ] Commit the long-pending `.gitignore` change after showing the owner the diff.
- [ ] Walkthrough demo: the owner's new plant stays fresh; a clearly labeled sample plant is the overdue one, so Pip's visit still shows.
- [ ] After everything lands, rerun the 10 synthetic personas and compare with the first heat map.

## Later (post-launch)
- Data export (download your plants, care logs and photo list).
