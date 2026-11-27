# Beast Taming WPC2026

A local-first continuity and chapter-record engine for the Beast Taming novel. It uses the screenshot-aligned `CHAPTER_RECORDS` registries as structured canon memory.

## Requirements

- Node.js 20 or newer
- No third-party runtime dependencies

## Quick start

```bash
npm run init
npm test
npm run chapter:new -- 1 "The Youngest Son"
npm run story:new -- PLOT_MAIN main_plot "The central Beast Taming conflict"
npm run context:chapter -- 1
npm run character:state -- CHAR_KAEL 24
npm run validate
npm run chapter:show -- 1
```

Use `npm run context:chapter -- 86` to print a chapter-specific writing brief, or `npm run context:write -- 86` to save `reports/CHAPTER_0086_CONTEXT.md`. The context brief gathers linked character, relationship, knowledge, plot, event, location, mystery, promise and unresolved-thread records. It is a retrieval snapshot, not new canon. See [Chapter Context Retrieval](docs/CHAPTER_CONTEXT.md).

Use `npm run character:state -- CHAR_KAEL 24` to reconstruct the latest recorded character snapshot at or before chapter 24, or `npm run character:history -- CHAR_KAEL` to list the full history. The snapshot includes author-recorded emotional/physical state, goals, motivation, misbelief, arc stage and evidence, relationships, decisions and consequences. No unrecorded state is interpolated. See [Historical Character State Tracking](docs/CHARACTER_STATE_HISTORY.md).

Use `npm run character:intelligence` to review goal/motivation consistency, recorded consequences, relationship-state transitions, seven-stage arc evidence and story setup dependencies. Add `-- CHAR_KAEL` to filter to one character. Findings are advisory and based on explicit annotations rather than semantic guesses. See [Narrative Intelligence and Character Consistency](docs/NARRATIVE_INTELLIGENCE.md).

Use `npm run character:decision` to review the annotated cause-and-effect chain behind character choices, including activated beliefs, prior experience references, decision rationale, repeated strategies, consequence carry-through and effects on misbelief/arc. Add `-- CHAR_KAEL` to filter. The report distinguishes personality-consistent decisions from wise decisions; it does not infer psychology from prose. See [Character Decision and Behaviour Intelligence](docs/DECISION_INTELLIGENCE.md).

Use `npm run relationship:psychology` to review two-sided relationship interactions: initiator intent/fear, responder interpretation and reaction, trust impact, power dynamics, boundaries, defensive patterns, repair attempts and relationship shifts. Add `-- REL_KAEL_LINA` to filter. Checks are evidence-based and do not assume apologies restore trust or force reconciliation. See [Relationship Psychology Intelligence](docs/RELATIONSHIP_PSYCHOLOGY_INTELLIGENCE.md).

Use `npm run psychology:chapter -- 12` to inspect a chapter's psychological beats, or `npm run psychology:character -- CHAR_KAEL` to see a character's recorded psychology across chapters. Each beat can track trigger, automatic reaction, thought, emotion, physical sensation, expressed emotion, need, misbelief, choice, consequence, observable evidence and interpretation. See [Character Psychology and Emotional Analysis](docs/CHARACTER_PSYCHOLOGY.md).

Use `npm run scene:behaviour -- 12` to inspect scene interaction records, or `npm run scene:behaviour -- 12 SCENE_12_03` to filter one scene. Use `npm run scene:character -- CHAR_KAEL` to follow a character's actions and interactions across chapters. Each `sceneBehaviourChecks` beat tracks action, dialogue behaviour, body language, avoidance, observer observation versus interpretation, relationship impact, scene outcome, causal link and arc effect. Validation checks references and evidence completeness; it does not infer private thoughts or decide whether a relationship/arc change is earned. See [Scene-Level Character Behaviour Engine](docs/SCENE_LEVEL_BEHAVIOUR.md).

Use `npm run scene:construction -- 12` to inspect scene goals, conflict, stakes, escalation, turning points, emotional shifts, outcomes, hooks and story-purpose coverage. Use `npm run scene:pacing -- 12` to see ordered scene tension estimates and transitions across the chapter. Tension is an author judgement, not an automatic quality score; intentional breathers and transitions can carry a documented purpose. See [Scene Construction and Emotional Pacing](docs/SCENE_CONSTRUCTION_AND_PACING.md).

