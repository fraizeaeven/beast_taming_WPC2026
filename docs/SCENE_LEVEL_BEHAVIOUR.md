# Scene-Level Character Behaviour Engine

The scene behaviour layer connects a character's internal psychology to observable interaction in the scene. It is an author-reviewable record, not automatic mind-reading or a prose generator.

## Queries

```bash
npm run scene:behaviour -- 12
npm run scene:behaviour -- 12 SCENE_12_03
npm run scene:character -- CHAR_KAEL
npm run validate
```

Each chapter stores scene interaction beats in `sceneBehaviourChecks`. Use one record for a consequential action, exchange, avoidance or misread interaction. A scene can contain multiple beats and observers.

## Suggested record

```json
{
  "id": "SCNBEH_KAEL_001",
  "sceneId": "SCENE_12_03",
  "actorId": "CHAR_KAEL",
  "targetCharacterId": "CHAR_LINA",
  "action": "Moves between Lina and the doorway",
  "dialogueBehaviour": "Answers her question with a command",
  "bodyLanguage": "Keeps his shoulders square and blocks her path",
  "avoidance": "Does not answer why he came back injured",
  "observerId": "CHAR_LINA",
  "observerObservation": "She sees him block the doorway and change the subject",
  "observerInterpretation": "She thinks he no longer trusts her",
  "relationshipImpact": "Lina withdraws her offer to help",
  "relationshipEvidence": "She puts the medical kit away without another word",
  "sceneOutcome": "The argument ends without the truth being discussed",
  "causalLink": "His refusal to answer causes her to assume he is shutting her out",
  "arcEffect": "He repeats his protective-control pattern rather than accepting help",
  "arcEvidence": "He physically prevents her from joining him after admitting he is afraid",
  "observableEvidence": "He blocks the doorway and changes the subject"
}
```

## Record in this order

1. **Actor and target:** Who performs the behaviour, and who receives it?
2. **Action:** What concrete action changes the scene?
3. **Dialogue behaviour:** Does the character answer, deflect, interrupt, command, joke, lie, go quiet or change the subject?
4. **Body language:** What can another person physically observe?
5. **Avoidance:** What question, truth, task, person or feeling does the character evade?
6. **Observer observation:** What did another character actually see or hear?
7. **Observer interpretation:** What meaning do they assign? It may be incomplete or wrong.
8. **Relationship impact:** What changes between the characters, with evidence.
9. **Scene outcome and causal link:** What happens because of the behaviour? State the causal chain rather than merely listing events.
10. **Arc effect:** Does this behaviour reinforce, challenge, stall or contradict the character's current pattern? Record evidence; do not force advancement.

## Evidence boundaries

- `observableEvidence`, `observerObservation` and `relationshipEvidence` should be grounded in visible action, spoken words or explicit narration.
- `observerInterpretation` is what the observer believes, not necessarily the truth.
- `interpretation` and `arcEvidence` are analytical fields and should remain distinguishable from direct textual evidence.
- A character cannot observe another character's private thought unless the scene explicitly reveals it.
- Missing details generate review warnings. Unknown character references and malformed/duplicate IDs are structural errors.
- The engine does not score emotional intensity or decide whether an arc turn is earned.

## AI-assisted review

The v1.6 workflow now asks the selected AI model to analyse consequential scene interactions and can stage an `add_chapter_item` proposal for `sceneBehaviourChecks`. The proposal is not canon until the author explicitly approves it. No AI provider API is called by the engine.
