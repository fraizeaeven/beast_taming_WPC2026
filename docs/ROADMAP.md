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

## v1.7 — Character psychology and emotional analysis
Scene-level psychological beat annotations, automatic reactions, thoughts, emotions, physical sensations, expressed emotion, underlying needs, misbeliefs, choices and evidence-backed seven-stage arc review. Implemented in [Character Psychology and Emotional Analysis](CHARACTER_PSYCHOLOGY.md). AI-assisted interpretation remains advisory and author-approved.

## v1.8 — Scene-level character behaviour
Observable action, dialogue behaviour, body language, avoidance, observer perception and interpretation, relationship impact, scene outcomes and causal links. Implemented in [Scene-Level Character Behaviour Engine](SCENE_LEVEL_BEHAVIOUR.md). Behaviour evidence is separated from interpretation; author approval remains required for AI-proposed records.

## v1.9 — Scene construction and emotional pacing
Scene goals, opposition, conflict, stakes, escalation, turning points/reversals, emotional shifts, outcomes, exit hooks, purpose coverage and ordered tension variation. Implemented in [Scene Construction and Emotional Pacing](SCENE_CONSTRUCTION_AND_PACING.md). Tension is author-estimated; deliberate breathers and transitions are supported rather than forced into a rising curve.

## v2.0 — Novel continuity intelligence
Implemented in [Novel Continuity Intelligence](NOVEL_CONTINUITY_INTELLIGENCE.md): explicit cross-chapter canon assertion conflicts, mystery clue/reveal sequencing, open-loop resolution evidence, promise/payoff coverage, foreshadowing summaries and read-only exact-ID canon impact analysis. Findings are advisory and do not change canon.

## v2.1 — Narrative intelligence and character consistency
Implemented in [Narrative Intelligence and Character Consistency](NARRATIVE_INTELLIGENCE.md): explicit goal/motivation conflict review, consequence follow-through, historical relationship-state changes, evidence-backed seven-stage transitions and story milestone prerequisites. Findings remain advisory and rely on author/model annotations rather than semantic inference.

## v2.2 — Character decision and behaviour intelligence
Implemented in [Character Decision and Behaviour Intelligence](DECISION_INTELLIGENCE.md): annotated causal chains from trigger and automatic reaction through interpretation, activated belief, emotion/body, expression, deliberate choice, consequence, misbelief effect and arc effect. Includes prior-experience references, repeated strategy/cost review and optional consequence-to-state carry-through. Findings remain advisory and rely on explicit annotations.

## v2.3 — Relationship psychology intelligence
Implemented in [Relationship Psychology Intelligence](RELATIONSHIP_PSYCHOLOGY_INTELLIGENCE.md): two-sided interaction causality from initiator intent/fear and behaviour through responder interpretation/reaction and feedback; evidence-backed trust, power, boundary and relationship shifts; repeated defensive strategies; repair attempts/outcomes; and exact relationship participant references. Findings are advisory; the engine does not infer private states or force reconciliation.

## v2.4 — Emotional scene intelligence

Implemented in [Emotional Scene Intelligence](EMOTIONAL_SCENE_INTELLIGENCE.md): objective scene events versus individual character interpretations, evidence-backed perspective gaps and misreads, concealed-information holders, reader-only knowledge, belief updates and reveal/setup references. Context retrieval carries earlier character-linked interpretations forward. Findings are advisory and do not infer private states or write canon.

## v2.5 — Narrative consequence intelligence

Implemented in [Narrative Consequence Intelligence](NARRATIVE_CONSEQUENCE_INTELLIGENCE.md): explicit source-linked consequences, cross-chapter causal chains, affected-character responses, impact domains, evidence-backed relationship/state effects, scheduled follow-up and optional character-state carry-through. The report is read-only; validation does not infer causation or force transformation.

## Recommended implementation order

1. Complete and review story structure records.
2. Use chapter context retrieval as the drafting preflight.
3. Use historical character-state, knowledge and timeline queries during drafting.
4. Use the AI-assisted chapter workflow and review every proposed change.
5. Record psychology, scene behaviour and scene construction only when supported by the draft and author-confirmed interpretation.
