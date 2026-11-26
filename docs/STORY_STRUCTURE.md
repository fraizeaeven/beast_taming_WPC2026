# Story Structure Management

The story structure registry gives every long-running narrative unit a stable ID. It is an index of story intent and progression, not a replacement for canon, character, knowledge, event, mystery or promise registries.

## Supported types

- `main_plot`: the novel's central conflict.
- `subplot`: a secondary plotline, normally nested under a main plot.
- `character_arc`: one character's transformation or refusal to transform.
- `sub_arc`: a bounded movement within a larger arc.
- `mystery_arc`: a question-and-revelation thread.

Hierarchy rules: a main plot has no parent; a subplot belongs to a main plot; a character arc belongs to a main plot or subplot; a sub-arc belongs to a character arc, subplot or mystery arc; a mystery arc belongs to a main plot or subplot. Use `dependencies` for prerequisite story units that are not the parent.

## Create and inspect records

```bash
npm run init
npm run story:new -- PLOT_MAIN main_plot "The Beast Taming Conflict"
npm run story:new -- ARC_KAEL character_arc "Kael learns to trust"
npm run story:list
npm run story:show -- ARC_KAEL
npm run validate
```

The command creates a planned skeleton. Edit `CHAPTER_RECORDS/17_STORY_STRUCTURE_REGISTRY` to fill in the outline. Existing records are not overwritten.

## Record shape

```json
{
  "id": "ARC_KAEL",
  "type": "character_arc",
  "title": "Kael learns to trust",
  "status": "active",
  "parentId": "PLOT_MAIN",
  "objective": "Earn trust without surrendering judgment",
  "conflict": "Past betrayal makes dependence feel dangerous",
  "stakes": "Isolation puts allies and the mission at risk",
  "startChapter": 3,
  "targetEndChapter": 42,
  "characterIds": ["CHAR_KAEL"],
  "chapters": [
    { "chapter": 3, "role": "first resistance" },
    { "chapter": 12, "role": "cost of refusal" }
  ],
  "milestones": [
    { "id": "MILESTONE_REFUSAL_COST", "title": "His refusal harms an ally", "chapter": 12, "status": "planned" }
  ],
  "dependencies": ["SUBPLOT_ALLIANCE"],
  "resolutionCriteria": ["He chooses trust while understanding its risk"],
  "source": { "kind": "author_note", "reference": "Character outline, approved" }
}
```

Keep the seven-stage character development framework in the arc's milestone sequence. Do not force every arc to advance one stage per chapter: characters can regress, stall, or make partial progress. Record the stage and evidence in milestone notes or your character arc tracker; the story structure record only maps the arc and its checkpoints.

## Chapter mapping

Each story record's `chapters` array identifies chapters that advance, establish, complicate or resolve it. Add the reciprocal link to that chapter JSON:

```json
"storyLinks": [
  { "storyId": "ARC_KAEL", "role": "complication" }
]
```

Roles are free-text author labels (for example: setup, escalation, complication, reversal, payoff, resolution). A mismatch between the registry and chapter record produces a warning, not an automatic edit.

## Validation behaviour

`npm run validate` checks:
- unique stable IDs (shared registry structural validation);
- supported types/statuses and legal parent-child types;
- missing parents, characters, chapter references and dependencies;
- duplicate chapter and milestone IDs;
- parent and dependency cycles;
- chapter-to-story reciprocal mapping;
- source/provenance completeness (warning only).

Errors block validation. Warnings require author review. The engine never infers plot structure from prose or writes canon automatically. Planned outlines are allowed; missing or unresolved story details should remain explicit rather than guessed.
