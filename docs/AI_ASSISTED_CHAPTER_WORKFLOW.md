# AI-Assisted Chapter Workflow

The workflow is provider-neutral and keeps the engine local-first. It prepares a grounded prompt for an AI model, accepts the model's JSON review, and stages proposed changes. It does not call an AI API or require a provider key.

## Workflow

1. Update the chapter record's POV, participants, locations and story links.
2. Save the manuscript as a UTF-8 text file.
3. Prepare the review prompt and chapter context:
   `npm run draft:prepare -- 12 drafts/chapter-0012.md`
4. Give the generated `reports/CHAPTER_0012_AI_REVIEW_PROMPT.md` to your chosen AI model.
5. Save the model's JSON-only response as `reports/chapter-0012-analysis.json`.
6. Stage the response:
   `npm run draft:stage -- reports/chapter-0012-analysis.json`
7. Inspect the findings and proposed changes:
   `npm run draft:list`
   `npm run draft:show -- REVIEW_ID`
8. Approve or reject each proposal separately:
   `npm run draft:approve -- REVIEW_ID PROP_001`
   `npm run draft:reject -- REVIEW_ID PROP_002`
9. Run `npm run validate` and review the resulting warnings.

## Analysis JSON contract

Top-level fields: `schemaVersion: 1`, `chapterNumber`, optional `draftFile` and `summary`, plus `findings[]` and `proposals[]`.

A finding should include an ID, severity, confidence (0-1), category, message, short exact `draftEvidence`, `canonEvidence` record IDs, and `recommendedAction`. Categories include character, emotion, arc, knowledge, POV, relationship, timeline, plot, mystery and promise.

Supported proposal types:

- `add_registry_entry`: `registry`, `value` (including a new stable uppercase `id`).
- `update_registry_entry`: `registry`, `recordId`, exact `expected` current entry, and replacement `value` with the same ID.
- `add_chapter_item`: `chapter`, allowlisted `field`, and `value` to append.
- `update_chapter_field`: `chapter`, allowlisted `field`, exact `expected` current value, and replacement `value`.

Every proposal also has `id`, `reason` and `evidence`. Chapter fields are restricted to narrative/continuity annotation fields; structural identity fields such as chapter number, title and POV cannot be changed by this proposal mechanism.

## Safety and limitations

- Preparing a prompt and staging analysis never modify canon.
- Findings are review notes, not validated truths. Confidence is model-reported, not calibrated.
- AI output is untrusted input. The engine validates proposal types, target registries, IDs and allowlisted chapter fields.
- Updates require an exact snapshot match. If the underlying record changed after analysis, approval fails rather than overwriting newer canon.
- Each proposal is approved or rejected independently. There is no bulk-approve command.
- The current implementation does not invoke an AI provider. You choose the model and submit its JSON response.
- The engine cannot reliably infer subtext, emotional truth or character motivation from prose by itself. Human review remains essential.
- Approved proposals change local registry/chapter JSON files. Review records remain in `DRAFT_REVIEWS/` as an audit trail.