Use `npm run draft:prepare -- 12 drafts/chapter-0012.md` to build an AI review prompt with recorded chapter context. Submit the prompt to your chosen AI model, save its JSON response, then use `npm run draft:stage -- reports/chapter-0012-analysis.json` to stage findings and proposals. Inspect with `draft:list` / `draft:show`, then approve or reject each proposal individually with `draft:approve` / `draft:reject`. Staging never changes canon; approval applies only validated proposals. This is provider-neutral and does not call an AI API. See [AI-Assisted Chapter Workflow](docs/AI_ASSISTED_CHAPTER_WORKFLOW.md).

Use `npm run knowledge:state -- CHAR_KAEL 12` to reconstruct a character's knowledge at a chapter, `npm run knowledge:who-knows -- FACT_ID 12` to list who knows a fact, `npm run timeline:chapter -- 12` to inspect the chapter timeline, and `npm run object:history -- OBJ_ID` / `npm run location:history -- LOC_ID` to inspect transfer history. See [Knowledge and Timeline Engine](docs/KNOWLEDGE_AND_TIMELINE.md).

### v2.0 — Novel continuity intelligence

Use `npm run intelligence:report` to review mystery reveals, clue placement, open-loop resolution, promise/payoff coverage, foreshadowing and cross-chapter canon assertion conflicts. Use `npm run intelligence:impact -- 01_CANON_REGISTRY FACT_ID` before revising a canon record to list exact-ID registry and chapter references, including one-hop dependent chapters. Run `npm run validate` to include these checks in the continuity warnings. See [Novel Continuity Intelligence](docs/NOVEL_CONTINUITY_INTELLIGENCE.md).

`npm run validate` checks registry/chapter structure and reports evidence-based continuity warnings for character behaviour annotations, knowledge timing, age/timeline consistency, relationship transitions, promise timing, event dates, story-structure mappings, explicit cross-chapter canon assertions, mystery clues/reveals, open loops and payoff timing. Warnings require human review; structural errors fail validation. See [Continuity Checks](docs/CONTINUITY_CHECKS.md), [Story Structure Management](docs/STORY_STRUCTURE.md) and [Novel Continuity Intelligence](docs/NOVEL_CONTINUITY_INTELLIGENCE.md).

Start with the [Story Bible](docs/STORY_BIBLE.md), [Mana World System](docs/WORLD_SYSTEM_MANA.md), [Elemental Affinity System](docs/WORLD_SYSTEM_AFFINITY.md), [World Order](docs/WORLD_ORDER.md), and [Seven Elemental Families](docs/WORLD_SYSTEM_SEVEN_FAMILIES.md) for the premise, cultivation foundations, elemental rules, political institutions, family identities, beast-breeding economy and unresolved worldbuilding proposals. See [Engine Guide](docs/ENGINE_GUIDE.md), [Record Schema](docs/RECORD_SCHEMA.md), and [Roadmap](docs/ROADMAP.md) for engine usage.

The engine does not invent canon. Add only author-confirmed facts to registries; keep theories and unresolved questions explicitly labelled. Story structure may be planned, but source/provenance should be recorded and no outline is silently treated as a confirmed event.

## Change notes
### 2026-11-27 — Relationship psychology intelligence (v2.3)

- Added two-sided interaction analysis for initiator intent/fear/behaviour and responder interpretation/reaction, including explicit misread evidence and feedback patterns.
- Added trust, power, boundary, defensive-strategy, repair-attempt and relationship-shift evidence checks, plus relationship/participant reference validation.
- Added `relationship:psychology`, integrated advisory findings into `npm run validate`, extended AI review prompts and chapter proposal allowlists, and added tests/documentation. No relationship or canon state is changed automatically.

### 2026-11-27 — Character decision and behaviour intelligence (v2.2)

- Added a causal decision review for interpretation/belief activation, prior experience links, decision rationale, repeated strategies, explicitly worsening consequences, response mismatches and misbelief/arc effects.
- Added consequence-to-character-state carry-through checks and the `character:decision` report.
- Extended the AI chapter-review prompt and added focused tests/documentation. Findings are advisory and depend on explicit annotations; no psychological state is inferred from prose and canon is never changed automatically.

### 2026-11-27 — Narrative intelligence and character consistency (v2.1)

