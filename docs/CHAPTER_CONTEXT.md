# Chapter Context Retrieval

The context retrieval engine builds a deterministic writing brief from the chapter record and linked registries. It is designed as a drafting preflight: retrieve recorded facts first, then draft, then submit proposed changes for human review.

## Commands

Print a context brief to the terminal:

```bash
npm run context:chapter -- 86
```

Write a Markdown brief into `reports/`:

```bash
npm run context:write -- 86
```

The output is `reports/CHAPTER_0086_CONTEXT.md`. It is generated locally and is not automatically committed to the canon registries.

## Retrieval rules

The engine includes:
- The target chapter's title, POV, date, summary, scenes, participants, locations and story links.
- Character records explicitly named as POV or participants.
- Story units mapped to the chapter or involving those characters, plus their parent plots and declared dependencies.
- Relationships, knowledge, misbeliefs/arcs, objects, financial/legal records, locations, events, mysteries, open loops, promises, POV rules and continuity entries linked by stable IDs or explicit chapter references.
- Unscoped entries in the canon and world-state registries as global reference material.
- Future story milestones and unresolved mysteries, open loops and promises as drafting constraints.

The selection is intentionally conservative. It uses recorded IDs and chapter links, not semantic interpretation of prose. Add stable IDs and reciprocal chapter/story links to improve retrieval quality.

## Limitations and author control

- A record without a usable ID or relationship field may not be retrieved as relevant.
- The engine cannot know that an unlinked record matters; maintain chapter links and registry references.
- Global canon/world-state entries without explicit references are included. Review their status and labels.
- A missing registry is reported as an omission, not silently reconstructed.
- Retrieval does not prove a fact is true, decide what a character feels, or authorize a plot payoff.
- The output is a snapshot. Rebuild it after changing chapter links or registries.
- It never writes to canon. Author-confirmed changes must still be recorded manually.

Use the brief as a checklist, not as a replacement for reading the source records or manuscript.
