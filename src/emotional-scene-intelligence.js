const list = value => Array.isArray(value) ? value : [];
const present = value => typeof value === "string" && value.trim().length > 0;
const validId = value => typeof value === "string" && /^[A-Z][A-Z0-9_-]{1,63}$/.test(value);
const chapterNumber = value => Number.isInteger(value) && value > 0 ? value : null;

function collectScenes(chapters) {
  const result = [];
  for (const chapter of list(chapters)) {
    const number = chapterNumber(chapter?.number);
    if (number === null) continue;
    for (const scene of list(chapter.sceneInterpretationChecks)) {
      if (scene && validId(scene.id)) result.push({ chapter: number, ...scene });
    }
  }
  return result.sort((a, b) => a.chapter - b.chapter || String(a.order ?? 0).localeCompare(String(b.order ?? 0)) || a.id.localeCompare(b.id));
}

/**
 * Reviews author-recorded perspective gaps and dramatic irony. It does not infer
 * private thoughts, determine objective truth, or promote reader knowledge to canon.
 */
export function checkEmotionalSceneIntelligence({ registries = {}, chapters = [] } = {}) {
  const errors = [], warnings = [];
  const characters = new Set(list(registries?.["03_CHARACTER_REGISTRY"]?.entries).map(x => x.id));
  const sceneKeys = new Set();
  const allScenes = collectScenes(chapters);
  const priorInformation = new Map();

  for (const scene of allScenes) {
    const key = scene.chapter + "::" + scene.id;
    if (sceneKeys.has(key)) errors.push({ code: "SCENE_INTERPRETATION_ID_DUPLICATE", chapter: scene.chapter, id: scene.id });
    sceneKeys.add(key);
    if (!validId(scene.id)) errors.push({ code: "SCENE_INTERPRETATION_ID_INVALID", chapter: scene.chapter });
    if (!present(scene.sceneId)) warnings.push({ code: "SCENE_INTERPRETATION_SCENE_UNSPECIFIED", chapter: scene.chapter, id: scene.id });
    if (!present(scene.objectiveEvent)) warnings.push({ code: "SCENE_OBJECTIVE_EVENT_MISSING", chapter: scene.chapter, id: scene.id });
    if (!present(scene.objectiveEvidence)) warnings.push({ code: "SCENE_OBJECTIVE_EVIDENCE_MISSING", chapter: scene.chapter, id: scene.id });

    const perspectives = list(scene.perspectives);
    const perspectiveIds = new Set();
    for (const view of perspectives) {
      if (!validId(view?.characterId) || !characters.has(view.characterId)) {
        errors.push({ code: "SCENE_PERSPECTIVE_CHARACTER_MISSING", chapter: scene.chapter, sceneId: scene.id, characterId: view?.characterId ?? null });
        continue;
      }
      if (perspectiveIds.has(view.characterId)) errors.push({ code: "SCENE_PERSPECTIVE_CHARACTER_DUPLICATE", chapter: scene.chapter, sceneId: scene.id, characterId: view.characterId });
      perspectiveIds.add(view.characterId);
      if (!present(view.interpretation)) warnings.push({ code: "SCENE_CHARACTER_INTERPRETATION_MISSING", chapter: scene.chapter, sceneId: scene.id, characterId: view.characterId });
      if (present(view.interpretation) && !present(view.interpretationEvidence)) warnings.push({ code: "SCENE_INTERPRETATION_EVIDENCE_MISSING", chapter: scene.chapter, sceneId: scene.id, characterId: view.characterId });
      if (present(view.resultingBehaviour) && !present(view.behaviourEvidence)) warnings.push({ code: "SCENE_INTERPRETATION_BEHAVIOUR_EVIDENCE_MISSING", chapter: scene.chapter, sceneId: scene.id, characterId: view.characterId });
      if (view.interpretationAccuracy === "misread" && !present(view.misreadEvidence)) warnings.push({ code: "SCENE_MISREAD_UNSUPPORTED", chapter: scene.chapter, sceneId: scene.id, characterId: view.characterId });
      if (list(view.knowledgeIds).length && !present(view.knowledgeEvidence)) warnings.push({ code: "SCENE_KNOWLEDGE_CLAIM_UNSUPPORTED", chapter: scene.chapter, sceneId: scene.id, characterId: view.characterId });
    }
    if (perspectives.length > 1 && !present(scene.perspectiveGapEvidence)) {
      const interpretations = perspectives.map(x => x?.interpretation).filter(present);
      if (new Set(interpretations).size > 1) warnings.push({ code: "SCENE_PERSPECTIVE_GAP_UNEXPLAINED", chapter: scene.chapter, sceneId: scene.id });
    }

    for (const secret of list(scene.concealedInformation)) {
      if (!validId(secret?.holderCharacterId) || !characters.has(secret.holderCharacterId)) {
        errors.push({ code: "SCENE_SECRET_HOLDER_UNKNOWN", chapter: scene.chapter, sceneId: scene.id, holderCharacterId: secret?.holderCharacterId ?? null });
      }
      if (!present(secret?.informationId)) warnings.push({ code: "SCENE_CONCEALED_INFORMATION_ID_MISSING", chapter: scene.chapter, sceneId: scene.id });
      if (!present(secret?.description) || !present(secret?.evidence)) warnings.push({ code: "SCENE_CONCEALMENT_UNSUPPORTED", chapter: scene.chapter, sceneId: scene.id, informationId: secret?.informationId ?? null });
      if (present(secret?.informationId)) {
        if (!priorInformation.has(secret.informationId)) priorInformation.set(secret.informationId, []);
        priorInformation.get(secret.informationId).push({ chapter: scene.chapter, sceneId: scene.sceneId ?? scene.id, holderCharacterId: secret.holderCharacterId });
      }
    }

    const reader = scene.readerKnowledge;
    if (reader != null && !present(reader.evidence)) warnings.push({ code: "SCENE_READER_KNOWLEDGE_EVIDENCE_MISSING", chapter: scene.chapter, sceneId: scene.id });
    for (const update of list(scene.beliefUpdates)) {
      if (!validId(update?.characterId) || !characters.has(update.characterId)) errors.push({ code: "SCENE_BELIEF_UPDATE_CHARACTER_UNKNOWN", chapter: scene.chapter, sceneId: scene.id, characterId: update?.characterId ?? null });
      if (present(update?.newInterpretation) && !present(update?.newEvidence)) warnings.push({ code: "SCENE_BELIEF_UPDATE_WITHOUT_NEW_EVIDENCE", chapter: scene.chapter, sceneId: scene.id, characterId: update.characterId ?? null });
    }
    for (const reveal of list(scene.reveals)) {
      if (!present(reveal?.informationId) || !present(reveal?.revealEvidence)) warnings.push({ code: "SCENE_REVEAL_UNSUPPORTED", chapter: scene.chapter, sceneId: scene.id });
      const setups = list(reveal?.setupSceneIds);
      const earlier = (priorInformation.get(reveal?.informationId) ?? []).filter(item => item.chapter < scene.chapter);
      if (!setups.length && !earlier.length) warnings.push({ code: "SCENE_REVEAL_WITHOUT_RECORDED_SETUP", chapter: scene.chapter, sceneId: scene.id, informationId: reveal?.informationId ?? null });
      if (setups.length && !setups.some(id => allScenes.some(item => item.chapter < scene.chapter && (item.sceneId === id || item.id === id)))) {
        warnings.push({ code: "SCENE_REVEAL_SETUP_REFERENCE_NOT_FOUND", chapter: scene.chapter, sceneId: scene.id, setupSceneIds: setups });
      }
    }
  }
  return { errors, warnings };
}

export function getEmotionalSceneReport({ registries = {}, chapters = [], characterId = null } = {}) {
  if (characterId && !validId(characterId)) throw Error("Provide a valid uppercase character ID");
  const result = checkEmotionalSceneIntelligence({ registries, chapters });
  const scenes = collectScenes(chapters).filter(scene => !characterId ||
    list(scene.perspectives).some(view => view?.characterId === characterId) ||
    list(scene.beliefUpdates).some(update => update?.characterId === characterId));
  const warnings = result.warnings.filter(item => !characterId || item.characterId === characterId);
  const errors = result.errors.filter(item => !characterId || item.characterId === characterId);
  return { scenes, errors, findings: warnings, counts: { scenes: scenes.length, errors: errors.length, findings: warnings.length } };
}
