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

Start with the [Story Bible](docs/STORY_BIBLE.md), [Mana World System](docs/WORLD_SYSTEM_MANA.md), [Elemental Affinity System](docs/WORLD_SYSTEM_AFFINITY.md), and [World Order](docs/WORLD_ORDER.md) for the premise, cultivation foundations, elemental rules, political institutions, military, economy and society. See [Engine Guide](docs/ENGINE_GUIDE.md), [Record Schema](docs/RECORD_SCHEMA.md), and [Roadmap](docs/ROADMAP.md) for engine usage.

The engine does not invent canon. Add only author-confirmed facts to registries; keep theories and unresolved questions explicitly labelled.
