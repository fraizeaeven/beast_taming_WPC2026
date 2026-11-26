import { file, exists, read } from "./io.js";
import { REGISTRIES } from "./constants.js";

const array = value => Array.isArray(value) ? value : [];
const idOf = value => typeof value === "string" ? value : value?.id;
const chapterOf = value => typeof value === "number" ? value : value?.chapter;
const unique = values => [...new Set(values.filter(Boolean))];
const getEntries = (registries, name) => array(registries?.[name]?.entries);
const containsAny = (values, wanted) => array(values).some(value => wanted.has(idOf(value)));
const isActive = item => !["resolved", "retired", "abandoned", "fulfilled", "closed"].includes(item?.status);

function relatedToChapter(item, chapterNumber) {
  const refs = [item?.chapter, item?.chapterNumber, item?.introducedInChapter, item?.madeInChapter, item?.learnedInChapter, item?.startChapter, item?.endChapter, item?.dueByChapter, item?.notBeforeChapter];
  if (refs.some(value => Number.isInteger(value) && value === chapterNumber)) return true;
  if (Array.isArray(item?.chapters) && item.chapters.some(value => chapterOf(value) === chapterNumber)) return true;
  if (Number.isInteger(item?.startChapter) && chapterNumber >= item.startChapter &&
      (!Number.isInteger(item.endChapter) || chapterNumber <= item.endChapter)) return true;
  return false;
}

function hasReference(item, ids) {
  const fields = ["characterId", "from", "to", "ownerId", "holderId", "createdBy", "discoveredBy",
    "storyId", "plotId", "arcId", "parentId", "relationshipId", "eventId", "promiseId",
    "mysteryId", "openLoopId", "objectId", "locationId", "factId"];
  if (fields.some(field => ids.has(item?.[field]))) return true;
  for (const field of ["characterIds", "relatedIds", "storyIds", "plotIds", "arcIds", "dependencies", "involves"]) {
    if (containsAny(item?.[field], ids)) return true;
  }
  return false;
}

function selectEntries(registries, name, { ids, chapterNumber, includeGlobal = false, activeOnly = false } = {}) {
  return getEntries(registries, name).filter(item => {
    if (activeOnly && !isActive(item)) return false;
    if (ids.has(item?.id) || hasReference(item, ids) || relatedToChapter(item, chapterNumber)) return true;
    return includeGlobal && !hasAnyReference(item);
  });
}

function hasAnyReference(item) {
  return ["characterId", "from", "to", "ownerId", "holderId", "storyId", "plotId", "arcId", "relationshipId",
    "eventId", "promiseId", "mysteryId", "openLoopId", "objectId", "locationId", "factId",
    "characterIds", "relatedIds", "storyIds", "plotIds", "arcIds", "involves"].some(field => {
      const value = item?.[field];
      return Array.isArray(value) ? value.length > 0 : Boolean(value);
    });
}

function storyClosure(storyItems, chapter) {
  const byId = new Map(storyItems.map(item => [item.id, item]));
  const selected = new Set(array(chapter.storyLinks).map(link => link?.storyId).filter(Boolean));
  const characterIds = new Set(array(chapter.charactersPresent));
  if (chapter.pov) characterIds.add(chapter.pov);
  for (const item of storyItems) {
    const mapped = array(item.chapters).some(link => chapterOf(link) === chapter.number);
    if (mapped || array(item.characterIds).some(id => characterIds.has(id))) selected.add(item.id);
  }
  const queue = [...selected];
  while (queue.length) {
    const item = byId.get(queue.shift());
    if (!item) continue;
    for (const id of [item.parentId, ...array(item.dependencies)]) {
      if (id && !selected.has(id) && byId.has(id)) { selected.add(id); queue.push(id); }
    }
    for (const id of array(item.characterIds)) characterIds.add(id);
  }
  return { selected, characterIds };
}

/**
 * Deterministic, conservative chapter context assembly.
 * It retrieves explicitly linked records and clearly global reference material.
 * It does not infer plot relevance from manuscript prose.
 */
