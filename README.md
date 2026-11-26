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
npm run validate
npm run chapter:show -- 1
```

`npm run validate` checks registry/chapter structure and reports evidence-based continuity warnings for character behavior annotations, knowledge timing, age/timeline consistency, relationship transitions, promise timing, event dates and story-structure mappings. Warnings require human review; structural errors fail validation. See [Continuity Checks](docs/CONTINUITY_CHECKS.md) and [Story Structure Management](docs/STORY_STRUCTURE.md).

Start with the [Story Bible](docs/STORY_BIBLE.md), [Mana World System](docs/WORLD_SYSTEM_MANA.md), [Elemental Affinity System](docs/WORLD_SYSTEM_AFFINITY.md), [World Order](docs/WORLD_ORDER.md), and [Seven Elemental Families](docs/WORLD_SYSTEM_SEVEN_FAMILIES.md) for the premise, cultivation foundations, elemental rules, political institutions, family identities, beast-breeding economy and unresolved worldbuilding proposals. See [Engine Guide](docs/ENGINE_GUIDE.md), [Record Schema](docs/RECORD_SCHEMA.md), and [Roadmap](docs/ROADMAP.md) for engine usage.

The engine does not invent canon. Add only author-confirmed facts to registries; keep theories and unresolved questions explicitly labelled. Story structure may be planned, but source/provenance should be recorded and no outline is silently treated as a confirmed event.

## Change notes

### 2026-11-27 — Story structure management

- Added `17_STORY_STRUCTURE_REGISTRY` for main plots, subplots, character arcs, sub-arcs and mystery arcs, with hierarchy, dependencies, milestones, chapter mapping and source notes.
- Added `story:new`, `story:list` and `story:show` commands and chapter-level `storyLinks`.
- Extended validation for story references, legal parent types, dependency/hierarchy cycles, chapter links and provenance warnings.
- Added story-structure tests and documentation. Validation reports structural problems; it does not infer narrative meaning or alter canon.

### 2026-11-27 — Continuity validation

- Added six continuity review areas to `npm run validate`: personality review annotations, character knowledge timing, age/date checks, relationship transitions, promise timing and event-date contradictions.
- Added optional chapter annotation fields and initialized them in newly created chapter records.
- Added continuity schema documentation and automated tests. Findings are warnings for human review; structural validation remains responsible for the command's pass/fail status.
