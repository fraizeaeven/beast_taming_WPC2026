const chapterNumber = value => Number.isInteger(value) && value > 0 ? value : null;
const isoDate = value => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};
const entries = (registries, name) => registries?.[name]?.entries ?? [];
const warn = (warnings, code, details) => warnings.push({ code, ...details });

function ageOn(birthDate, date) {
  const birth = new Date(`${birthDate}T00:00:00Z`);
  const at = new Date(`${date}T00:00:00Z`);
  let age = at.getUTCFullYear() - birth.getUTCFullYear();
  if (at.getUTCMonth() < birth.getUTCMonth() || (at.getUTCMonth() === birth.getUTCMonth() && at.getUTCDate() < birth.getUTCDate())) age--;
  return age;
}

/**
 * Semantic checks deliberately rely on explicit, author-maintained annotations.
 * They report warnings only: prose interpretation and canon decisions remain human work.
 */
export function checkContinuity({ registries = {}, chapters = [] } = {}) {
  const warnings = [];
  const ordered = [...chapters].filter(c => c && Number.isInteger(c.number)).sort((a, b) => a.number - b.number);
  const characters = new Map(entries(registries, "03_CHARACTER_REGISTRY").map(c => [c.id, c]));

  // 1. Personality: the author (or an AI review accepted by the author) marks a trait check.
  for (const chapter of ordered) for (const check of chapter.behaviorChecks ?? []) {
    if (check?.assessment === "inconsistent") warn(warnings, "PERSONALITY_INCONSISTENCY", {
      chapter: chapter.number, characterId: check.characterId, traitId: check.traitId,
      evidence: check.evidence ?? "", explanation: check.explanation ?? ""
    });
  }

  // 2. Knowledge: a character cannot use a tracked fact before its recorded discovery.
  const discoveries = new Map();
  for (const item of entries(registries, "15_KNOWLEDGE_TRACKER")) {
    if (!item?.characterId || !item?.factId) continue;
    const key = `${item.characterId}::${item.factId}`;
    const learned = item.source === "backstory" || item.learnedBeforeStory === true ? 0 : chapterNumber(item.learnedInChapter);
    if (learned !== null && (!discoveries.has(key) || learned < discoveries.get(key))) discoveries.set(key, learned);
  }
  for (const chapter of ordered) {
    for (const change of chapter.knowledgeChanges ?? []) {
      if (!change?.characterId || !change?.factId || !["learned", "discovered", "taught", "revealed"].includes(change.action)) continue;
      const key = `${change.characterId}::${change.factId}`;
      if (!discoveries.has(key) || chapter.number < discoveries.get(key)) discoveries.set(key, chapter.number);
    }
    for (const use of chapter.knowledgeUsed ?? []) {
      const key = `${use?.characterId}::${use?.factId}`;
      if (!use?.characterId || !use?.factId) continue;
      const learned = discoveries.get(key);
      if (learned === undefined) warn(warnings, "KNOWLEDGE_DISCOVERY_UNRECORDED", { chapter: chapter.number, characterId: use.characterId, factId: use.factId });
      else if (learned > chapter.number) warn(warnings, "KNOWLEDGE_BEFORE_DISCOVERY", { chapter: chapter.number, characterId: use.characterId, factId: use.factId, learnedInChapter: learned });
    }
  }

  // 3. Age: compare chapter snapshots with birth dates and the chapter's in-world date.
  for (const chapter of ordered) {
    if (!isoDate(chapter.inWorldDate)) continue;
    for (const snapshot of chapter.characterAges ?? []) {
      const character = characters.get(snapshot?.characterId);
      if (!character || !isoDate(character.birthDate) || !Number.isInteger(snapshot.age)) continue;
      const expected = ageOn(character.birthDate, chapter.inWorldDate);
      if (snapshot.age !== expected) warn(warnings, "AGE_TIMELINE_MISMATCH", {
        chapter: chapter.number, characterId: snapshot.characterId, recordedAge: snapshot.age, expectedAge: expected,
        inWorldDate: chapter.inWorldDate, birthDate: character.birthDate
      });
    }
  }

  // 4. Relationships: state transitions must be sequential and have a recorded cause.
  const relationshipEntries = entries(registries, "04_RELATIONSHIP_REGISTRY");
  const relationshipState = new Map(relationshipEntries.filter(r => r?.id && r.initialState !== undefined).map(r => [r.id, r.initialState]));
  for (const chapter of ordered) for (const change of chapter.relationshipChanges ?? []) {
    if (!change?.relationshipId) continue;
    const current = relationshipState.get(change.relationshipId);
    if (current !== undefined && change.fromState !== current) warn(warnings, "RELATIONSHIP_TRANSITION_MISMATCH", {
      chapter: chapter.number, relationshipId: change.relationshipId, expectedFromState: current, recordedFromState: change.fromState ?? null
    });
    if (!change.reason || !String(change.reason).trim()) warn(warnings, "RELATIONSHIP_CHANGE_WITHOUT_CAUSE", { chapter: chapter.number, relationshipId: change.relationshipId });
    if (change.toState !== undefined) relationshipState.set(change.relationshipId, change.toState);
  }
  for (const relationship of relationshipEntries) {
    if (relationship?.id && relationship.currentState !== undefined && relationshipState.has(relationship.id) && relationship.currentState !== relationshipState.get(relationship.id)) {
      warn(warnings, "RELATIONSHIP_REGISTRY_STALE", { relationshipId: relationship.id, recordedCurrentState: relationship.currentState, latestRecordedState: relationshipState.get(relationship.id) });
    }
  }

  // 5. Promises: validate fulfillment timing against their setup and earliest payoff chapter.
  const promises = new Map(entries(registries, "13_PROMISE_AND_PAYOFF_REGISTER").filter(p => p?.id).map(p => [p.id, p]));
  for (const chapter of ordered) for (const action of chapter.promises ?? []) {
    const id = action?.promiseId ?? action?.id;
    const promise = promises.get(id);
    if (!promise || !["fulfilled", "paid_off", "resolved"].includes(action.action ?? action.status)) continue;
    const made = chapterNumber(promise.madeInChapter);
    const earliest = chapterNumber(promise.notBeforeChapter);
    if (made !== null && chapter.number < made) warn(warnings, "PROMISE_FULFILLED_BEFORE_MADE", { chapter: chapter.number, promiseId: id, madeInChapter: made });
    if (earliest !== null && chapter.number < earliest) warn(warnings, "PROMISE_FULFILLED_PREMATURELY", { chapter: chapter.number, promiseId: id, notBeforeChapter: earliest });
  }
  for (const promise of promises.values()) {
    const due = chapterNumber(promise.dueByChapter);
    const fulfilled = chapterNumber(promise.fulfilledInChapter);
    const latestChapter = ordered.at(-1)?.number ?? 0;
    if (due !== null && latestChapter > due && promise.status !== "fulfilled" && fulfilled === null) warn(warnings, "PROMISE_OVERDUE", { promiseId: promise.id, dueByChapter: due, latestChapter });
  }

  // 6. Event continuity: a stable event ID must not acquire conflicting dates.
  const eventDates = new Map();
  const rememberEvent = (id, date, source) => {
    if (!id || !isoDate(date)) return;
    if (eventDates.has(id) && eventDates.get(id).date !== date) warn(warnings, "EVENT_CONTRADICTION", {
      eventId: id, firstDate: eventDates.get(id).date, conflictingDate: date, firstSource: eventDates.get(id).source, conflictingSource: source
    });
    else if (!eventDates.has(id)) eventDates.set(id, { date, source });
  };
  for (const event of entries(registries, "10_EVENT_TIMELINE")) rememberEvent(event?.id, event?.occurredOn, "10_EVENT_TIMELINE");
  for (const chapter of ordered) for (const event of chapter.events ?? []) {
    if (typeof event === "object" && event) rememberEvent(event.eventId ?? event.id, event.occurredOn ?? event.date, `chapter ${chapter.number}`);
  }
  return warnings;
}
