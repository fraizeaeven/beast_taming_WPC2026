# Novel Continuity Intelligence (v2.0)

v2.0 adds cross-chapter review over the existing canon, mystery, open-loop and promise/payoff records. It is deliberately evidence-led: stable IDs, explicit chapter numbers and author-maintained annotations are the source of truth. It does not infer story facts from prose or make retcon decisions.

## Commands

```bash
npm run intelligence:report
npm run intelligence:impact -- 01_CANON_REGISTRY FACT_HERO_AGE
npm run validate
```

- `intelligence:report` lists mystery, open-loop, promise and foreshadowing records, plus cross-chapter warnings.
- `intelligence:impact` finds exact stable-ID references in registries and chapters. It also reports chapters that refer to records directly linked to the target, one hop deep.
- `validate` now includes the v2.0 cross-chapter checks as warnings. Structural errors still determine pass/fail.

## Supported thread metadata

The engine reuses existing registries:

- `11_MYSTERY_REGISTER`: optional `setupChapter`, `introducedInChapter` or `openedInChapter`; clue chapter numbers in `clues`, `clueChapters` or `foreshadowing`; and `revealChapter`, `revealedInChapter`, `answerChapter` or `resolvedInChapter`.
- `12_OPEN_LOOP_REGISTER`: optional `openedInChapter`, `introducedInChapter` or `createdInChapter`; and `resolvedInChapter` or `closedInChapter`. Chapter records may record an `openLoops` action using `openLoopId` and `action`.
- `13_PROMISE_AND_PAYOFF_REGISTER`: optional `madeInChapter` / `setupChapter`, `notBeforeChapter`, `dueByChapter`, and `fulfilledInChapter` / `paidOffInChapter` / `payoffChapter`. Chapter records may record a `promises` action using `promiseId` and `action`. Foreshadowing entries can be identified by `kind`, `type` or `category` values containing `foreshadow`, `clue` or `setup`, or by explicit clue chapter arrays.
- `01_CANON_REGISTRY` and chapter `canonChanges`: explicit fact assertions can be compared when they share a `factId` (or chapter `canonId` / `recordId`) and record a `value`, `newValue`, `statement` or `content`. Mark an intentional assertion change with `changeType: "retcon"` or `retcon: true`; still document the decision in `16_CONTINUITY_LEDGER`.

All chapter references are positive integer chapter numbers. Unknown dates and missing optional fields are not treated as contradictions.

## Warning codes

- `CANON_ASSERTION_CONFLICT`: two explicit assertions for one fact ID disagree without an explicit retcon marker.
- `MYSTERY_REVEAL_BEFORE_SETUP`, `MYSTERY_CLUE_AFTER_REVEAL`, `MYSTERY_MULTIPLE_REVEAL_CHAPTERS`, `MYSTERY_RESOLUTION_UNDATED`.
- `OPEN_LOOP_RESOLVED_BEFORE_OPENED`, `OPEN_LOOP_MULTIPLE_RESOLUTION_CHAPTERS`, `OPEN_LOOP_RESOLUTION_UNDATED`.
- `PROMISE_PAYOFF_BEFORE_SETUP`, `PROMISE_PAYOFF_TOO_EARLY`, `PROMISE_MULTIPLE_PAYOFF_CHAPTERS`, `PROMISE_PAYOFF_MISSING`.

Warnings are review prompts, not automatic failures or proof of a plot hole. A reveal may intentionally be partial, a loop may be deliberately abandoned, and a promise may remain open; record the intended status and rationale rather than forcing a false resolution.

## Canon impact analysis

The impact query reports:
1. Direct registry records that contain the target ID as an explicit reference.
2. Chapters that directly reference the target ID.
3. Chapters that reference a record directly linked to the target (one hop).

This is not a semantic dependency engine. Prose mentions, unstated causal relationships and indirect chains beyond one hop are not inferred. Before a retcon, inspect the listed source records, update the continuity ledger, and manually verify all affected manuscript passages.

## Safety boundary

The report is read-only. It does not modify canon, close threads, invent clues, resolve mysteries, rewrite chapter records or select the correct side of a contradiction. Review every finding against the manuscript and source records.
