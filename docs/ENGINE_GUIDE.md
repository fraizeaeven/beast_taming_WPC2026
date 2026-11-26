# Engine Guide

Requires Node.js 20+. No third-party dependencies.

## Setup
```bash
npm run init
npm test
npm run validate
```

## Chapter workflow
1. Review canon, character, world-state, knowledge, promise and open-loop records.
2. Create a shell: `npm run chapter:new -- 1 "Chapter title"`.
3. Draft prose and fill the chapter JSON, including continuity annotations where known.
4. Update affected registries using stable IDs.
5. Run `npm run validate`; resolve structural errors and review continuity warnings.
6. Lock a chapter only after human continuity review.

## Principles
- Brainstorming is not canon; only confirmed facts enter canon registries.
- Unknown is not false; preserve uncertainty.
- A chapter record is an evidence log of what happened and changed.
- Retcons require an entry in 16_CONTINUITY_LEDGER.
- Structural validation checks record integrity. Continuity validation checks explicit age, knowledge, relationship, promise, event and reviewer-annotated behavior records; it does not interpret prose or make canon decisions.
- Continuity findings are warnings for human review, not automatic edits.

## Status
planned → drafted → reviewed → locked. Changes to locked chapters require a continuity decision.

## IDs
Use stable uppercase IDs such as CHAR_KAEL, EVT_CEREMONY_001, LOC_DARK_ESTATE and MYS_ORIGIN_OATH. Never reuse IDs.

See [Continuity Checks](CONTINUITY_CHECKS.md) for the optional record fields and warning definitions.
