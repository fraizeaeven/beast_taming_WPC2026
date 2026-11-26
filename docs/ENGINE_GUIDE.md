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

## Chapter workflow
1. Review canon, character, world-state, knowledge, promise, open-loop and story-structure records relevant to the chapter.
2. Create a shell: `npm run chapter:new -- 1 "Chapter title"`.
3. Draft prose and fill the chapter JSON, including story links and continuity annotations where known.
4. Update affected registries using stable IDs.
5. Run `npm run validate`; resolve structural errors and review continuity warnings.
6. Lock a chapter only after human continuity review.

## Principles
- Brainstorming is not canon; only confirmed facts enter canon registries.
- Unknown is not false; preserve uncertainty.
- A chapter record is an evidence log of what happened and changed.
- Retcons require an entry in 16_CONTINUITY_LEDGER.
- Structural validation checks record integrity. Continuity validation checks explicit age, knowledge, relationship, promise, event and story-structure annotations; it does not interpret prose or make canon decisions.
- Continuity findings are warnings for human review, not automatic edits.
- Story structure records represent author-maintained intent and progression. They do not automatically create events, character facts or canon.

## Status
planned → drafted → reviewed → locked. Changes to locked chapters require a continuity decision.

## IDs
Use stable uppercase IDs such as CHAR_KAEL, EVT_CEREMONY_001, LOC_DARK_ESTATE, MYS_ORIGIN_OATH and ARC_KAEL_TRUST. Never reuse IDs.
