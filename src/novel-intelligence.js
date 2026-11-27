const list = value => Array.isArray(value) ? value : [];
const entries = (registries, name) => list(registries?.[name]?.entries);
const chapterNumber = value => Number.isInteger(value) && value > 0 ? value : null;
const firstChapter = (...values) => values.map(chapterNumber).find(value => value !== null) ?? null;
const text = value => typeof value === "string" ? value.trim() : "";
const active = status => !["resolved", "fulfilled", "closed", "retired", "abandoned"].includes(String(status ?? "").toLowerCase());
const stable = value => {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])]));
  return value;
};
const same = (a, b) => JSON.stringify(stable(a)) === JSON.stringify(stable(b));
const chapterAction = item => text(item?.action ?? item?.status).toLowerCase();

function chapterActions(chapters, field, idField, id) {
  const matches = [];
  for (const chapter of chapters) for (const item of list(chapter?.[field])) {
    if ((item?.[idField] ?? item?.id) !== id) continue;
    matches.push({ chapter: chapter.number, action: chapterAction(item), item });
  }
  return matches;
}

function clueChapters(mystery) {
  const values = [
    ...list(mystery?.clues),
    ...list(mystery?.clueChapters),
    ...list(mystery?.foreshadowing)
  ];
  return values.map(value => typeof value === "number" ? chapterNumber(value) : firstChapter(value?.chapter, value?.chapterNumber, value?.introducedInChapter)).filter(value => value !== null);
}

/**
 * Cross-chapter checks are intentionally limited to explicit stable IDs,
 * chapter annotations and author-maintained thread metadata.
 */
