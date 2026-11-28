# Character Transformation Intelligence (v2.6)

v2.6 reviews whether a character's stated insight is reflected in observable behaviour when a recognisable trigger returns. It uses chapter-level `transformationChecks` and existing `psychologyChecks`, `18_CHARACTER_STATE_HISTORY`, relationship and consequence records. It does not infer internal states from prose or automatically advance an arc.

## Chapter record

Each chapter may contain:

```json
{
  "transformationChecks": [{
    "id": "TRANS_KAEL_042",
    "order": 2,
    "characterId": "CHAR_KAEL",
    "arcId": "ARC_KAEL",
    "triggerKey": "TRIGGER_REJECTION",
    "triggerDescription": "A trusted ally rejects his request",
    "pressure": "He risks losing the alliance and public standing",
    "priorCheckId": "TRANS_KAEL_031",
    "priorPattern": {
      "behaviour": "He threatens the other person and withdraws",
      "misbelief": "Rejection proves he is powerless",
      "evidence": "The earlier scene's observable action or annotation reference"
    },
    "currentResponse": {
      "behaviour": "He listens and asks what boundary he crossed",
      "deliberateChoice": "He does not retaliate",
      "appliedTruth": "A refusal is not proof of betrayal",
      "evidence": "What the reader can observe in this scene"
    },
    "appliedTruth": true,
    "outcome": "different_response",
    "choiceCost": {
      "sacrifice": "He gives up immediate control",
      "cost": "He may lose the alliance",
      "evidence": "The ally leaves and he does not stop them"
    },
    "setback": {
      "oldMisbeliefReturned": false,
      "evidence": "",
      "recoveryChoice": ""
    },
    "witnesses": [{
      "characterId": "CHAR_LINA",
      "observation": "He does not threaten or block the exit",
      "response": "She remains cautious but later approaches voluntarily",
      "evidence": "Observable action or dialogue"
    }],
    "sustainedPattern": {
      "evidence": "The same changed response is repeated in another chapter under pressure",
      "supportingEvidence": ["TRANS_KAEL_031"]
    },
    "arcStage": 6,
    "stageEvidence": "He attempts the new response despite the cost"
  }]
}
```

### Field guidance

- `triggerKey` is a stable, author-defined identifier for a recurring trigger. Use the same key when the character faces substantially the same trigger again.
- `priorCheckId` links to an earlier transformation check for the same character and trigger.
- `priorPattern` records the earlier behaviour/misbelief baseline; `currentResponse` records what the character actually does now.
- `pressure` records what makes the choice difficult. `appliedTruth` and `currentResponse.appliedTruth` record the truth the character attempts to use.
- `outcome` is one of `different_response`, `old_pattern_repeated`, `mixed`, or `not_tested`. This is an author annotation, not an automatic verdict.
- `choiceCost` records a sacrifice or cost and evidence. Transformation need not always involve a dramatic sacrifice; record the real cost where one exists.
- `setback` can record the return of an old misbelief and the character's recovery choice. Regression is not a structural error.
- `witnesses` record what another character actually observes and how they respond. They do not gain access to private thoughts.
- `sustainedPattern` records evidence that the changed behaviour persists. The engine checks for multiple changed-response tests across chapters, not merely a declared stage.
- `arcStage` retains the existing seven-stage arc (1–7). It does not replace or redefine those stages.

## Validation and reports

`npm run character:transformation` prints the report for all characters. Add a character ID to filter:

```bash
npm run character:transformation -- CHAR_KAEL
npm run validate
```

The report groups repeat tests by character and trigger, shows changed responses and repeated old patterns, and identifies whether changed responses have appeared in multiple chapters.

Important advisory findings include:

- `TRANSFORMATION_CLAIM_WITHOUT_BEHAVIOURAL_PROOF`: a claim of change has no recorded behaviour or deliberate choice.
- `TRANSFORMATION_OLD_PATTERN_REPEATED`: the author marks that the old response returned.
- `TRANSFORMATION_CHANGE_NOT_YET_SUSTAINED`: only one evidence-backed changed response is recorded for that trigger.
- `TRANSFORMATION_TRUTH_APPLICATION_UNSUPPORTED`: a claimed truth application lacks a recorded truth/evidence.
- `TRANSFORMATION_MISBELIEF_RETURN_WITHOUT_EVIDENCE`: a setback is marked without evidence.
- `TRANSFORMATION_STAGE_SEVEN_NOT_SUSTAINED`: a Stage 7 historical snapshot has no repeated evidence-backed changed response across chapters.

Structural errors are limited to invalid IDs/references, unknown characters or witnesses, invalid stage/outcome values and invalid prior-check links. Other findings are warnings for author review.

## Design boundaries

- The seven stages are not forced into a linear schedule. A character can stall, regress, partially change, or choose differently in one situation and fail in another.
- An apology, confession, speech, promise, or stated realisation is not behavioural proof by itself.
- Repeating a new response across chapters is evidence of persistence, not proof that the character can never regress.
- Witness reactions are recorded only when observable and authored; other characters are not required to forgive, trust, or reward the changed behaviour.
- The engine does not diagnose characters, infer hidden motives, score moral worth, or automatically modify canon.
- AI-generated transformation annotations remain proposals in the existing draft workflow and require explicit approval.
