import { file, exists, read, write } from "./io.js";

const TYPES = ["main_plot", "subplot", "character_arc", "sub_arc", "mystery_arc"];
const STATUSES = ["planned", "active", "paused", "resolved", "abandoned"];
const validId = value => /^[A-Z][A-Z0-9_-]{1,63}$/.test(value ?? "");
const unique = values => new Set(values).size === values.length;

export async function createStoryItem(id, type, title) {
  if (!validId(id)) throw Error("Story ID must be uppercase and use letters, numbers, underscores or hyphens");
  if (!TYPES.includes(type)) throw Error("Type must be one of: " + TYPES.join(", "));
  if (!title?.trim()) throw Error("Provide a story item title");
  const p = file("CHAPTER_RECORDS", "17_STORY_STRUCTURE_REGISTRY");
  if (!(await exists(p))) throw Error("Run npm run init first");
  const registry = await read(p);
  if (registry.entries.some(item => item.id === id)) throw Error("Story ID already exists");
  registry.entries.push({
    id, type, title: title.trim(), status: "planned", parentId: null,
    objective: "", conflict: "", stakes: "", startChapter: null, targetEndChapter: null,
    characterIds: [], chapters: [], milestones: [], dependencies: [],
    resolutionCriteria: [], source: { kind: "author_note", reference: "" }
  });
  await write(p, registry);
  return id;
}

export async function listStoryItems() {
  const p = file("CHAPTER_RECORDS", "17_STORY_STRUCTURE_REGISTRY");
  if (!(await exists(p))) return [];
  return (await read(p)).entries ?? [];
}

export async function showStoryItem(id) {
  const items = await listStoryItems();
  const item = items.find(entry => entry.id === id);
  if (!item) throw Error("Story item not found: " + id);
  return item;
}

function checkParentType(item, parent) {
  const allowed = {
    main_plot: [],
    subplot: ["main_plot"],
    character_arc: ["main_plot", "subplot"],
    sub_arc: ["character_arc", "subplot", "mystery_arc"],
    mystery_arc: ["main_plot", "subplot"]
  };
  return allowed[item.type]?.includes(parent.type) ?? false;
}

export function checkStoryStructure({ registries = {}, chapters = [] } = {}) {
  const errors = [], warnings = [];
  const items = registries["17_STORY_STRUCTURE_REGISTRY"]?.entries ?? [];
  const characters = new Set((registries["03_CHARACTER_REGISTRY"]?.entries ?? []).map(x => x.id));
  const byId = new Map(items.filter(x => x?.id).map(x => [x.id, x]));
  const chapterMap = new Map(chapters.filter(x => Number.isInteger(x?.number)).map(x => [x.number, x]));
  const issue = (code, details) => errors.push({ code, ...details });
  const warn = (code, details) => warnings.push({ code, ...details });

  for (const item of items) {
    if (!item || !validId(item.id)) { issue("STORY_ITEM_ID_INVALID", {}); continue; }
    if (!TYPES.includes(item.type)) issue("STORY_ITEM_TYPE_INVALID", { id: item.id, type: item.type });
    if (!STATUSES.includes(item.status)) issue("STORY_ITEM_STATUS_INVALID", { id: item.id, status: item.status });
    if (item.parentId) {
      const parent = byId.get(item.parentId);
      if (!parent) issue("STORY_PARENT_MISSING", { id: item.id, parentId: item.parentId });
      else if (!checkParentType(item, parent)) issue("STORY_PARENT_TYPE_INVALID", { id: item.id, type: item.type, parentId: parent.id, parentType: parent.type });
    } else if (item.type !== "main_plot") {
      warn("STORY_ITEM_WITHOUT_PARENT", { id: item.id, type: item.type });
    }
    for (const characterId of item.characterIds ?? []) if (!characters.has(characterId)) issue("STORY_CHARACTER_MISSING", { id: item.id, characterId });
    const chapterNumbers = (item.chapters ?? []).map(link => typeof link === "number" ? link : link?.chapter);
    if (!unique(chapterNumbers)) issue("STORY_CHAPTER_DUPLICATE", { id: item.id });
    for (const number of chapterNumbers) {
      const chapter = chapterMap.get(number);
      if (!chapter) issue("STORY_CHAPTER_MISSING", { id: item.id, chapter: number });
      else if (!(chapter.storyLinks ?? []).some(link => link.storyId === item.id)) warn("STORY_CHAPTER_LINK_MISSING", { id: item.id, chapter: number, missingOn: "chapter" });
    }
    const milestoneIds = (item.milestones ?? []).map(m => m?.id).filter(Boolean);
    if (!unique(milestoneIds)) issue("STORY_MILESTONE_ID_DUPLICATE", { id: item.id });
    for (const milestone of item.milestones ?? []) {
      if (!milestone || !validId(milestone.id)) issue("STORY_MILESTONE_ID_INVALID", { id: item.id });
      if (milestone?.chapter != null && !chapterMap.has(milestone.chapter)) issue("STORY_MILESTONE_CHAPTER_MISSING", { id: item.id, milestoneId: milestone.id, chapter: milestone.chapter });
    }
    for (const dependencyId of item.dependencies ?? []) if (!byId.has(dependencyId)) issue("STORY_DEPENDENCY_MISSING", { id: item.id, dependencyId });
    if (!item.source?.kind || !item.source?.reference) warn("STORY_SOURCE_UNDOCUMENTED", { id: item.id });
    if (item.startChapter != null && !Number.isInteger(item.startChapter)) issue("STORY_START_CHAPTER_INVALID", { id: item.id });
    if (item.targetEndChapter != null && !Number.isInteger(item.targetEndChapter)) issue("STORY_END_CHAPTER_INVALID", { id: item.id });
    if (Number.isInteger(item.startChapter) && Number.isInteger(item.targetEndChapter) && item.targetEndChapter < item.startChapter) issue("STORY_CHAPTER_RANGE_INVALID", { id: item.id });
  }

  // Detect cycles in both the hierarchy and dependency graph.
  for (const [field, code] of [["parentId", "STORY_PARENT_CYCLE"], ["dependencies", "STORY_DEPENDENCY_CYCLE"]]) {
    const visiting = new Set(), visited = new Set();
    const visit = id => {
      if (visiting.has(id)) { issue(code, { id }); return; }
      if (visited.has(id)) return;
      const item = byId.get(id);
      if (!item) return;
      visiting.add(id);
      const next = field === "parentId" ? (item.parentId ? [item.parentId] : []) : (item.dependencies ?? []);
      for (const target of next) visit(target);
      visiting.delete(id); visited.add(id);
    };
    for (const item of items) if (item?.id) visit(item.id);
  }

  for (const chapter of chapters) for (const link of chapter.storyLinks ?? []) {
    const item = byId.get(link?.storyId);
    if (!item) issue("CHAPTER_STORY_LINK_MISSING", { chapter: chapter.number, storyId: link?.storyId });
    else if (!(item.chapters ?? []).some(entry => (typeof entry === "number" ? entry : entry?.chapter) === chapter.number)) {
      warn("STORY_REGISTRY_LINK_MISSING", { id: item.id, chapter: chapter.number, missingOn: "registry" });
    }
  }
  return { errors, warnings };
}

export const STORY_TYPES = TYPES;
