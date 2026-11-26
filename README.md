# Beast Taming WPC2026

A local-first continuity and chapter-record engine for the Beast Taming novel. It uses the screenshot-aligned `CHAPTER_RECORDS` registries as structured canon memory.

## Requirements

- Node.js 20 or newer
- No third-party runtime dependencies

## Quick start

```bash
npm run init
npm test
npm run chapter:new -- 1 "The Youngest Son"
npm run validate
npm run chapter:show -- 1
```

See [Engine Guide](docs/ENGINE_GUIDE.md), [Record Schema](docs/RECORD_SCHEMA.md), and [Roadmap](docs/ROADMAP.md).

The engine does not invent canon. Add only author-confirmed facts to registries; keep theories and unresolved questions explicitly labelled.
