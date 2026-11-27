# Record Schema

Registry files are JSON without filename extensions. Each has schemaVersion, registry, purpose and entries.

Chapter files are `CHAPTERS/CHAPTER_0001.json` and contain: number, title, status, POV, in-world date, summary, scenes, sceneConstructionChecks, mysteryChanges, charactersPresent, locations, events, canonChanges, knowledgeChanges, objectChanges, financialAndLegalChanges, promises, openLoops, continuityNotes and authorNotes. Optional continuity annotations include `characterAges`, `behaviorChecks`, `psychologyChecks`, `sceneBehaviourChecks`, `sceneConstructionChecks`, `knowledgeUsed`, `relationshipChanges`, `storyLinks`, `objectChanges` and `locationChanges`.

The `17_STORY_STRUCTURE_REGISTRY` stores story units with stable IDs, type, title, status, parentId, objective, conflict, stakes, chapter range, characterIds, chapters, milestones, dependencies, resolutionCriteria and source provenance. See [Story Structure Management](STORY_STRUCTURE.md) for the full shape and hierarchy rules.

The `15_KNOWLEDGE_TRACKER` registry records character/fact acquisition chapters and learning sources; chapter `knowledgeChanges` extends this history. The `10_EVENT_TIMELINE`, `06_DOCUMENT_AND_OBJECT_REGISTRY` and `09_LOCATION_REGISTRY` provide event, object and place baselines for chapter-indexed history queries. See [Knowledge and Timeline Engine](KNOWLEDGE_AND_TIMELINE.md).

Each chapter may include `psychologyChecks` scene-beat annotations: trigger, automatic reaction, immediate thought, emotion, physical sensation, outwardly expressed emotion, underlying need, misbelief, deliberate choice, consequence, observable draft evidence, interpretation and optional seven-stage arc evidence. These annotations distinguish textual observation from interpretation; validation checks references, evidence and stage range but does not judge psychological truth. See [Character Psychology and Emotional Analysis](CHARACTER_PSYCHOLOGY.md).

Each chapter may also include `sceneBehaviourChecks` for observable actions, dialogue behaviour, body language, avoidance, observer observation/interpretation, relationship impact and scene causality. `sceneConstructionChecks` records per-scene goals, opposition, conflict, stakes, escalation, turning points, emotional shifts, outcomes, exit hooks, author-estimated tension and plot/arc/relationship/revelation/decision purpose. Tension values are descriptive and do not enforce a rising curve. See [Scene-Level Character Behaviour](SCENE_LEVEL_BEHAVIOUR.md) and [Scene Construction and Emotional Pacing](SCENE_CONSTRUCTION_AND_PACING.md).

The `18_CHARACTER_STATE_HISTORY` registry stores author-confirmed historical character snapshots by character and chapter. Snapshots may record emotional/physical state, goal, motivation, misbelief, truth recognition, arc ID and seven-stage position, evidence, behaviour, relationship states, knowledge IDs, pressure, decisions, consequences and source provenance. See [Historical Character State Tracking](CHARACTER_STATE_HISTORY.md).

The v2.0 intelligence layer reuses `01_CANON_REGISTRY`, `11_MYSTERY_REGISTER`, `12_OPEN_LOOP_REGISTER`, `13_PROMISE_AND_PAYOFF_REGISTER`, `16_CONTINUITY_LEDGER` and chapter `canonChanges`, `mysteryChanges`, `openLoops` and `promises`. It compares explicit fact assertions by stable `factId`, tracks setup/clue/reveal and payoff chapter metadata, and reports exact-ID impact references. See [Novel Continuity Intelligence](NOVEL_CONTINUITY_INTELLIGENCE.md) for supported optional fields and warning codes.

Use explicit states such as confirmed, theory, planned, open, resolved and retired. Never silently convert theories into canon. References use stable registry IDs.

See [Continuity Checks](CONTINUITY_CHECKS.md) for field shapes, registry metadata and the checks performed by `npm run validate`.
