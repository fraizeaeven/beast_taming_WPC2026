const list = value => Array.isArray(value) ? value : [];
const present = value => typeof value === "string" && value.trim().length > 0;
const normaliseBehaviour = value => String(value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
const validId = value => typeof value === "string" && /^[A-Z][A-Z0-9_-]{1,63}$/.test(value);
const chapterNo = value => Number.isInteger(value) && value > 0 ? value : null;

function collectChecks(chapters) {
  const result = [];
  for (const chapter of list(chapters)) {
    const number = chapterNo(chapter?.number);
    if (number === null) continue;
    for (const check of list(chapter.transformationChecks)) {
      if (check && typeof check === "object") result.push({ ...check, chapter: number });
    }
  }
  return result.sort((a, b) => a.chapter - b.chapter ||
    Number(a.order ?? 0) - Number(b.order ?? 0) || String(a.id ?? "").localeCompare(String(b.id ?? "")));
}

function evidencePresent(value) {
  return present(value) || (Array.isArray(value) && value.some(present));
}

/**
 * Reviews explicitly annotated repeat tests of a character's behaviour.
 * It never infers transformation from manuscript prose or stage labels alone.
 */
export function checkCharacterTransformation({ registries = {}, chapters = [] } = {}) {
  const errors = [], warnings = [];
  const characters = new Set(list(registries?.["03_CHARACTER_REGISTRY"]?.entries).map(x => x.id));
  const checks = collectChecks(chapters);
  const byId = new Map();
  const latestChapter = Math.max(0, ...list(chapters).map(c => chapterNo(c?.number) ?? 0));
  const byPattern = new Map();

  for (const check of checks) {
    if (!validId(check.id)) {
      errors.push({ code: "TRANSFORMATION_CHECK_ID_INVALID", chapter: check.chapter, id: check.id ?? null });
      continue;
    }
    if (byId.has(check.id)) errors.push({ code: "TRANSFORMATION_CHECK_ID_DUPLICATE", chapter: check.chapter, id: check.id, previousChapter: byId.get(check.id).chapter });
    else byId.set(check.id, check);

    if (!validId(check.characterId) || !characters.has(check.characterId)) {
      errors.push({ code: "TRANSFORMATION_CHARACTER_UNKNOWN", chapter: check.chapter, id: check.id, characterId: check.characterId ?? null });
    }
    if (check.arcStage != null && (!Number.isInteger(check.arcStage) || check.arcStage < 1 || check.arcStage > 7)) {
      errors.push({ code: "TRANSFORMATION_ARC_STAGE_INVALID", chapter: check.chapter, id: check.id, arcStage: check.arcStage });
    }
    if (!present(check.triggerKey)) warnings.push({ code: "TRANSFORMATION_TRIGGER_KEY_MISSING", characterId: check.characterId, chapter: check.chapter, id: check.id });
    if (!present(check.triggerDescription)) warnings.push({ code: "TRANSFORMATION_TRIGGER_DESCRIPTION_MISSING", characterId: check.characterId, chapter: check.chapter, id: check.id });
    if (!present(check.pressure)) warnings.push({ code: "TRANSFORMATION_PRESSURE_UNSPECIFIED", characterId: check.characterId, chapter: check.chapter, id: check.id });

    const prior = check.priorPattern ?? {};
    const current = check.currentResponse ?? {};
    if (!present(prior.behaviour) || !evidencePresent(prior.evidence)) {
      warnings.push({ code: "TRANSFORMATION_PRIOR_PATTERN_UNSUPPORTED", characterId: check.characterId, chapter: check.chapter, id: check.id });
    }
    if (!present(current.behaviour) || !evidencePresent(current.evidence)) {
      warnings.push({ code: "TRANSFORMATION_CURRENT_BEHAVIOUR_UNSUPPORTED", characterId: check.characterId, chapter: check.chapter, id: check.id });
    }
    if (present(prior.behaviour) && present(current.behaviour)) {
      const sameBehaviour = normaliseBehaviour(prior.behaviour) === normaliseBehaviour(current.behaviour);
      if (check.outcome === "different_response" && sameBehaviour) {
        warnings.push({ code: "TRANSFORMATION_BEHAVIOUR_NOT_DIFFERENT_FROM_BASELINE", characterId: check.characterId, chapter: check.chapter, id: check.id });
      }
      if (check.outcome === "old_pattern_repeated" && !sameBehaviour) {
        warnings.push({ code: "TRANSFORMATION_REPEATED_PATTERN_DIFFERS_FROM_BASELINE", characterId: check.characterId, chapter: check.chapter, id: check.id });
      }
    }
    if (check.outcome === "different_response" && (!present(current.deliberateChoice) || !evidencePresent(current.evidence))) {
      warnings.push({ code: "TRANSFORMATION_CHANGED_RESPONSE_WITHOUT_CHOICE_EVIDENCE", characterId: check.characterId, chapter: check.chapter, id: check.id });
    }
    if (present(check.claimOfChange) && !present(current.behaviour) && !present(current.deliberateChoice)) {
      warnings.push({ code: "TRANSFORMATION_CLAIM_WITHOUT_BEHAVIOURAL_PROOF", characterId: check.characterId, chapter: check.chapter, id: check.id });
    }
    if (check.appliedTruth === true && (!present(current.appliedTruth) || !evidencePresent(current.evidence))) {
      warnings.push({ code: "TRANSFORMATION_TRUTH_APPLICATION_UNSUPPORTED", characterId: check.characterId, chapter: check.chapter, id: check.id });
    }
    if (check.appliedTruth === true && !present(check.pressure)) {
      warnings.push({ code: "TRANSFORMATION_TRUTH_NOT_TESTED_UNDER_PRESSURE", characterId: check.characterId, chapter: check.chapter, id: check.id });
    }

    const setback = check.setback;
    if (setback?.oldMisbeliefReturned === true && !evidencePresent(setback.evidence)) {
      warnings.push({ code: "TRANSFORMATION_MISBELIEF_RETURN_WITHOUT_EVIDENCE", characterId: check.characterId, chapter: check.chapter, id: check.id });
    }
    if (setback?.oldMisbeliefReturned === true && !present(setback.recoveryChoice) && check.outcome === "different_response") {
      warnings.push({ code: "TRANSFORMATION_SETBACK_RECOVERY_UNRECORDED", characterId: check.characterId, chapter: check.chapter, id: check.id });
    }
    if (check.outcome === "different_response" && !present(check.choiceCost?.sacrifice) && !present(check.choiceCost?.cost)) {
      warnings.push({ code: "TRANSFORMATION_COST_OR_SACRIFICE_UNRECORDED", characterId: check.characterId, chapter: check.chapter, id: check.id });
    }
    if (check.outcome === "different_response" && !evidencePresent(check.choiceCost?.evidence) && (present(check.choiceCost?.sacrifice) || present(check.choiceCost?.cost))) {
      warnings.push({ code: "TRANSFORMATION_COST_EVIDENCE_MISSING", characterId: check.characterId, chapter: check.chapter, id: check.id });
    }

    for (const witness of list(check.witnesses)) {
      if (!validId(witness?.characterId) || !characters.has(witness.characterId)) {
        errors.push({ code: "TRANSFORMATION_WITNESS_UNKNOWN", characterId: check.characterId, chapter: check.chapter, id: check.id, witnessId: witness?.characterId ?? null });
      }
      if ((!present(witness?.observation) || !evidencePresent(witness?.evidence)) && (present(witness?.response) || present(witness?.observation))) {
        warnings.push({ code: "TRANSFORMATION_WITNESS_RESPONSE_UNSUPPORTED", characterId: check.characterId, chapter: check.chapter, id: check.id, witnessId: witness?.characterId ?? null });
      }
    }

    if (check.priorCheckId) {
      const source = byId.get(check.priorCheckId);
      if (!source || source.characterId !== check.characterId || source.chapter >= check.chapter ||
          (present(check.triggerKey) && source.triggerKey !== check.triggerKey)) {
        errors.push({ code: "TRANSFORMATION_PRIOR_CHECK_REFERENCE_INVALID", characterId: check.characterId, chapter: check.chapter, id: check.id, priorCheckId: check.priorCheckId });
      }
    }

    if (present(check.triggerKey)) {
      const key = check.characterId + "::" + check.triggerKey.trim().toLowerCase();
      if (!byPattern.has(key)) byPattern.set(key, []);
      byPattern.get(key).push(check);
    }
    if (check.arcStage === 7 && check.outcome !== "different_response") {
      warnings.push({ code: "TRANSFORMATION_STAGE_SEVEN_WITHOUT_CHANGED_RESPONSE", characterId: check.characterId, chapter: check.chapter, id: check.id });
    }
    if (check.outcome && !["different_response", "old_pattern_repeated", "mixed", "not_tested"].includes(check.outcome)) {
      errors.push({ code: "TRANSFORMATION_OUTCOME_INVALID", characterId: check.characterId, chapter: check.chapter, id: check.id, outcome: check.outcome });
    }
  }

  for (const [pattern, occurrences] of byPattern) {
    const changed = occurrences.filter(x => x.outcome === "different_response" && present(x.currentResponse?.behaviour) && evidencePresent(x.currentResponse?.evidence));
    const characterId = occurrences[0].characterId;
    if (occurrences.some(x => x.priorCheckId && !byId.has(x.priorCheckId))) {
      warnings.push({ code: "TRANSFORMATION_PRIOR_TEST_NOT_AVAILABLE", characterId, pattern });
    }
    for (const check of occurrences.filter(x => x.outcome === "old_pattern_repeated")) {
      warnings.push({ code: "TRANSFORMATION_OLD_PATTERN_REPEATED", characterId, chapter: check.chapter, id: check.id, triggerKey: check.triggerKey });
    }
    const sustainedAcrossChapters = changed.length >= 2 && new Set(changed.map(x => x.chapter)).size >= 2;
    if (changed.length && !sustainedAcrossChapters) {
      const latestChanged = changed.at(-1);
      warnings.push({ code: "TRANSFORMATION_CHANGE_NOT_YET_SUSTAINED", characterId, chapter: latestChanged.chapter, id: latestChanged.id, triggerKey: latestChanged.triggerKey, observedTests: occurrences.length });
    }
    if (sustainedAcrossChapters) {
      const latestChanged = changed.at(-1);
      if (!present(latestChanged.sustainedPattern?.evidence) && !evidencePresent(latestChanged.sustainedPattern?.supportingEvidence)) {
        warnings.push({ code: "TRANSFORMATION_SUSTAINED_PATTERN_EVIDENCE_MISSING", characterId, chapter: latestChanged.chapter, id: latestChanged.id, triggerKey: latestChanged.triggerKey });
      }
    }
  }

  for (const state of list(registries?.["18_CHARACTER_STATE_HISTORY"]?.entries)) {
    if (state?.arcStage !== 7) continue;
    const evidenceChecks = checks.filter(x => x.characterId === state.characterId && x.chapter <= state.chapter &&
      x.outcome === "different_response" && present(x.currentResponse?.behaviour) && evidencePresent(x.currentResponse?.evidence));
    const sustained = new Map();
    for (const check of evidenceChecks) {
      const key = check.triggerKey;
      if (!present(key)) continue;
      if (!sustained.has(key)) sustained.set(key, []);
      sustained.get(key).push(check);
    }
    const repeated = [...sustained.values()].some(group => group.length >= 2 && new Set(group.map(x => x.chapter)).size >= 2);
    if (!repeated) warnings.push({ code: "TRANSFORMATION_STAGE_SEVEN_NOT_SUSTAINED", characterId: state.characterId, chapter: state.chapter, stateId: state.id });
  }

  return { errors, warnings, latestChapter, checks };
}

export function getCharacterTransformationReport({ registries = {}, chapters = [], characterId = null } = {}) {
  if (characterId && !validId(characterId)) throw Error("Provide a valid uppercase character ID");
  const result = checkCharacterTransformation({ registries, chapters });
  const selected = list(registries?.["03_CHARACTER_REGISTRY"]?.entries).filter(x => !characterId || x.id === characterId);
  const checks = result.checks.filter(x => !characterId || x.characterId === characterId);
  const findings = [...result.errors, ...result.warnings].filter(x => !characterId || x.characterId === characterId);
  const byCharacter = selected.map(character => {
    const records = checks.filter(x => x.characterId === character.id);
    const patterns = new Map();
    for (const record of records) {
      if (!present(record.triggerKey)) continue;
      if (!patterns.has(record.triggerKey)) patterns.set(record.triggerKey, []);
      patterns.get(record.triggerKey).push(record);
    }
    return {
      characterId: character.id,
      name: character.name ?? character.displayName ?? null,
      checks: records,
      triggerPatterns: [...patterns].map(([triggerKey, occurrences]) => ({
        triggerKey, occurrences: occurrences.length,
        changedResponses: occurrences.filter(x => x.outcome === "different_response").length,
        repeatedOldPatterns: occurrences.filter(x => x.outcome === "old_pattern_repeated").length,
        sustainedAcrossChapters: occurrences.filter(x => x.outcome === "different_response").length >= 2 &&
          new Set(occurrences.filter(x => x.outcome === "different_response").map(x => x.chapter)).size >= 2
      })),
      findings: findings.filter(x => x.characterId === character.id)
    };
  });
  return {
    latestChapter: result.latestChapter,
    characterReports: byCharacter,
    findings,
    counts: { checks: checks.length, findings: findings.length, characters: byCharacter.length }
  };
}
