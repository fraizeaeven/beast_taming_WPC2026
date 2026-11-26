# Engine Guide

Requires Node.js 20+. No third-party dependencies.

## Setup
```bash
npm run init
npm test
npm run validate
```

## Story structure workflow
1. Create the main plot: `npm run story:new -- PLOT_MAIN main_plot "Main conflict"`.
2. Create subplots, character arcs, sub-arcs and mystery arcs with unique stable IDs.
3. Edit `CHAPTER_RECORDS/17_STORY_STRUCTURE_REGISTRY` to add parent links, goals, conflicts, stakes, milestones, dependencies and source notes.
4. Map each story unit to the chapters it affects, then add matching `storyLinks` to those chapter records.
5. Run `npm run validate` and review all errors and warnings.

See [Story Structure Management](STORY_STRUCTURE.md) for supported hierarchy rules and examples.

## Character state workflow
1. Add a snapshot to `CHAPTER_RECORDS/18_CHARACTER_STATE_HISTORY` when a character reaches a meaningful emotional, behavioural or arc checkpoint.
2. Record the character's goal, motivation, misbelief, truth recognition, behaviour, physical/emotional state, decision and consequence where known.
3. Record the seven-stage position with concrete stage evidence; mark deliberate regression explicitly.
4. Query a historical state with `npm run character:state -- CHAR_ID 24`, or inspect the full history with `npm run character:history -- CHAR_ID`.
5. Run `npm run validate`. A query uses the latest recorded snapshot at or before the requested chapter and reports its age; it never invents missing transitions.

See [Historical Character State Tracking](CHARACTER_STATE_HISTORY.md) for the snapshot schema and stage definitions.

## Knowledge and timeline workflow
1. Record established character/fact knowledge in `15_KNOWLEDGE_TRACKER`, including the chapter and method of acquisition; mark backstory knowledge explicitly.
2. Record later learning or forgetting in chapter `knowledgeChanges`. Use `knowledge:state` and `knowledge:who-knows` to query historical boundaries.
3. Record dated events and explicit event dependencies in `10_EVENT_TIMELINE`; use `timeline:chapter` to inspect a chapter.
4. Record object transfers in `objectChanges` and location ownership changes in `locationChanges`; use the history commands to reconstruct them.
5. Add explicit restricted facts to `14_POV_WHITELIST` when a POV character must not know them, then run validation.

See [Knowledge and Timeline Engine](KNOWLEDGE_AND_TIMELINE.md) for fields, commands and limitations.

## Chapter drafting workflow
1. Review and update the chapter's participants, POV, locations and story links.
2. Generate its preflight: `npm run context:chapter -- 1` or `npm run context:write -- 1`.
3. Review the retrieved character, relationship, knowledge, event, plot, promise and unresolved-thread records. Follow any source references where needed.
4. Draft the chapter. Do not treat missing information as permission to invent canon.
5. Record chapter events and proposed changes with stable IDs; update registries only after author approval.
6. Run `npm run validate` and review all warnings before locking the chapter.

See [Chapter Context Retrieval](CHAPTER_CONTEXT.md) for retrieval rules and limitations.

## AI-assisted chapter workflow
1. Prepare a chapter-specific prompt and context: `npm run draft:prepare -- 12 drafts/chapter-0012.md`.
2. Submit the generated Markdown prompt to your chosen AI model and save its JSON-only analysis response.
3. Stage findings and proposed changes: `npm run draft:stage -- reports/chapter-0012-analysis.json`. Staging does not modify canon.
4. Inspect the review with `draft:list` and `draft:show`, then approve or reject proposals one at a time.
5. Approval checks stable IDs, allowed target fields and exact pre-change snapshots; stale proposals fail instead of overwriting newer records.
6. Run validation after approvals. AI findings and confidence are advisory; the author decides what becomes canon.

See [AI-Assisted Chapter Workflow](AI_ASSISTED_CHAPTER_WORKFLOW.md). The current implementation is provider-neutral and does not invoke an AI API.

## Principles
- Brainstorming is not canon; only confirmed facts enter canon registries.
- Unknown is not false; preserve uncertainty.
- A chapter record is an evidence log of what happened and changed.
- Retcons require an entry in 16_CONTINUITY_LEDGER.
- Structural validation checks record integrity. Continuity validation checks explicit age, knowledge, POV, relationship, promise, event, object/location and story-structure annotations; it does not interpret prose or make canon decisions.
- Continuity findings are warnings for human review, not automatic edits.
- Story structure records represent author-maintained intent and progression. They do not automatically create events, character facts or canon.
- Character state snapshots are historical checkpoints, not continuous psychological simulation.
- Chapter context is a retrieval snapshot, not a canon update or an instruction to resolve every retrieved thread.

## Status
planned → drafted → reviewed → locked. Changes to locked chapters require a continuity decision.

## IDs
Use stable uppercase IDs such as CHAR_KAEL, EVT_CEREMONY_001, LOC_DARK_ESTATE, MYS_ORIGIN_OATH and ARC_KAEL_TRUST. Never reuse IDs.
