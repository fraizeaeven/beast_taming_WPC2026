const list = value => Array.isArray(value) ? value : [];
const present = value => typeof value === "string" && value.trim().length > 0;
const validId = value => typeof value === "string" && /^[A-Z][A-Z0-9_-]{1,63}$/.test(value);
const chapterNumber = value => Number.isInteger(value) && value > 0 ? value : null;

function collectInteractions(chapters) {
  const result = [];
  for (const chapter of list(chapters)) {
    const number = chapterNumber(chapter?.number);
    if (number === null) continue;
    for (const interaction of list(chapter.relationshipPsychologyChecks)) {
      if (interaction && validId(interaction.id)) result.push({ chapter: number, ...interaction });
    }
  }
  return result.sort((a, b) => a.chapter - b.chapter || a.id.localeCompare(b.id));
}

function relationshipMap(registries) {
  return new Map(list(registries?.["04_RELATIONSHIP_REGISTRY"]?.entries)
    .filter(item => item && validId(item.id)).map(item => [item.id, item]));
}

function matchesParticipants(relationship, first, second) {
  const endpoints = [relationship?.from, relationship?.to].filter(present);
  return endpoints.length === 2 && endpoints.includes(first) && endpoints.includes(second);
}

/** Reviews explicit two-sided relationship annotations; it never infers private states from prose. */
export function checkRelationshipPsychology({ chapters = [], registries = {} } = {}) {
  const errors = [], warnings = [];
  const characters = new Set(list(registries?.["03_CHARACTER_REGISTRY"]?.entries).map(x => x.id));
  const relationships = relationshipMap(registries);
  const interactions = collectInteractions(chapters);
  const patterns = new Map();
  const interactionIds = new Map();

  for (const item of interactions) {
    const key = item.chapter + "::" + item.id;
    if (interactionIds.has(key)) errors.push({ code: "RELATIONSHIP_PSYCHOLOGY_ID_DUPLICATE", chapter: item.chapter, interactionId: item.id });
    interactionIds.set(key, item);
    if (!validId(item.relationshipId) || !relationships.has(item.relationshipId)) {
      errors.push({ code: "RELATIONSHIP_PSYCHOLOGY_RELATIONSHIP_MISSING", chapter: item.chapter, interactionId: item.id, relationshipId: item.relationshipId ?? null });
      continue;
    }
    const relationship = relationships.get(item.relationshipId);
    const participants = [item.initiatorCharacterId, item.responderCharacterId];
    for (const characterId of participants) {
      if (!validId(characterId) || !characters.has(characterId)) errors.push({ code: "RELATIONSHIP_PSYCHOLOGY_CHARACTER_MISSING", chapter: item.chapter, interactionId: item.id, characterId: characterId ?? null });
    }
    if (participants.every(validId) && !matchesParticipants(relationship, participants[0], participants[1])) {
      errors.push({ code: "RELATIONSHIP_PSYCHOLOGY_PARTICIPANTS_MISMATCH", chapter: item.chapter, interactionId: item.id, relationshipId: item.relationshipId, participants, endpoints: [relationship.from ?? null, relationship.to ?? null] });
    }

    if (!present(item.trigger)) warnings.push({ code: "RELATIONSHIP_PSYCHOLOGY_TRIGGER_MISSING", chapter: item.chapter, relationshipId: item.relationshipId, interactionId: item.id });
    if (!present(item.initiatorIntent) && !present(item.initiatorFearOrNeed)) warnings.push({ code: "RELATIONSHIP_PSYCHOLOGY_INITIATOR_MOTIVE_MISSING", chapter: item.chapter, relationshipId: item.relationshipId, interactionId: item.id });
    if (!present(item.initiatorBehaviour)) warnings.push({ code: "RELATIONSHIP_PSYCHOLOGY_BEHAVIOUR_MISSING", chapter: item.chapter, relationshipId: item.relationshipId, interactionId: item.id });
    if (!present(item.responderInterpretation)) warnings.push({ code: "RELATIONSHIP_PSYCHOLOGY_RESPONDER_INTERPRETATION_MISSING", chapter: item.chapter, relationshipId: item.relationshipId, interactionId: item.id });
    if (!present(item.responderResponse)) warnings.push({ code: "RELATIONSHIP_PSYCHOLOGY_RESPONDER_RESPONSE_MISSING", chapter: item.chapter, relationshipId: item.relationshipId, interactionId: item.id });
    if (!present(item.observableEvidence)) warnings.push({ code: "RELATIONSHIP_PSYCHOLOGY_EVIDENCE_MISSING", chapter: item.chapter, relationshipId: item.relationshipId, interactionId: item.id });

    if (["misread", "partial"].includes(String(item.interpretationAccuracy ?? "").toLowerCase()) && !present(item.interpretationGapEvidence)) {
      warnings.push({ code: "RELATIONSHIP_MISINTERPRETATION_UNSUPPORTED", chapter: item.chapter, relationshipId: item.relationshipId, interactionId: item.id });
    }
    if (present(item.trustImpact) && !present(item.trustEvidence)) warnings.push({ code: "RELATIONSHIP_TRUST_IMPACT_UNSUPPORTED", chapter: item.chapter, relationshipId: item.relationshipId, interactionId: item.id });
    if (present(item.relationshipShift) && !present(item.relationshipShiftEvidence)) warnings.push({ code: "RELATIONSHIP_SHIFT_UNSUPPORTED", chapter: item.chapter, relationshipId: item.relationshipId, interactionId: item.id });
    if (present(item.powerDynamic) && !present(item.powerEvidence)) warnings.push({ code: "RELATIONSHIP_POWER_DYNAMIC_UNSUPPORTED", chapter: item.chapter, relationshipId: item.relationshipId, interactionId: item.id });
    if (item.repairAttempt === true && (!present(item.repairOutcome) || !present(item.repairEvidence))) warnings.push({ code: "RELATIONSHIP_REPAIR_OUTCOME_UNRECORDED", chapter: item.chapter, relationshipId: item.relationshipId, interactionId: item.id });
    if (item.boundaryCrossed === true && !present(item.boundaryImpact)) warnings.push({ code: "RELATIONSHIP_BOUNDARY_IMPACT_UNRECORDED", chapter: item.chapter, relationshipId: item.relationshipId, interactionId: item.id });

    if (present(item.defensiveStrategy) && participants.every(validId)) {
      const strategyKey = item.relationshipId + "::" + item.initiatorCharacterId + "::" + item.defensiveStrategy.trim().toLowerCase();
      if (!patterns.has(strategyKey)) patterns.set(strategyKey, []);
      patterns.get(strategyKey).push(item);
    }
  }

  for (const repeated of patterns.values()) {
    if (repeated.length < 2) continue;
    for (const item of repeated) {
      const trust = String(item.trustImpact ?? "").toLowerCase();
      if (["damaged", "strained", "worsening", "reduced"].includes(trust) && !present(item.strategyReview) && !present(item.attemptedAlternative)) {
        warnings.push({ code: "RELATIONSHIP_DEFENSIVE_PATTERN_REPEATED_DESPITE_TRUST_COST", chapter: item.chapter, relationshipId: item.relationshipId, interactionId: item.id, characterId: item.initiatorCharacterId, strategy: item.defensiveStrategy, occurrences: repeated.length });
      }
    }
  }

  for (const chapter of list(chapters)) {
    const number = chapterNumber(chapter?.number);
    if (number === null) continue;
    for (const change of list(chapter.relationshipChanges)) {
      if (!present(change?.sourceInteractionId)) continue;
      const source = interactions.find(item => item.id === change.sourceInteractionId && item.relationshipId === change.relationshipId && item.chapter <= number);
      if (!source) warnings.push({ code: "RELATIONSHIP_CHANGE_SOURCE_INTERACTION_INVALID", chapter: number, relationshipId: change.relationshipId ?? null, sourceInteractionId: change.sourceInteractionId });
    }
  }

  return { errors, warnings };
}

export function getRelationshipPsychologyReport({ chapters = [], registries = {}, relationshipId = null } = {}) {
  if (relationshipId && !validId(relationshipId)) throw Error("Provide a valid uppercase relationship ID");
  const result = checkRelationshipPsychology({ chapters, registries });
  const interactions = collectInteractions(chapters).filter(item => !relationshipId || item.relationshipId === relationshipId);
  const findings = result.warnings.filter(item => !relationshipId || item.relationshipId === relationshipId);
  const selected = [...relationshipMap(registries).values()].filter(item => !relationshipId || item.id === relationshipId);
  return {
    latestChapter: interactions.reduce((max, item) => Math.max(max, item.chapter), 0),
    relationshipReports: selected.map(relationship => ({
      relationshipId: relationship.id,
      participants: [relationship.from ?? null, relationship.to ?? null],
      initialState: relationship.initialState ?? null,
      currentState: relationship.currentState ?? null,
      interactions: interactions.filter(item => item.relationshipId === relationship.id),
      findings: findings.filter(item => item.relationshipId === relationship.id)
    })),
    findings,
    counts: { interactions: interactions.length, findings: findings.length }
  };
}
