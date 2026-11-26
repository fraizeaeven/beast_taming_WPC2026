# Roadmap

## v1.0 — Record foundation
Screenshot-aligned registries, chapter records, CLI and structural validation.

## v1.1 — Continuity foundation
Timeline/age consistency, relationship transitions, POV knowledge boundaries, promise tracking, object ownership and location history. The continuity-validation branch adds evidence-based warnings for explicitly recorded continuity facts.

## v1.2 — Story structure management
Stable IDs and hierarchy for main plots, subplots, character arcs, sub-arcs and mystery arcs; milestones, dependencies, chapter mapping and source provenance. The first implementation is available in [Story Structure Management](STORY_STRUCTURE.md).

## v1.3 — Chapter context retrieval
Deterministic chapter preflight that assembles linked canon, character and relationship records, knowledge boundaries, plot/arc context, events, promises and unresolved constraints. It does not infer relevance from prose or write canon.

## v1.4 — Historical character state
Character state snapshots, seven-stage character development tracking (including regression and stalled change), emotional/behavioural progression, relationship history and reconstruction of a character's state at a given chapter. Implemented in [Historical Character State Tracking](CHARACTER_STATE_HISTORY.md).

## v1.5 — Knowledge and timeline engine
Historical knowledge queries, explicit POV knowledge boundaries, chapter event retrieval, event date/order checks, and object/location transfer history. Implemented in [Knowledge and Timeline Engine](KNOWLEDGE_AND_TIMELINE.md). In-world calendar expansion, travel-duration modelling and richer event dependency analysis remain follow-up work.

## v1.6 — AI-assisted chapter workflow
Provider-neutral chapter analysis prompt, grounded context, structured findings with evidence/confidence, staged registry/chapter proposals and explicit per-proposal approval. Implemented in [AI-Assisted Chapter Workflow](AI_ASSISTED_CHAPTER_WORKFLOW.md). AI inference is performed by a user-selected model; no provider API is called by the engine.

## v1.7 — Character psychology and emotional analysis\nScene-level psychological beat annotations, automatic reactions, thoughts, emotions, physical sensations, expressed emotion, underlying needs, misbeliefs, choices and evidence-backed seven-stage arc review. Implemented in [Character Psychology and Emotional Analysis](CHARACTER_PSYCHOLOGY.md). AI-assisted interpretation remains advisory and author-approved.\n\n## v2.0 — Novel continuity intelligence
Cross-chapter contradiction graph, payoff coverage, mystery/foreshadowing tracking, historical queries and impact analysis when earlier canon is revised.

## Recommended implementation order

1. Complete and review story structure records.
2. Use chapter context retrieval as the drafting preflight.
3. Use historical character-state, knowledge and timeline queries during drafting.
4. Use the AI-assisted chapter workflow and review every proposed change.\n5. Record psychology beats only when supported by the draft and author-confirmed interpretation.
