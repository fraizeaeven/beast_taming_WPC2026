# Narrative Consequence Intelligence

## Purpose

v2.5 connects explicit character decisions and other source events to their immediate and delayed effects. A consequence is recorded as an observable change in an affected character, not as an abstract judgement that a choice was good or bad.

## Chapter field

Chapters may include `consequenceChecks: []`. Each record supports:

- `id`, `order`: stable consequence ID and optional within-chapter ordering.
- `source`: `kind` (`decision`, `relationship`, `scene`, `behaviour`, `construction`, or `consequence`), `recordId`, and source `chapter`.
- `causedByConsequenceId`: optional preceding consequence that produced this downstream effect.
- `initiatingCharacterId`, `affectedCharacterId`: who initiated the causal chain and whose response/state is affected.
- `description`, `responseBehaviour`, `resultingDecision`, `impactDomains[]`, and `evidence`, plus `causalEvidence` explaining the recorded source-to-effect link.
- `relationshipImpact`: optional relationship ID, prior/current state and evidence.
- `characterStateImpact`: optional goal, motivation, belief or arc effect with evidence.
- `followUp`: optional expected chapter, status (`pending`, `observed`, `not_applicable`), observed chapter and evidence.
- `stateCarryForward.required`: when true, a later state snapshot must list this consequence ID in `consequenceReferences`.

## Validation

Structural errors cover invalid/duplicate IDs, unknown characters and relationships, invalid source references, future source chapters, invalid consequence-parent links, and invalid follow-up metadata. Advisory findings cover missing consequence/response/evidence/domain annotations or causal-link evidence, unsupported relationship/state effects, overdue follow-ups, and required character-state carry-through that has not been recorded.

Only explicit annotations are evaluated. The engine does not decide whether a source truly caused an outcome, infer an unrecorded emotional reaction, force a character to change, or automatically update a relationship or state snapshot. Consequences may be resisted, delayed, reversed, partial or absent; record the observed outcome and evidence.

## Commands

```bash
npm run consequence:report
npm run consequence:report -- CHAR_KAEL
npm run validate
```

The report is read-only. AI-generated proposals remain staged and require individual author approval.
