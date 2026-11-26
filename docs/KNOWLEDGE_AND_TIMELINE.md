# Knowledge and Timeline Engine

The engine adds historical queries and explicit continuity warnings to the existing knowledge, event, object and location registries. It does not infer knowledge from prose, decide what a character should know, or change canon.

## Historical knowledge

Use stable uppercase character and fact IDs in 15_KNOWLEDGE_TRACKER. A record may include learnedInChapter, method (or how), source, learnedBeforeStory and optional forgottenInChapter / lostInChapter. Set source to backstory or learnedBeforeStory to true for facts known before Chapter 1.

Chapter-level knowledgeChanges records subsequent changes:
- Learning actions: learned, learn, discovered, taught, revealed, remembered, informed.
- Knowledge-ending actions: forgotten, forget, forgot, lost, disproved, retracted.

Example:
```json
{
  "characterId": "CHAR_KAEL",
  "factId": "FACT_CORE_ORIGIN",
  "action": "discovered",
  "method": "Read the sealed inscription",
  "evidence": "Scene 3"
}
```

Commands:
```bash
npm run knowledge:state -- CHAR_KAEL 12
npm run knowledge:state -- CHAR_KAEL 12 FACT_CORE_ORIGIN
npm run knowledge:who-knows -- FACT_CORE_ORIGIN 12
```

Queries replay recorded acquisition and forgetting events up to the requested chapter. Missing history is not proof that a character does not know something; add a backstory or discovery record when the fact is established.

## POV knowledge boundaries

14_POV_WHITELIST may identify a characterId and explicit restrictedFactIds (or forbiddenFactIds). If the POV character's knowledgeUsed annotation names one of those facts, validation emits POV_RESTRICTED_KNOWLEDGE_USED. This check depends on explicit author-maintained annotations; it does not read manuscript prose.

## Event timeline

10_EVENT_TIMELINE entries can use chapter / chapterNumber, occurredOn (YYYY-MM-DD), startDate, endDate, precedes (event IDs), afterEventId and follows. Chapter events can repeat an event ID and date as an evidence point. Validation reports invalid/conflicting dates, end-before-start dates and declared ordering that contradicts dates.

```bash
npm run timeline:chapter -- 12
```

## Object and location history

Chapter objectChanges can use objectId, action, fromOwnerId, toOwnerId, fromLocationId and toLocationId. The existing 06_DOCUMENT_AND_OBJECT_REGISTRY entry provides the baseline through ownerId / currentOwnerId and locationId / currentLocationId.

Chapter locationChanges can use locationId, action, fromOwnerId and toOwnerId. The existing 09_LOCATION_REGISTRY provides its baseline ownership.

```bash
npm run object:history -- OBJ_CORE
npm run object:history -- OBJ_CORE 12
npm run location:history -- LOC_KEEP
```

Validation warns when a recorded transfer's fromOwnerId or fromLocationId disagrees with the latest recorded state. Unrecorded transfers cannot be detected.

## Validation warnings

- KNOWLEDGE_NOT_ESTABLISHED_BY_USE
- KNOWLEDGE_USED_BEFORE_ACQUISITION
- POV_RESTRICTED_KNOWLEDGE_USED
- EVENT_DATE_INVALID
- EVENT_DATE_CONFLICT
- EVENT_END_BEFORE_START
- EVENT_ORDER_CONTRADICTION
- OBJECT_OWNER_TRANSITION_MISMATCH
- OBJECT_LOCATION_TRANSITION_MISMATCH
- LOCATION_OWNER_TRANSITION_MISMATCH

Run npm run validate after recording changes. Warnings are review prompts, not automatic canon edits. Keep source/evidence in the record and resolve intentional retcons through 16_CONTINUITY_LEDGER.
