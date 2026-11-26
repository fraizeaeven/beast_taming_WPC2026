# Continuity Checks

`npm run validate` runs structural checks and six evidence-based continuity reviews. Continuity findings are warnings, not automatic canon changes. Review each warning against the manuscript before changing a registry. The engine does not infer a character's psychology or rewrite story facts from prose.

## Chapter record fields

The following optional fields can be added to a chapter JSON record. New chapter shells include empty arrays for them; existing chapter files remain valid.

- `characterAges`: `[{ "characterId": "CHAR_ID", "age": 16 }]`. Compared with the character's `birthDate` (`YYYY-MM-DD`) and chapter `inWorldDate` (`YYYY-MM-DD`).
- `behaviorChecks`: `[{ "characterId": "CHAR_ID", "traitId": "TRAIT_ID", "assessment": "consistent|inconsistent|uncertain", "evidence": "...", "explanation": "..." }]`. An `inconsistent` assessment produces a personality warning. This is an explicit author/reviewer judgment, not an automated reading of prose.
- `knowledgeUsed`: `[{ "characterId": "CHAR_ID", "factId": "FACT_ID" }]`. Each pair should have a discovery record in `15_KNOWLEDGE_TRACKER` or a prior/current chapter `knowledgeChanges` entry.
- `knowledgeChanges`: `[{ "characterId": "CHAR_ID", "factId": "FACT_ID", "action": "learned|discovered|taught|revealed|forgotten|lost" }]`. The chapter number is the change point.
- `relationshipChanges`: `[{ "relationshipId": "REL_ID", "fromState": "distant", "toState": "trusting", "reason": "..." }]`. Changes are checked in chapter order against `initialState`; keep `currentState` in `04_RELATIONSHIP_REGISTRY` aligned with the latest recorded state.
- `events`: event objects may include `eventId` (or `id`) and `occurredOn` (or `date`). Their dates are compared with the stable event ID in `10_EVENT_TIMELINE`. Timeline entries may also declare `precedes`, `afterEventId`, `follows`, `startDate` and `endDate`.\n- `objectChanges`: record `objectId`, `fromOwnerId`, `toOwnerId`, `fromLocationId` and `toLocationId` for a transfer.\n- `locationChanges`: record `locationId`, `fromOwnerId` and `toOwnerId` for changes in place ownership.
- `promises`: `[{ "promiseId": "PROMISE_ID", "action": "fulfilled" }]`. Promise registry entries may use `madeInChapter`, `notBeforeChapter`, `dueByChapter`, `fulfilledInChapter` and `status`.

## Registry fields

- `03_CHARACTER_REGISTRY`: add `birthDate` when the exact date is established. Do not invent a birthday to satisfy validation.
- `15_KNOWLEDGE_TRACKER`: each knowledge entry should identify `characterId`, `factId` and `learnedInChapter`; use `source: "backstory"` or `learnedBeforeStory: true` for knowledge established before chapter 1.
- `04_RELATIONSHIP_REGISTRY`: use `initialState` and `currentState` to record the relationship baseline and latest state.
- `10_EVENT_TIMELINE`: use a stable entry `id`, `occurredOn` date, and optional explicit ordering/dependency fields.\n- `14_POV_WHITELIST`: optional `characterId` and `restrictedFactIds` / `forbiddenFactIds` identify facts that must not be used by that character's POV.
- `13_PROMISE_AND_PAYOFF_REGISTER`: record the promise's setup chapter and any earliest/due payoff chapter when known.

## Warning codes

- `PERSONALITY_INCONSISTENCY`: a reviewer marked a behavior check inconsistent with an established trait.
- `KNOWLEDGE_BEFORE_DISCOVERY`: a character uses a tracked fact before its recorded discovery chapter.
- `KNOWLEDGE_DISCOVERY_UNRECORDED`: a character uses a fact with no discovery record.
- `AGE_TIMELINE_MISMATCH`: recorded age differs from the birthday-based age on the chapter date.
- `RELATIONSHIP_TRANSITION_MISMATCH`: a transition's `fromState` does not match the previously recorded state.
- `RELATIONSHIP_CHANGE_WITHOUT_CAUSE`: a transition has no recorded reason.
- `RELATIONSHIP_REGISTRY_STALE`: registry `currentState` differs from the final chapter transition.
- `PROMISE_FULFILLED_BEFORE_MADE`, `PROMISE_FULFILLED_PREMATURELY`, `PROMISE_OVERDUE`: promise timing does not match its setup/earliest/due chapter.
- `EVENT_CONTRADICTION`: the same event ID is assigned different in-world dates.\n- `KNOWLEDGE_NOT_ESTABLISHED_BY_USE`, `KNOWLEDGE_USED_BEFORE_ACQUISITION`, `POV_RESTRICTED_KNOWLEDGE_USED`: recorded knowledge or POV boundaries conflict.\n- `EVENT_DATE_INVALID`, `EVENT_DATE_CONFLICT`, `EVENT_END_BEFORE_START`, `EVENT_ORDER_CONTRADICTION`: event dates or declared dependencies conflict.\n- `OBJECT_OWNER_TRANSITION_MISMATCH`, `OBJECT_LOCATION_TRANSITION_MISMATCH`, `LOCATION_OWNER_TRANSITION_MISMATCH`: a transfer's recorded starting state does not match the prior recorded state.\n\nSee [Knowledge and Timeline Engine](KNOWLEDGE_AND_TIMELINE.md) for historical queries and full field guidance.

Checks only work where the relevant dates, IDs and state changes have been recorded. Missing information is not treated as proof of a contradiction. Intentional retcons should still be documented in `16_CONTINUITY_LEDGER`.