export function checkNovelIntelligence({ registries = {}, chapters = [] } = {}) {
  const warnings = [];
  const ordered = [...chapters].filter(chapter => Number.isInteger(chapter?.number)).sort((a, b) => a.number - b.number);
  const latestChapter = ordered.at(-1)?.number ?? 0;
  const warn = (code, details) => warnings.push({ code, ...details });

  // Compare explicit assertions about the same fact ID. A declared retcon is not
  // called a contradiction; its downstream effects are still discoverable below.
  const assertions = [];
  for (const fact of entries(registries, "01_CANON_REGISTRY")) {
    const factId = fact?.factId ?? fact?.id;
    const value = fact?.value ?? fact?.canonicalValue ?? fact?.statement ?? fact?.content;
    if (factId && value !== undefined) assertions.push({ factId, value, chapter: firstChapter(fact.chapter, fact.establishedInChapter) ?? 0, source: "01_CANON_REGISTRY:" + (fact.id ?? factId), retcon: fact.changeType === "retcon" || fact.retcon === true });
  }
  for (const chapter of ordered) for (const change of list(chapter.canonChanges)) {
    const factId = change?.factId ?? change?.canonId ?? change?.recordId;
    const value = change?.value ?? change?.newValue ?? change?.statement ?? change?.content;
    if (factId && value !== undefined) assertions.push({ factId, value, chapter: chapter.number, source: "chapter:" + chapter.number, retcon: change.changeType === "retcon" || change.retcon === true });
  }
  const byFact = new Map();
  for (const assertion of assertions) {
    if (!byFact.has(assertion.factId)) byFact.set(assertion.factId, []);
    byFact.get(assertion.factId).push(assertion);
  }
  for (const [factId, records] of byFact) {
    for (let i = 0; i < records.length; i++) for (let j = i + 1; j < records.length; j++) {
      const a = records[i], b = records[j];
      if (!same(a.value, b.value) && !a.retcon && !b.retcon) warn("CANON_ASSERTION_CONFLICT", {
        factId, firstValue: a.value, conflictingValue: b.value,
        firstChapter: a.chapter, conflictingChapter: b.chapter,
        firstSource: a.source, conflictingSource: b.source,
        note: "Review the source records; this check does not determine which assertion is correct."
      });
    }
  }

  // Mystery clues and reveals: metadata is optional, but when recorded it must
  // agree with the setup/reveal sequence.
  for (const mystery of entries(registries, "11_MYSTERY_REGISTER")) {
    if (!mystery?.id) continue;
    const setup = firstChapter(mystery.setupChapter, mystery.introducedInChapter, mystery.openedInChapter);
    const reveal = firstChapter(mystery.revealChapter, mystery.revealedInChapter, mystery.answerChapter, mystery.resolvedInChapter);
    const clues = clueChapters(mystery);
    const chapterReveals = chapterActions(ordered, "mysteryChanges", "mysteryId", mystery.id)
      .filter(item => ["revealed", "resolved", "answered", "paid_off"].includes(item.action));
    const revealChapters = [...(reveal === null ? [] : [reveal]), ...chapterReveals.map(item => item.chapter)].filter(Number.isInteger);
    if (setup !== null && revealChapters.some(value => value < setup)) warn("MYSTERY_REVEAL_BEFORE_SETUP", { mysteryId: mystery.id, setupChapter: setup, revealChapters });
    if (revealChapters.length > 1 && new Set(revealChapters).size > 1) warn("MYSTERY_MULTIPLE_REVEAL_CHAPTERS", { mysteryId: mystery.id, revealChapters: [...new Set(revealChapters)].sort((a, b) => a - b) });
    if (revealChapters.length && clues.some(value => value > Math.min(...revealChapters))) warn("MYSTERY_CLUE_AFTER_REVEAL", { mysteryId: mystery.id, clueChapters: clues, revealChapters });
    if (String(mystery.status ?? "").toLowerCase() === "resolved" && revealChapters.length === 0) warn("MYSTERY_RESOLUTION_UNDATED", { mysteryId: mystery.id, latestChapter });
  }

  // Open-loop resolutions must be traceable to an opening and a chapter.
  for (const loop of entries(registries, "12_OPEN_LOOP_REGISTER")) {
    if (!loop?.id) continue;
    const opened = firstChapter(loop.openedInChapter, loop.introducedInChapter, loop.createdInChapter);
    const resolved = firstChapter(loop.resolvedInChapter, loop.closedInChapter);
    const actions = chapterActions(ordered, "openLoops", "openLoopId", loop.id);
    const resolutions = actions.filter(item => ["resolved", "closed", "abandoned"].includes(item.action));
    const resolutionChapters = [...(resolved === null ? [] : [resolved]), ...resolutions.map(item => item.chapter)];
    if (opened !== null && resolutionChapters.some(value => value < opened)) warn("OPEN_LOOP_RESOLVED_BEFORE_OPENED", { openLoopId: loop.id, openedInChapter: opened, resolutionChapters });
    if (resolutionChapters.length > 1 && new Set(resolutionChapters).size > 1) warn("OPEN_LOOP_MULTIPLE_RESOLUTION_CHAPTERS", { openLoopId: loop.id, resolutionChapters: [...new Set(resolutionChapters)].sort((a, b) => a - b) });
    if (["resolved", "closed", "abandoned"].includes(String(loop.status ?? "").toLowerCase()) && resolutionChapters.length === 0) warn("OPEN_LOOP_RESOLUTION_UNDATED", { openLoopId: loop.id });
  }

  // Promise/payoff coverage reconciles registry dates with chapter action records.
  for (const promise of entries(registries, "13_PROMISE_AND_PAYOFF_REGISTER")) {
    if (!promise?.id) continue;
    const made = firstChapter(promise.madeInChapter, promise.setupChapter, promise.introducedInChapter);
    const notBefore = chapterNumber(promise.notBeforeChapter);
    const recordedPayoff = firstChapter(promise.fulfilledInChapter, promise.paidOffInChapter, promise.payoffChapter);
    const actions = chapterActions(ordered, "promises", "promiseId", promise.id)
      .filter(item => ["fulfilled", "paid_off", "resolved", "paid off"].includes(item.action));
    const payoffChapters = [...(recordedPayoff === null ? [] : [recordedPayoff]), ...actions.map(item => item.chapter)];
    if (made !== null && payoffChapters.some(value => value < made)) warn("PROMISE_PAYOFF_BEFORE_SETUP", { promiseId: promise.id, madeInChapter: made, payoffChapters });
    if (notBefore !== null && payoffChapters.some(value => value < notBefore)) warn("PROMISE_PAYOFF_TOO_EARLY", { promiseId: promise.id, notBeforeChapter: notBefore, payoffChapters });
    if (payoffChapters.length > 1 && new Set(payoffChapters).size > 1) warn("PROMISE_MULTIPLE_PAYOFF_CHAPTERS", { promiseId: promise.id, payoffChapters: [...new Set(payoffChapters)].sort((a, b) => a - b) });
    const due = chapterNumber(promise.dueByChapter);
    if (due !== null && latestChapter > due && active(promise.status) && payoffChapters.length === 0) warn("PROMISE_PAYOFF_MISSING", { promiseId: promise.id, dueByChapter: due, latestChapter });
  }

  return warnings;
}

