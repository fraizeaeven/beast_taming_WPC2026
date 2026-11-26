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
3. Draft prose and fill the chapter JSON.
4. Update affected registries using stable IDs.
5. Run `npm run validate`; resolve errors and review warnings.
6. Lock a chapter only after human continuity review.

## Principles
- Brainstorming is not canon; only confirmed facts enter canon registries.
- Unknown is not false; preserve uncertainty.
- A chapter record is an evidence log of what happened and changed.
- Retcons require an entry in 16_CONTINUITY_LEDGER.
- Validation catches structural issues, not literary or semantic contradictions.

## Status
planned → drafted → reviewed → locked. Changes to locked chapters require a continuity decision.

## IDs
Use stable uppercase IDs such as CHAR_KAEL, EVT_CEREMONY_001, LOC_DARK_ESTATE and MYS_ORIGIN_OATH. Never reuse IDs.