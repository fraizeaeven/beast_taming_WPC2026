# Character Decision and Behaviour Intelligence

Version 2.2 reviews the causal logic behind character decisions using explicit author/model annotations. It asks whether a decision is understandable given the character's trigger, interpretation, activated belief, emotional/physical response, established strategy and prior experience—not whether the decision is correct, healthy or morally good.

## Causal chain

For each consequential beat, record as much of this sequence as the draft supports:

1. **Trigger** — what happens externally or internally.
2. **Automatic reaction** — the instinctive response before deliberate thought.
3. **Interpretation and activated belief** — what the character thinks the event means and which belief/misbelief becomes active.
4. **Emotion and body** — named emotion and physical sensation.
5. **Expression** — what the character shows, including deliberate masking or mismatch.
6. **Choice and rationale** — what the character does and why that choice makes sense to them.
7. **Consequence** — immediate or delayed result.
8. **Misbelief and arc effect** — whether the experience reinforces/challenges the misbelief and how it affects the character's development.

The engine does not require every optional field. Existing `psychologyChecks` fields remain the foundation. The v2.2 fields are optional additions:

| Field | Purpose |
| --- | --- |
| `interpretation`, `beliefActivated` | Record the character's meaning-making and activated belief. |
| `priorExperienceBeatId` | Link to an earlier psychology beat for the same character. |
| `decisionRationale`, `decisionAlignment`, `conflictEvidence` | Explain a choice that aligns or conflicts with an active goal, personality or misbelief. |
| `choicePattern` | Give a stable label to a repeated defensive or decision strategy. |
| `consequenceTrend` | Explicitly mark a consequence trend as stable, worsening or improving. |
| `strategyReview`, `attemptedAlternative` | Record whether the character questions or attempts to change a repeated strategy. |
| `misbeliefEffect`, `misbeliefEffectEvidence` | Mark and support whether the misbelief is reinforced, challenged or unchanged. |
| `arcEffect`, `arcEffectEvidence` | Record and support the effect on the character arc. |
| `responseMismatch`, `responseMismatchReason` | Explicitly mark an expected/observed response mismatch and explain it. |
| `consequenceTracking.requireStateUpdate` | Require a later character snapshot to reference the consequence beat. |
| Snapshot `consequenceReferences` | Array of psychology beat IDs whose consequences are reflected in that snapshot. |

## Reports and validation

Run:

```bash
npm run character:decision
npm run character:decision -- CHAR_KAEL
npm run validate
```

The report lists annotated decisions and related findings. Validation adds decision-intelligence findings to the existing advisory warning stream. Structural character-reference errors remain errors; narrative interpretation checks are warnings for author review.

## Review rules

- A character can act consistently with personality and still make a damaging or irrational decision.
- A character may resist change, stall, regress, or repeat a defensive strategy. The engine does not force seven-stage advancement.
- A repeated pattern is only flagged as costly when the author explicitly marks its consequence trend as worsening.
- A response mismatch is only checked when explicitly marked; the engine does not judge whether an emotion is objectively appropriate.
- A prior-experience reference must point to an earlier psychology beat belonging to the same character.
- Consequence carry-through is checked only when `requireStateUpdate: true` is explicitly set.
- No prose is semantically mined for private thoughts, emotions or motives. Evidence and interpretation remain distinct.
- No registry or chapter canon is modified by these reports.

## Warning codes

- `DECISION_INTERPRETATION_OR_BELIEF_MISSING`
- `DECISION_RATIONALE_MISSING`
- `DECISION_PRIOR_EXPERIENCE_REFERENCE_INVALID`
- `DECISION_PERSONALITY_OR_MISBELIEF_CONFLICT_UNEXPLAINED`
- `DECISION_MISBELIEF_EFFECT_UNSUPPORTED`
- `DECISION_ARC_EFFECT_UNSUPPORTED`
- `DECISION_RESPONSE_MISMATCH_UNEXPLAINED`
- `DECISION_PATTERN_REPEATED_DESPITE_WORSENING_COST`
- `DECISION_CONSEQUENCE_NOT_CARRIED_INTO_CHARACTER_STATE`

The checks support an author's psychological review; they do not replace the author's judgement about whether a character's behaviour feels emotionally true.
