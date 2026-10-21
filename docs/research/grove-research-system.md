# Grove research operating system

## Product truth

Grove currently contains working and concept-level surfaces for plant
collections, care routines, onboarding, plant identification, AI-suggested
watering schedules, rooms, community, swaps, and plant stories. The interface
expresses a promise of helping people pay attention to plants and build a
simple care rhythm without reducing care to metrics.

That promise is a product hypothesis, not validated user evidence.

The founder-confirmed audience sequence is:

1. New plant owners for the primary MVP
2. Experienced plant collectors as the first expansion audience
3. Florists, plant influencers, and horticulturalists as later, distinct
   professional or creator audiences

The audience sequence is confirmed direction, not proof of user need. MVP
research must use new plant owners and must not blend later audiences into the
same evidence set.

The highest-risk unresolved assumption is:

> New plant owners experience enough uncertainty in everyday plant care that
> a calm, trustworthy next action is more valuable than another schedule,
> dashboard, or motivational mechanic.

## Written decision premise

Before expanding the concept set, determine whether Grove's first-use path can
help a new plant owner add one real plant, understand what deserves attention,
and complete a care action without becoming overconfident in AI-generated
advice.

Why now: Grove already has several possible first-use and behavior-change
directions. More variants will increase design surface area without resolving
which user problem or interaction earns trust.

Approval boundary: research artifacts and local prototypes may change. Do not
contact participants, instrument production, publish findings, or expose user
data without explicit approval.

## The Grove learning spiral

Each loop must end with a decision, not a presentation.

| Stage | Question | Appropriate evidence | Grove example | Exit condition |
| --- | --- | --- | --- | --- |
| Discover | What is happening in the person's real context? | Context interview, observation, diary | How people currently notice, postpone, or recover from plant-care needs | A repeated problem and current workaround are observed |
| Explore | Which problem and workflow should Grove address? | Task analysis, concept interview, competitive review, card sort | Whether "Care Today," a plant story, or confidence support is the clearest entry point | One bounded workflow and falsifiable hypothesis are chosen |
| Evaluate | Can people use and trust the proposed workflow? | Moderated usability test, accessibility review, failure-state test | Add a plant, review an uncertain AI suggestion, override it, and log care | Threshold is met or a specific revision is justified |
| Listen | What happens in actual use over time? | Support themes, opt-in feedback, privacy-safe analytics, longitudinal diary | Repeated care completion, schedule edits, ignored reminders, recovery after a mistake | Observed behavior supports or rejects the hypothesis |

Return to discovery whenever the evidence reveals that Grove is solving the
wrong problem. Do not use listening methods until there are real users and
appropriate consent, privacy, and instrumentation.

## Evidence model

Keep these evidence types separate:

- **Behavioral:** task completion, hesitation, navigation path, edits,
  overrides, errors, abandonment, and recovery.
- **Attitudinal:** expectations, perceived value, confidence, preference, and
  stated intent.
- **System:** model output, confidence state, latency, error, fallback, and
  whether the user could correct the result.
- **Inference:** the team's interpretation. An inference must cite at least one
  observation and state what would disprove it.

Do not use "users liked it" as a finding. Record the behavior or exact
observation that supports the statement.

## Method-selection rules for Grove

### Use interviews when the unknown is the problem

Use one-on-one interviews to understand existing care behavior, triggers,
workarounds, emotions, and trust. Ask about recent concrete events. Avoid
pitching Grove or asking whether someone would use a hypothetical feature.

### Use a diary when time is part of the problem

Plant care is episodic and context-dependent. A short diary can reveal what a
single interview misses: how a person notices soil, light, weather, plant
appearance, reminders, and competing routines over several days.

Only run a diary after a small pilot proves that the prompt is easy enough to
complete. Diary participation and duration are not yet decided.

### Use usability testing when the unknown is the interaction

Test observable tasks with the current product or a focused prototype. Include
uncertainty and recovery, not only the happy path:

- The plant-identification result is wrong or low-confidence.
- The watering suggestion conflicts with what the participant knows.
- A photo upload or AI request fails.
- The participant needs to edit or undo a care record.
- A plant is not actually due despite a scheduled reminder.

### Use card sorting or tree testing when the unknown is organization

Use these methods only for a specific information-architecture question, such
as whether people expect "Growth," "Field Notes," and plant history under
Care, a plant profile, or a journal. Do not use them to choose a product
strategy.

### Use surveys or analytics when scale is required

Surveys are useful after qualitative work identifies answerable questions.
Analytics can show what happened, not why. Neither replaces direct
observation, and neither is evidence until Grove has real, consented usage.

## Interview question rules

Adapted from the source guide for Grove:

1. Use language the participant uses; avoid product and horticultural jargon.
2. Ask open questions about recent behavior.
3. Keep wording neutral and avoid embedding the desired answer.
4. Replace accusatory "why" questions with prompts such as "What was happening
   when..." or "What made you choose..."
5. Remove every question that does not inform the written decision.

Bad: "Would reminders help you water on time?"

Better: "Tell me about the last time a plant went longer than you intended
without care. What first made you notice?"

## Research quality gates

A study is not ready until it has:

- A single product decision and the person authorized to make it.
- A confirmed audience and explicit recruitment criteria.
- A falsifiable hypothesis.
- Separate behavioral and attitudinal measures.
- Normal, ambiguous, failure, and recovery tasks.
- A decision threshold written before sessions begin.
- A note template and evidence identifiers.
- A privacy plan and consent language for any participant data.
- A correction rule for conflicting or weak evidence.

A finding is not ready until:

- It appears in the evidence log.
- It links to one or more session observations.
- Contradictory evidence is retained.
- Severity and confidence are recorded separately.
- The team can state what would change its conclusion.

## Cadence

Use the smallest loop that can change a decision:

1. Frame one decision.
2. Pilot the guide with one session.
3. Correct confusing tasks or questions without changing the hypothesis.
4. Run the bounded study.
5. Synthesize behaviors before preferences.
6. Make one product decision.
7. Add failures to the next regression study.

Avoid a standing research calendar until Grove has completed three supervised,
end-to-end loops with traceable decisions.

## Research debt now visible

- The primary audience is confirmed, but the operational definition of "new
  plant owner," primary job, and problem severity are not.
- The first-use value proposition spans care, memory, community, and
  confidence; their priority is unresolved.
- The product includes AI identification and schedule suggestions, but no
  observed trust calibration is documented.
- Concept showcase routes outnumber validated decisions.
- Production usage, research participants, and shipped status are not
  established in the current workspace.
- The experienced-collector and professional/creator audiences do not yet have
  separate discovery briefs; they must not influence the MVP threshold.