function findReferences(value, targetId, path = "$", found = []) {
  if (typeof value === "string") {
    if (value === targetId && !/(^|\.)id$/.test(path)) found.push(path);
    return found;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => findReferences(item, targetId, path + "[" + index + "]", found));
    return found;
  }
  if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) findReferences(child, targetId, path + "." + key, found);
  }
  return found;
}

/**
 * Exact-ID impact analysis. It reports direct registry/chapter references and
 * chapters that depend on directly linked records. It never edits source data.
 */
export function analyzeCanonImpact({ registries = {}, chapters = [] } = {}, registryName, recordId) {
  if (!text(registryName) || !text(recordId)) throw Error("Provide a registry name and stable record ID");
  const target = entries(registries, registryName).find(item => item?.id === recordId);
  if (!target) throw Error("Record not found: " + registryName + "/" + recordId);

  const directRecords = [];
  const linkedIds = new Set([recordId]);
  for (const [name, registry] of Object.entries(registries)) {
    for (const record of list(registry?.entries)) {
      if (name === registryName && record?.id === recordId) continue;
      const paths = findReferences(record, recordId);
      if (paths.length) {
        directRecords.push({ registry: name, id: record.id ?? null, paths });
        if (record?.id) linkedIds.add(record.id);
      }
    }
  }

  const directChapters = [];
  const indirectlyAffectedChapters = [];
  for (const chapter of chapters) {
    const directPaths = findReferences(chapter, recordId);
    if (directPaths.length) directChapters.push({ chapter: chapter.number, paths: directPaths });
    else {
      const via = [...linkedIds].filter(id => id !== recordId && findReferences(chapter, id).length);
      if (via.length) indirectlyAffectedChapters.push({ chapter: chapter.number, linkedRecordIds: via });
    }
  }
  return {
    target: { registry: registryName, id: recordId, title: target.title ?? target.name ?? target.label ?? null },
    directRegistryReferences: directRecords,
    directlyAffectedChapters: directChapters,
    indirectlyAffectedChapters,
    linkedRecordIds: [...linkedIds].filter(id => id !== recordId),
    limitation: "Exact stable-ID references only. Prose mentions and semantic dependencies are not inferred. Review source records before applying a retcon."
  };
}

export function getNarrativeThreadReport(registries = {}, chapters = []) {
  const latestChapter = [...chapters].filter(item => Number.isInteger(item?.number)).reduce((max, item) => Math.max(max, item.number), 0);
  const mysteries = entries(registries, "11_MYSTERY_REGISTER");
  const loops = entries(registries, "12_OPEN_LOOP_REGISTER");
  const promises = entries(registries, "13_PROMISE_AND_PAYOFF_REGISTER");
  const foreshadowing = promises.filter(item => /foreshadow|clue|setup/i.test(String(item.kind ?? item.type ?? item.category ?? "")) || list(item.clues).length > 0 || list(item.clueChapters).length > 0);
  const summarize = (item, kind) => ({
    id: item.id, title: item.title ?? item.description ?? "", status: item.status ?? "unspecified",
    setupChapter: firstChapter(item.setupChapter, item.introducedInChapter, item.openedInChapter, item.madeInChapter),
    payoffChapter: firstChapter(item.payoffChapter, item.revealChapter, item.revealedInChapter, item.resolvedInChapter, item.fulfilledInChapter),
    dueByChapter: chapterNumber(item.dueByChapter), kind
  });
  return {
    latestChapter,
    mysteries: mysteries.map(item => summarize(item, "mystery")),
    openLoops: loops.map(item => summarize(item, "open_loop")),
    promises: promises.map(item => summarize(item, "promise")),
    foreshadowing: foreshadowing.map(item => ({ ...summarize(item, "foreshadowing"), clueChapters: clueChapters(item) }))
  };
}
