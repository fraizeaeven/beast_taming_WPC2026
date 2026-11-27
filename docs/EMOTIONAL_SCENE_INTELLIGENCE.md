# Emotional Scene Intelligence

## Purpose

The v2.4 layer records the difference between an objective scene event and the perspectives characters construct around it. It helps authors design dramatic irony, miscommunication, concealment and later belief correction without pretending the engine can read a manuscript's unspoken meaning.

## Chapter field

A chapter may contain `sceneInterpretationChecks: []`. Each scene record can include:

- `id`, `sceneId`, `order`: stable annotation and scene references.
- `objectiveEvent`, `objectiveEvidence`: what observably happened and where the draft supports it.
- `perspectives[]`: character ID, observed facts, interpretation, interpretation accuracy, evidence, activated belief, emotion, outward expression, resulting behaviour and behaviour evidence.
- `perspectiveGapEvidence`: author-recorded reason two perspectives differ.
- `concealedInformation[]`: information ID, holder, description, concealment reason and evidence.
- `readerKnowledge`: explicitly recorded facts available to the reader, optional `readerOnlyFacts` that characters do not know, and narrative evidence. Reader-only facts are checked against character `knowledgeIds` annotations.
- `beliefUpdates[]`: prior/new interpretation and the new evidence that changes the character's view.
- `reveals[]`: information ID, reveal evidence and earlier setup scene IDs.

## Validation

Structural errors cover duplicate annotation IDs and unknown character references. Advisory findings cover missing objective evidence, unsupported interpretations/misreads, unsubstantiated concealment, reader-knowledge evidence gaps, reader-only knowledge copied into a character knowledge record, belief updates without new evidence and reveals without recorded setup. A setup reference is checked against earlier annotated scene IDs, including earlier scenes within the same chapter. Findings do not establish whether an interpretation is psychologically true.

## POV and knowledge safeguards

Reader knowledge is a separate annotation from character perspective. Never copy reader-only facts into a character's observed facts, knowledge IDs, thoughts or decisions. Use the existing knowledge tracker and POV whitelist as the authority for what a character has learned; this layer does not replace either registry. Record an intentional information leak or POV exception explicitly in the manuscript and relevant canon/knowledge records.

## Commands

```bash
npm run scene:interpretation
npm run scene:interpretation -- CHAR_KAEL
npm run validate
```

The report is read-only. AI-generated proposals still require individual author approval, and no prose is inferred or canon changed automatically.
