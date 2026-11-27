const list = value => Array.isArray(value) ? value : [];
const present = value => typeof value === "string" && value.trim().length > 0;
const validId = value => typeof value === "string" && /^[A-Z][A-Z0-9_-]{1,63}$/.test(value);
const chapterNumber = value => Number.isInteger(value) && value > 0 ? value : null;

function collectBeats(chapters) {
  const result = [];
  for (const chapter of list(chapters)) {
    const number = chapterNumber(chapter?.number);
    if (number === null) continue;
    for (const beat of list(chapter.psychologyChecks)) {
      if (beat && validId(beat.id) && validId(beat.characterId)) {
        result.push({ chapter: number, ...beat });
      }
    }
  }
  return result.sort((a, b) => a.chapter - b.chapter || a.id.localeCompare(b.id));
}

/**
 * Reviews only author/model-supplied causal annotations. It deliberately does
 * not infer internal states or psychological plausibility from manuscript text.
 */
export function checkDecisionIntelligence({ chapters = [], registries = {} } = {}) {
  const errors = [], warnings = [];
  const characters = new Set(list(registries?.["03_CHARACTER_REGISTRY"]?.entries).map(x => x.id));
  const beats = collectBeats(chapters);
  const byBeatId = new Map(beats.map(beat => [beat.id, beat]));
  const patterns = new Map();

  for (const beat of beats) {
    if (!characters.has(beat.characterId)) {
      errors.push({ code: "DECISION_CHARACTER_MISSING", chapter: beat.chapter, beatId: beat.id, characterId: beat.characterId });
      continue;
    }

    const hasChoice = present(beat.deliberateChoice) || present(beat.choice);
    if (!hasChoice) continue;

    if (!present(beat.interpretation) && !present(beat.beliefActivated)) {
      warnings.push({ code: "DECISION_INTERPRETATION_OR_BELIEF_MISSING", characterId: beat.characterId, chapter: beat.chapter, beatId: beat.id });
    }
    if (!present(beat.decisionRationale) && !present(beat.choicePattern)) {
      warnings.push({ code: "DECISION_RATIONALE_MISSING", characterId: beat.characterId, chapter: beat.chapter, beatId: beat.id });
    }

    if (present(beat.priorExperienceBeatId)) {
      const source = byBeatId.get(beat.priorExperienceBeatId);
      if (!source || source.characterId !== beat.characterId || source.chapter >= beat.chapter) {
        warnings.push({ code: "DECISION_PRIOR_EXPERIENCE_REFERENCE_INVALID", characterId: beat.characterId, chapter: beat.chapter, beatId: beat.id, priorExperienceBeatId: beat.priorExperienceBeatId });
      }
    }

    if (["conflicts", "conflicting", "misaligned"].includes(String(beat.decisionAlignment ?? "").toLowerCase()) &&
        !present(beat.decisionRationale) && !present(beat.conflictEvidence)) {
      warnings.push({ code: "DECISION_PERSONALITY_OR_MISBELIEF_CONFLICT_UNEXPLAINED", characterId: beat.characterId, chapter: beat.chapter, beatId: beat.id });
    }

    if (["reinforced", "challenged", "unchanged"].includes(String(beat.misbeliefEffect ?? "").toLowerCase()) &&
        !present(beat.misbeliefEffectEvidence)) {
      warnings.push({ code: "DECISION_MISBELIEF_EFFECT_UNSUPPORTED", characterId: beat.characterId, chapter: beat.chapter, beatId: beat.id });
    }
    if (present(beat.arcEffect) && !present(beat.arcEffectEvidence)) {
      warnings.push({ code: "DECISION_ARC_EFFECT_UNSUPPORTED", characterId: beat.characterId, chapter: beat.chapter, beatId: beat.id });
    }

    if (beat.responseMismatch === true && !present(beat.responseMismatchReason)) {
      warnings.push({ code: "DECISION_RESPONSE_MISMATCH_UNEXPLAINED", characterId: beat.characterId, chapter: beat.chapter, beatId: beat.id });
    }

    if (present(beat.choicePattern)) {
      const key = beat.characterId + "::" + beat.choicePattern.trim().toLowerCase();
      if (!patterns.has(key)) patterns.set(key, []);
      patterns.get(key).push(beat);
    }

    const tracking = beat.consequenceTracking;
    if (tracking?.requireStateUpdate === true && chapterNumber(tracking.recordedInChapter) !== null) {
      const laterStates = list(registries?.["18_CHARACTER_STATE_HISTORY"]?.entries)
        .filter(state => state?.characterId === beat.characterId &&
          Number.isInteger(state.chapter) && state.chapter >= tracking.recordedInChapter)
        .sort((a, b) => a.chapter - b.chapter);
      const first = laterStates[0];
      if (!first || !list(first.consequenceReferences).includes(beat.id)) {
        warnings.push({ code: "DECISION_CONSEQUENCE_NOT_CARRIED_INTO_CHARACTER_STATE", characterId: beat.characterId, chapter: beat.chapter, beatId: beat.id, recordedInChapter: tracking.recordedInChapter });
      }
    }
  }

  for (const [key, repeated] of patterns) {
    const escalating = repeated.filter(beat => String(beat.consequenceTrend ?? "").toLowerCase() === "worsening");
    for (const beat of escalating) {
      if (!present(beat.strategyReview) && !present(beat.attemptedAlternative)) {
        warnings.push({
          code: "DECISION_PATTERN_REPEATED_DESPITE_WORSENING_COST",
          characterId: beat.characterId,
          chapter: beat.chapter,
          beatId: beat.id,
          pattern: beat.choicePattern,
          occurrences: repeated.length
        });
      }
    }
  }

  return { errors, warnings };
}

export function getDecisionIntelligenceReport({ chapters = [], registries = {}, characterId = null } = {}) {
  if (characterId && !validId(characterId)) throw Error("Provide a valid uppercase character ID");
  const result = checkDecisionIntelligence({ chapters, registries });
  const findings = result.warnings.filter(item => !characterId || item.characterId === characterId);
  const selected = characterId
    ? list(registries?.["03_CHARACTER_REGISTRY"]?.entries).filter(item => item.id === characterId)
    : list(registries?.["03_CHARACTER_REGISTRY"]?.entries);
  const beats = collectBeats(chapters).filter(beat => !characterId || beat.characterId === characterId);
  return {
    latestChapter: beats.reduce((max, beat) => Math.max(max, beat.chapter), 0),
    characterReports: selected.map(character => ({
      characterId: character.id,
      name: character.name ?? character.displayName ?? null,
      decisions: beats.filter(beat => beat.characterId === character.id),
      findings: findings.filter(item => item.characterId === character.id)
    })),
    findings,
    counts: { decisions: beats.length, findings: findings.length }
  };
}
