# Scene Construction and Emotional Pacing Engine

v1.9 records author-reviewed scene design and provides a deterministic scene-sequence view. It does not write scenes, assign objective tension scores or enforce a formula that every scene must escalate.

## Commands
```bash
npm run scene:construction -- 12
npm run scene:pacing -- 12
npm run validate
```

Each chapter stores one record per scene in `sceneConstructionChecks`. Keep `sceneId` aligned with the identifier used by other chapter annotations.

## Record shape
```json
{
  "id":"SCNBUILD_001","sceneId":"SCENE_12_03","order":3,
  "povCharacterId":"CHAR_KAEL","involvedCharacterIds":["CHAR_KAEL","CHAR_LINA"],
  "sceneGoal":"Get Lina to leave before attackers arrive",
  "opposition":"Lina refuses to leave without the truth",
  "conflict":"His attempt to protect her becomes a confrontation",
  "stakes":"He may lose her trust or expose her to danger",
  "escalationSteps":["He hides the injury","She notices blood","He orders her out","She refuses"],
  "turningPoint":"She reveals she already knows who attacked him",
  "reversal":"The person he feared exposing has already contacted her",
  "emotionalShift":"His anger gives way to fear and reluctant relief",
  "outcome":"They decide to face the threat together",
  "hookOrExit":"A message arrives from the attacker",
  "tensionStart":3,"tensionPeak":8,"tensionEnd":6,"pacingMode":"reversal",
  "plotProgress":"The threat reaches Lina directly",
  "characterArcProgress":"He allows her to make an informed choice",
  "relationshipProgress":"They move from concealment to partial honesty",
  "revelationProgress":"Lina knows the attacker's identity",
  "decisionProgress":"They choose to confront the threat together",
  "purposeRationale":"","evidence":"He tells her the attacker's name and gives her the message"
}
```

## Construction questions
1. **Goal:** What does the viewpoint character want here?
2. **Opposition/conflict:** Who or what resists, and how does it become active?
3. **Stakes:** What can be lost, damaged, exposed or changed?
4. **Escalation:** What successive developments increase pressure or narrow choices? Escalation can be emotional, relational, informational or physical.
5. **Turning point/reversal:** What changes understanding, options or control?
6. **Emotional shift:** What changes in feeling or emotional strategy from entry to exit?
7. **Outcome/exit:** What is different afterward, and what consequence or anticipation carries forward?
8. **Purpose:** Does the scene advance plot, character arc, relationship, revelation or a consequential decision?

## Emotional pacing
Tension values are author estimates from 1 to 10 at scene entry, peak and exit. They are descriptive aids, not scores or quality metrics. `scene:pacing` orders records and displays tension transitions between scenes.

A scene may intentionally release tension. Quiet scenes, aftermath, intimacy, grief, humour, reflection and transitions can deepen attachment, clarify stakes, allow recovery or make later escalation more effective. Mark `pacingMode` as `breather` or `transition` and explain `purposeRationale` when no direct plot/arc/relationship/revelation/decision advance is recorded.

Validation reports missing construction elements, invalid references, duplicate order and questionable tension ordering. A tension drop is not automatically a flaw. The author decides whether rhythm, repetition, emotional fatigue or abrupt change works in context.

## AI-assisted review
The chapter review prompt analyses goals, opposition, stakes, escalation, turning points, emotional shifts, outcomes, hooks and chapter-level tension variation. A scene record may be staged as an `add_chapter_item` proposal for `sceneConstructionChecks`. It is not canon until the author approves it.