export async function buildChapterContext(number) {
  const chapterNumber = Number(number);
  if (!Number.isInteger(chapterNumber) || chapterNumber < 1) throw Error("Provide a positive chapter number");
  const chapterPath = file("CHAPTERS", "CHAPTER_" + String(chapterNumber).padStart(4, "0") + ".json");
  if (!(await exists(chapterPath))) throw Error("Chapter not found: " + chapterNumber);
  const chapter = await read(chapterPath);
  const registries = {};
  for (const name of REGISTRIES) {
    const path = file("CHAPTER_RECORDS", name);
    if (await exists(path)) registries[name] = await read(path);
  }

  const allStories = getEntries(registries, "17_STORY_STRUCTURE_REGISTRY");
  const { selected: storyIds, characterIds } = storyClosure(allStories, chapter);
  const ids = new Set([...characterIds, ...storyIds]);
  for (const name of ["10_EVENT_TIMELINE", "11_MYSTERY_REGISTER", "12_OPEN_LOOP_REGISTER", "13_PROMISE_AND_PAYOFF_REGISTER"]) {
    for (const record of getEntries(registries, name)) if (relatedToChapter(record, chapterNumber)) ids.add(record.id);
  }

  const selected = {};
  const globalRegistries = new Set(["01_CANON_REGISTRY", "02_WORLD_STATE"]);
  for (const name of REGISTRIES) {
    selected[name] = selectEntries(registries, name, {
      ids, chapterNumber,
      includeGlobal: globalRegistries.has(name),
      activeOnly: ["11_MYSTERY_REGISTER", "12_OPEN_LOOP_REGISTER", "13_PROMISE_AND_PAYOFF_REGISTER"].includes(name)
    });
  }
  selected["17_STORY_STRUCTURE_REGISTRY"] = allStories.filter(item => storyIds.has(item.id));

  const unresolved = [];
  for (const name of ["11_MYSTERY_REGISTER", "12_OPEN_LOOP_REGISTER", "13_PROMISE_AND_PAYOFF_REGISTER"]) {
    for (const item of selected[name]) {
      const notBefore = Number.isInteger(item.notBeforeChapter) ? item.notBeforeChapter : null;
      if (notBefore !== null && chapterNumber < notBefore) {
        unresolved.push({ registry: name, id: item.id, constraint: "not_before_chapter", chapter: notBefore, title: item.title ?? item.description ?? "" });
      }
      if (isActive(item)) unresolved.push({ registry: name, id: item.id, constraint: "unresolved_at_context_build", status: item.status ?? "unspecified", title: item.title ?? item.description ?? "" });
    }
  }
  for (const story of selected["17_STORY_STRUCTURE_REGISTRY"]) {
    for (const milestone of array(story.milestones)) {
      if (Number.isInteger(milestone?.chapter) && milestone.chapter > chapterNumber && milestone.status !== "completed") {
        unresolved.push({ registry: "17_STORY_STRUCTURE_REGISTRY", id: story.id, milestoneId: milestone.id, constraint: "future_milestone", chapter: milestone.chapter, title: milestone.title ?? "" });
      }
    }
  }

  return {
    generatedForChapter: chapterNumber,
    chapter: {
      number: chapter.number, title: chapter.title, status: chapter.status, pov: chapter.pov,
      inWorldDate: chapter.inWorldDate, summary: chapter.summary,
      charactersPresent: chapter.charactersPresent ?? [], locations: chapter.locations ?? [],
      storyLinks: chapter.storyLinks ?? [], scenes: chapter.scenes ?? []
    },
    selection: {
      characterIds: [...characterIds], storyIds: [...storyIds],
      rule: "Explicit chapter links, character participation, story hierarchy/dependencies, chapter references and unscoped global canon/world-state entries. No prose relevance inference."
    },
    records: selected,
    constraintsAndUnresolved: unresolved,
    omissions: REGISTRIES.filter(name => !registries[name]).map(name => ({ registry: name, reason: "Registry file is missing" }))
  };
}

export function formatChapterContext(context) {
  const lines = [
    "# Chapter " + context.generatedForChapter + " — Writing Context",
    "",
    "> Retrieval brief assembled from recorded project data. It is not new canon. Check source records before resolving ambiguity.",
    "",
    "## Chapter",
    JSON.stringify(context.chapter, null, 2),
    "",
    "## Retrieval scope",
    JSON.stringify(context.selection, null, 2),
    "",
    "## Relevant records"
  ];
  for (const [name, records] of Object.entries(context.records)) {
    lines.push("", "### " + name, records.length ? "```json" : "_No matching records retrieved._");
    if (records.length) lines.push(JSON.stringify(records, null, 2), "```");
  }
  lines.push("", "## Constraints, future milestones and unresolved threads",
    context.constraintsAndUnresolved.length ? "```json" : "_No matching constraints or unresolved records retrieved._");
  if (context.constraintsAndUnresolved.length) lines.push(JSON.stringify(context.constraintsAndUnresolved, null, 2), "```");
  if (context.omissions.length) lines.push("", "## Missing registries", "```json", JSON.stringify(context.omissions, null, 2), "```");
  lines.push("", "## Drafting safeguards",
    "- Do not treat missing information as permission to invent canon.",
    "- Preserve each character's recorded knowledge boundary and relationship state.",
    "- Do not resolve an open loop, mystery or promise unless the chapter is intended and authorized to pay it off.",
    "- Record newly established facts as proposed changes for author review; do not silently overwrite earlier records.",
    "");
  return lines.join("\n");
}
