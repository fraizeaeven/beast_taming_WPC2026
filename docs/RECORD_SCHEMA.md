# Record Schema

Registry files are JSON without filename extensions. Each has schemaVersion, registry, purpose and entries.

Chapter files are `CHAPTERS/CHAPTER_0001.json` and contain: number, title, status, POV, in-world date, summary, scenes, charactersPresent, locations, events, canonChanges, knowledgeChanges, objectChanges, financialAndLegalChanges, promises, openLoops, continuityNotes and authorNotes. Optional continuity annotations include `characterAges`, `behaviorChecks`, `psychologyChecks`, `knowledgeUsed`, `relationshipChanges`, `storyLinks`, `objectChanges` and `locationChanges`.

The `17_STORY_STRUCTURE_REGISTRY` stores story units with stable IDs, type, title, status, parentId, objective, conflict, stakes, chapter range, characterIds, chapters, milestones, dependencies, resolutionCriteria and source provenance. See [Story Structure Management](STORY_STRUCTURE.md) for the full shape and hierarchy rules.

The `15_KNOWLEDGE_TRACKER` registry records character/fact acquisition chapters and learning sources; chapter `knowledgeChanges` extends this history. The `10_EVENT_TIMELINE`, `06_DOCUMENT_AND_OBJECT_REGISTRY` and `09_LOCATION_REGISTRY` provide event, object and place baselines for chapter-indexed history queries. See [Knowledge and Timeline Engine](KNOWLEDGE_AND_TIMELINE.md).

Each chapter may include `psychologyChecks` scene-beat annotations: trigger, automatic reaction, immediate thought, emotion, physical sensation, outwardly expressed emotion, underlying need, misbelief, deliberate choice, consequence, observable draft evidence, interpretation and optional seven-stage arc evidence. These annotations distinguish textual observation from interpretation; validation checks references, evidence and stage range but does not judge psychological truth. See [Character Psychology and Emotional Analysis](CHARACTER_PSYCHOLOGY.md).

The `18_CHARACTER_STATE_HISTORY` registry stores author-confirmed historical character snapshots by character and chapter. Snapshots may record emotional/physical state, goal, motivation, misbelief, truth recognition, arc ID and seven-stage position, evidence, behaviour, relationship states, knowledge IDs, pressure, decisions, consequences and source provenance. See [Historical Character State Tracking](CHARACTER_STATE_HISTORY.md).

Use explicit states such as confirmed, theory, planned, open, resolved and retired. Never silently convert theories into canon. References use stable registry IDs.

See [Continuity Checks](CONTINUITY_CHECKS.md) for field shapes, registry metadata and the checks performed by `npm run validate`.
