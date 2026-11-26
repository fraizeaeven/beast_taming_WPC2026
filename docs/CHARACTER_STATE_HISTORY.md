# Historical Character State Tracking

The `18_CHARACTER_STATE_HISTORY` registry stores author-confirmed snapshots of a character at a chapter boundary. It answers questions such as “What does this character believe, fear, want and know by chapter 24?” without pretending the engine can infer inner life from missing records.

## Query

```bash
npm run character:state -- CHAR_KAEL 24
npm run character:history -- CHAR_KAEL
npm run validate
```

`character:state` returns the latest snapshot at or before the requested chapter, its source chapter and the number of chapters since it was recorded. If no earlier snapshot exists, it says so. It does not interpolate an unrecorded state. `character:history` lists all snapshots in chapter order.

## Snapshot shape

Add one entry per character per chapter where a meaningful state change or checkpoint should be remembered:

```json
{
  "id": "STATE_KAEL_0012",
  "characterId": "CHAR_KAEL",
  "chapter": 12,
  "emotionalState": "Angry and frightened, masking both with contempt",
  "physicalState": "Exhausted; hands shaking after the fight",
  "activeGoal": "Keep the younger sibling away from the court",
  "motivation": "Prevent another family betrayal",
  "misbelief": "Depending on someone gives them power to hurt him",
  "truthRecognized": "His refusal to ask for help is endangering others",
  "arcId": "ARC_KAEL_TRUST",
  "arcStage": 3,
  "stageEvidence": "He sees the cost of isolation but still rejects the offered alliance",
  "changeType": "stalled",
  "behaviour": "Deflects concern with sarcasm; avoids eye contact",
  "relationshipStates": [
    { "relationshipId": "REL_KAEL_LINA", "state": "strained", "reason": "He concealed the warning" }
  ],
  "knowledgeIds": ["FACT_COURT_WARNING"],
  "pressure": "The sibling is now directly threatened",
  "decision": "Refuses Lina's help",
  "consequence": "Lina acts alone and is captured",
  "source": { "kind": "chapter", "reference": "CHAPTER_0012, scene 3" },
  "notes": "Author-approved interpretation"
}
```

## Seven-stage arc tracking

Use `arcStage` from 1 to 7:

1. Denial of the problem.
2. Recognises the problem but refuses to change.
3. Sees the suffering caused by the problem but doubts change will help.
4. Begins considering change.
5. Realises continued refusal will make self or others suffer.
6. Makes an effort to change.
7. Accepts the truth and transforms.

Stages are not a rigid chapter ladder. A character may stall, partially change, relapse or regress under pressure. Mark deliberate regression with `changeType: "regression"`; other useful values include `stalled`, `partial`, `breakthrough` and `setback`. Stage evidence should explain the character's actual response, not merely label an emotion.

At a meaningful scene checkpoint, record what the character does automatically, thinks, feels, experiences physically, expresses outwardly, wants, fears and chooses. Keep observable behaviour and author interpretation distinct. For scene-by-scene breakdowns, use chapter `psychologyChecks`; see [Character Psychology and Emotional Analysis](CHARACTER_PSYCHOLOGY.md).

## Validation and safeguards

Validation checks character references, chapter numbers, duplicate character/chapter snapshots and stage values. It warns when a stage has no evidence, source provenance is missing or a lower stage is not marked as a regression. It does not decide whether psychology is believable, force stage progression or generate emotional facts.

The query is a historical reconstruction from the latest available snapshot, not a claim that every detail remained unchanged until the target chapter. Review snapshot age and source before drafting. Update the registry only with author-confirmed material.
