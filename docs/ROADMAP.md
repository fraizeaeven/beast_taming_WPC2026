# Roadmap

## v1.0 — Record foundation
Screenshot-aligned registries, chapter records, CLI and structural validation.

## v1.1 — Continuity foundation
Timeline/age consistency, relationship transitions, POV knowledge boundaries, promise tracking, object ownership and location history. The current continuity-validation branch adds evidence-based warnings for explicitly recorded continuity facts.

## v1.2 — Story structure management
Stable IDs and hierarchy for main plots, subplots, character arcs, sub-arcs and mystery arcs; milestones, dependencies, chapter mapping and source provenance. The first implementation is available in [Story Structure Management](STORY_STRUCTURE.md).

## v1.3 — Historical character state
Character state snapshots, seven-stage character development tracking (including regression and stalled change), emotional/behavioural progression, relationship history and reconstruction of a character's state at a given chapter.

## v1.4 — Knowledge and timeline engine
Historical knowledge queries, in-world calendar and age calculations, event order, object ownership/location history and POV knowledge boundaries.

## v1.5 — AI-assisted chapter workflow
Chapter preflight context retrieval, AI-assisted chapter analysis, source evidence and confidence labels, proposed registry diffs and explicit human approval. No automatic canon writes.

## v2.0 — Novel continuity intelligence
Cross-chapter contradiction graph, payoff coverage, mystery/foreshadowing tracking, historical queries and impact analysis when earlier canon is revised.

## Recommended implementation order

1. Complete and review v1.2 story structure records.
2. Build chapter context retrieval so drafting starts with relevant canon, character state, knowledge, relationships, active plotlines, promises and unresolved constraints.
3. Add historical character-state and knowledge queries.
4. Add AI ingestion only after retrieval and provenance are reliable.