- Added explicit checks for goal/motivation conflicts, consequential choices without recorded outcomes, and scheduled consequence follow-through.
- Added historical checks for unexplained goal/motivation changes, relationship-state changes, unsupported multi-stage arc jumps and transformation evidence.
- Added story-unit and milestone prerequisite ordering checks, plus the `character:intelligence` report command.
- Extended AI chapter review guidance and added tests/documentation. Findings are advisory; the engine does not infer psychology from prose or modify canon automatically.

### 2026-11-27 — Novel continuity intelligence (v2.0)

- Added explicit cross-chapter canon assertion conflict detection using stable fact IDs and retcon markers.
- Added mystery setup/clue/reveal sequencing, open-loop resolution evidence, promise/payoff coverage and foreshadowing summaries.
- Added read-only exact-ID canon impact analysis across registries and chapter records, including one-hop dependent chapters.
- Added `intelligence:report` and `intelligence:impact` commands; integrated v2.0 findings into `npm run validate`.
- Reused existing registries; added tests and documentation. Findings remain review warnings and never trigger automatic canon changes.

### 2026-11-27 — Scene construction and emotional pacing (v1.9)

- Added `sceneConstructionChecks` records for scene goals, opposition, conflict, stakes, escalation, turning points/reversals, emotional shifts, outcomes, hooks, tension estimates and story-purpose coverage.
- Added `scene:construction` and `scene:pacing` queries for ordered scene review and tension transitions.
- Extended validation and AI-assisted review for scene purpose, emotional rhythm, deliberate breathers and scene-sequence pacing.
- Added tests and documentation. Tension remains author-estimated; the engine does not enforce a formula or automatically rewrite scenes.

### 2026-11-27 — Scene-level character behaviour (v1.8)

- Added `sceneBehaviourChecks` chapter annotations for action, dialogue behaviour, body language, avoidance, observer observation/interpretation, relationship impact, scene outcome, causal links and arc evidence.
- Added chapter and character-history queries: `scene:behaviour` and `scene:character`.
- Extended validation and AI review prompts to distinguish observable behaviour from observer interpretation and private thoughts.
- Added tests and documentation. AI proposals remain staged and require explicit author approval.

### 2026-11-27 — Knowledge and timeline engine

- Added historical knowledge reconstruction and who-knows queries, including recorded learning and forgetting events.
- Added explicit POV restricted-knowledge, event chronology, object ownership/location transfer and location ownership checks.
- Added chapter timeline, object history and location history commands; extended new chapter records with locationChanges.
- Added tests and documentation. Findings remain review warnings; no prose inference or automatic canon edits.

### 2026-11-27 — Historical character state tracking

- Added `18_CHARACTER_STATE_HISTORY` for chapter-indexed emotional, physical, motivational, belief, behavioural and relationship snapshots.
- Added historical reconstruction and history-list commands; queries return the latest recorded snapshot at or before a chapter without interpolating missing states.
- Added seven-stage arc validation for stage range, evidence, duplicate snapshots and explicitly marked regression.
- Added tests and documentation; snapshots remain author-confirmed and do not automatically change canon.

### 2026-11-27 — Chapter context retrieval

- Added deterministic chapter preflight retrieval for linked character, relationship, knowledge, plot/arc, event, location, mystery, open-loop, promise and continuity records.
- Added future milestone and unresolved-thread constraints, plus explicit retrieval-scope and missing-registry reporting.
- Added `context:chapter` and `context:write` commands; generated Markdown briefs stay in `reports/` and do not alter canon.
- Added context retrieval tests and documentation. Retrieval uses explicit links and stable IDs; it does not infer relevance from prose or write canon.

### 2026-11-27 — Story structure management

- Added `17_STORY_STRUCTURE_REGISTRY` for main plots, subplots, character arcs, sub-arcs and mystery arcs, with hierarchy, dependencies, milestones, chapter mapping and source notes.
- Added `story:new`, `story:list` and `story:show` commands and chapter-level `storyLinks`.
- Extended validation for story references, legal parent types, dependency/hierarchy cycles, chapter links and provenance warnings.
- Added story-structure tests and documentation. Validation reports structural problems; it does not infer narrative meaning or alter canon.

### 2026-11-27 — Continuity validation

- Added six continuity review areas to `npm run validate`: personality review annotations, character knowledge timing, age/date checks, relationship transitions, promise timing and event-date contradictions.
- Added optional chapter annotation fields and initialized them in newly created chapter records.
- Added continuity schema documentation and automated tests. Findings are warnings for human review; structural validation remains responsible for the command's pass/fail status.
