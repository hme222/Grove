# Study 001: trusted first care action

Status: **draft - primary audience confirmed; recruitment definition and
decision owner require confirmation**

Run ID: `GROVE-RES-001`

## Decision

Decide whether to continue refining the current onboarding-to-Care workflow,
revise the first-use path around a different user problem, or pause additional
concept work until the problem is clearer.

## Confirmed primary audience

The founder-confirmed MVP audience is **new plant owners**.

Before recruitment, the founder must confirm:

- The operational definition of "new," such as self-identification, time since
  acquiring a first plant, or experience with independent plant care.
- Who makes the continue/revise/pause decision.

Proposed screener requirements:

- Identifies as new to caring for indoor plants.
- Currently owns or regularly cares for at least one indoor plant.
- Has recently felt uncertain about what a plant needed.
- Has not previously participated in Grove product development.

Do not recruit experienced collectors, florists, plant influencers, or
horticulturalists into this MVP study. Those audiences require later,
separately analyzed studies.

## Hypothesis

If Grove turns one real plant into a clear, editable next action while showing
the limits of AI advice, participants will complete a first care action and
remain appropriately willing to question or override the system.

## Riskiest assumptions

1. A new plant owner recognizes a real problem in their current care process.
2. "Care Today" is more useful than a static collection after first setup.
3. AI assistance increases clarity without creating false confidence.
4. The participant can recover when the system is wrong.
5. Grove's calm, non-gamified framing helps rather than obscures the next step.

## Artifact under test

Use the smallest end-to-end slice of the current local product:

1. Onboarding
2. Add one plant with a photo
3. Review identification and watering guidance
4. Open Care Today
5. Decide whether care is actually needed
6. Log, postpone, or correct the action

Do not test community, swaps, badges, rooms, and bouquets in this study.

## Tasks

The moderator gives context, not navigation instructions.

1. "Imagine this is a plant you care for at home. Set it up in Grove so you
   could use the app tomorrow."
2. Present a normal identification result. Ask: "What would you do next?"
3. Present a low-confidence or incorrect result. Ask: "Handle this as you
   would if it were your plant."
4. Present a watering suggestion that conflicts with the plant's current
   condition. Ask: "Decide what to do today."
5. Simulate an AI or upload failure. Ask: "Continue without losing your work."
6. Ask the participant to find and change the schedule or care record.

## Measures

### Behavioral

- Completes plant setup without moderator navigation.
- Distinguishes a recommendation from a requirement.
- Checks the plant or context before acting.
- Finds an edit, override, postpone, or recovery path.
- Completes or intentionally declines a care action.
- Recovers from the simulated failure without starting over.

### Attitudinal

- Describes what Grove is for in their own words.
- Reports how certain they feel about the next action.
- Identifies which information they trust and which they would verify.
- States whether the workflow fits an existing care routine.

### System

- Confidence and uncertainty are visible.
- The recommendation includes a human-correctable reason.
- Failure preserves participant input.
- No dead end requires hidden moderator help.

## Proposed decision threshold

This threshold is a proposal to approve before the first scored session:

- At least 4 of 5 scored participants complete setup and make an intentional
  care decision without moderator navigation.
- At least 4 of 5 recognize that AI output can be edited or rejected.
- Every participant can recover from one failure without losing the plant
  record.
- Zero participants take a potentially harmful care action solely because the
  interface presented it as certain.

The first session is a guide pilot and is not included in the scored set unless
the script remains unchanged.

## Severity

- **Critical:** likely harmful care action, irreversible data loss, or trust
  state that prevents informed correction.
- **High:** participant cannot complete the core workflow without intervention.
- **Medium:** material hesitation, wrong turn, or misunderstanding with
  recovery.
- **Low:** friction or wording issue that does not change the decision.

## Stop conditions

Pause the study and revise the artifact if:

- A task exposes private participant data unexpectedly.
- The prototype cannot reliably present the intended trust/failure state.
- Two sessions reveal the same critical issue.
- New plant owners reject the problem itself rather than the interaction.
  Return to discovery instead of polishing the workflow.

## Synthesis and decision

After the sessions:

1. Log observations before interpreting them.
2. Cluster behavioral evidence separately from stated preferences.
3. Preserve contradictions and outliers.
4. Map each issue to a normal, ambiguous, failure, or recovery state.
5. Make exactly one decision:
   - **Continue** if the threshold is met and no critical trust failure occurs.
   - **Revise** if the problem is supported but the interaction misses the
     threshold.
   - **Pause** if evidence is too weak or the study setup failed.
   - **Stop** if the target problem is not supported for the confirmed
     audience.

## Current result

No sessions have been run. There is no research result yet.

## Next-run regression check

Any critical or high-severity failure becomes a required task in the next
study. A fix is not accepted until a participant can complete that task
without moderator rescue.
