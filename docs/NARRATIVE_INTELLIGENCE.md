# Narrative Intelligence and Character Consistency (v2.1)

v2.1 adds evidence-led review across character motivation, emotional consequence, relationship development, seven-stage arc progression and explicit narrative dependencies. It does not infer private psychology from prose or decide whether a character's choices are correct.

## Commands

```bash
npm run character:intelligence
npm run character:intelligence -- CHAR_KAEL
npm run validate
```

The full report lists findings for registered characters and story dependencies. A character ID filters the report to that character. Validation includes these findings as advisory warnings.

## Motivation and choices

Psychology beats may include `activeGoal`, `motivation`, `goalAlignment`, `decisionRationale` and `conflictEvidence`. When a choice is explicitly marked as conflicting with the active goal, the engine asks for a rationale or evidence. It does not semantically compare free-text goals and decisions.

A recorded `deliberateChoice` without a `consequence` produces a warning. Optional `consequenceTracking` schedules later follow-through:

```json
{
  "consequenceTracking": {
    "expectedByChapter": 18,
    "recordedInChapter": 17,
    "evidence": "The ally refuses help after the earlier betrayal."
  }
}
```

If the expected chapter has passed without a recorded follow-through chapter, validation warns. The author decides whether the consequence was intentionally deferred, avoided or resolved off-page.

## Character state and seven-stage arcs

Snapshots in `18_CHARACTER_STATE_HISTORY` are compared chronologically. The engine flags unexplained changes to `activeGoal` or `motivation`, unsupported jumps of more than one arc stage, stage-five snapshots without explicit truth recognition, and stage-seven transformations lacking a recorded truth, decision and consequence.

A multi-stage jump may be justified by a major turning point; record `transitionEvidence` on the later snapshot. Stalled, partial, setback and regression remain valid. No rule requires advancement every chapter.

## Relationship development

When a character's `relationshipStates` changes between snapshots, record a `reason` or `evidence` on the new relationship-state entry. The check compares explicit state labels only; it does not assign numeric trust scores or infer the meaning of labels such as `strained`, `broken` or `trusting`.

## Narrative setup dependencies

Story-unit `dependencies` are checked for suspicious chapter order when both units have explicit `startChapter` values. Milestones may declare `dependsOn: ["MILESTONE_ID"]`. The engine checks prerequisite IDs and flags a dependent milestone dated before its prerequisite. These are review warnings: overlapping plotlines and intentional reversals may be valid.

## Optional fields

- Psychology beat: `activeGoal`, `motivation`, `goalAlignment` (`aligned`, `conflicts`, `unclear`), `decisionRationale`, `conflictEvidence`, and `consequenceTracking.expectedByChapter`, `recordedInChapter`, `evidence`.
- Character snapshot: `goalChangeReason`, `motivationChangeReason`, `transitionEvidence`, and `relationshipStates[].reason` or `relationshipStates[].evidence`.
- Story milestone: `milestones[].dependsOn`, an array of stable milestone IDs.

## Warning codes

`CHARACTER_CHOICE_CONSEQUENCE_UNRECORDED`, `CHARACTER_MOTIVATION_CONFLICT_UNEXPLAINED`, `CHARACTER_CONSEQUENCE_FOLLOW_THROUGH_MISSING`, `CHARACTER_CONSEQUENCE_CHAPTER_PRECEDES_TRIGGER`, `CHARACTER_CONSEQUENCE_EVIDENCE_MISSING`, `CHARACTER_GOAL_SHIFT_UNEXPLAINED`, `CHARACTER_MOTIVATION_SHIFT_UNEXPLAINED`, `CHARACTER_ARC_STAGE_JUMP_UNSUPPORTED`, `CHARACTER_ARC_HARM_RECOGNITION_UNRECORDED`, `CHARACTER_TRANSFORMATION_SUPPORT_INCOMPLETE`, `RELATIONSHIP_STATE_CHANGE_UNEXPLAINED`, `STORY_DEPENDENCY_STARTS_BEFORE_SETUP`, `STORY_MILESTONE_DEPENDENCY_MISSING`, `STORY_MILESTONE_DEPENDENCY_ORDER_CONFLICT`.

All findings are advisory. Existing validators retain responsibility for malformed IDs, missing references and invalid stage values. No record is automatically changed.
