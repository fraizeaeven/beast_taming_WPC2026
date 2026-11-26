# Record Schema

Registry files are JSON without filename extensions. Each has schemaVersion, registry, purpose and entries.

Chapter files are `CHAPTERS/CHAPTER_0001.json` and contain: number, title, status, POV, in-world date, summary, scenes, charactersPresent, locations, events, canonChanges, knowledgeChanges, objectChanges, financialAndLegalChanges, promises, openLoops, continuityNotes and authorNotes. Optional continuity annotations include `characterAges`, `behaviorChecks`, `knowledgeUsed`, `relationshipChanges` and `storyLinks`.

The `17_STORY_STRUCTURE_REGISTRY` stores story units with stable IDs, type, title, status, parentId, objective, conflict, stakes, chapter range, characterIds, chapters, milestones, dependencies, resolutionCriteria and source provenance. See [Story Structure Management](STORY_STRUCTURE.md) for the full shape and hierarchy rules.

Use explicit states such as confirmed, theory, planned, open, resolved and retired. Never silently convert theories into canon. References use stable registry IDs.

See [Continuity Checks](CONTINUITY_CHECKS.md) for field shapes, registry metadata and the checks performed by `npm run validate`.
