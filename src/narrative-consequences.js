const list = value => Array.isArray(value) ? value : [];
const present = value => typeof value === "string" && value.trim().length > 0;
const validId = value => typeof value === "string" && /^[A-Z][A-Z0-9_-]{1,63}$/.test(value);
const chapterNo = value => Number.isInteger(value) && value > 0 ? value : null;
const allowedSources = new Set(["decision","relationship","scene","behaviour","construction","consequence"]);
const sourceFields = {
  decision: "psychologyChecks",
  relationship: "relationshipPsychologyChecks",
  scene: "sceneInterpretationChecks",
  behaviour: "sceneBehaviourChecks",
  construction: "sceneConstructionChecks"
};

function collectConsequences(chapters) {
  const result = [];
  for (const chapter of list(chapters)) {
    const number = chapterNo(chapter?.number);
    if (number === null) continue;
    for (const item of list(chapter.consequenceChecks)) {
      if (item && typeof item === "object") result.push({ chapter: number, ...item });
    }
  }
  return result.sort((a,b)=>a.chapter-b.chapter || Number(a.order??0)-Number(b.order??0) || String(a.id??"").localeCompare(String(b.id??"")));
}

function findSource(chapters, kind, recordId, sourceChapter) {
  if (kind === "consequence") return collectConsequences(chapters).find(item => item.id === recordId && item.chapter <= sourceChapter) ?? null;
  const field = sourceFields[kind];
  if (!field) return null;
  for (const chapter of list(chapters)) {
    if (chapterNo(chapter?.number) !== sourceChapter) continue;
    return list(chapter[field]).find(item => item?.id === recordId) ?? null;
  }
  return null;
}

/**
 * Connects explicit author-recorded consequences across chapters. It validates
 * references and follow-through without inferring causation or changing canon.
 */
export function checkNarrativeConsequences({ registries = {}, chapters = [] } = {}) {
  const errors=[], warnings=[];
  const characters=new Set(list(registries?.["03_CHARACTER_REGISTRY"]?.entries).map(x=>x.id));
  const relationships=new Set(list(registries?.["04_RELATIONSHIP_REGISTRY"]?.entries).map(x=>x.id));
  const records=collectConsequences(chapters);
  const chapterNumbers=list(chapters).map(c=>chapterNo(c?.number)).filter(x=>x!==null);
  const latestChapter=Math.max(0,...chapterNumbers);
  const byId=new Map(), chapterByRecord=new Map();

  for(const item of records) {
    if(!validId(item.id)) {
      errors.push({code:"CONSEQUENCE_ID_INVALID",chapter:item.chapter,id:item.id??null});
      continue;
    }
    if(byId.has(item.id)) errors.push({code:"CONSEQUENCE_ID_DUPLICATE",chapter:item.chapter,id:item.id,previousChapter:byId.get(item.id).chapter});
    else byId.set(item.id,item);
    if(!present(item.description)) warnings.push({code:"CONSEQUENCE_DESCRIPTION_MISSING",chapter:item.chapter,id:item.id});
    if(!present(item.evidence)) warnings.push({code:"CONSEQUENCE_EVIDENCE_MISSING",chapter:item.chapter,id:item.id});
    if(!validId(item.affectedCharacterId)||!characters.has(item.affectedCharacterId))
      errors.push({code:"CONSEQUENCE_AFFECTED_CHARACTER_UNKNOWN",chapter:item.chapter,id:item.id,characterId:item.affectedCharacterId??null});
    if(item.initiatingCharacterId && (!validId(item.initiatingCharacterId)||!characters.has(item.initiatingCharacterId)))
      errors.push({code:"CONSEQUENCE_INITIATOR_UNKNOWN",chapter:item.chapter,id:item.id,characterId:item.initiatingCharacterId});
    if(!present(item.responseBehaviour) && !present(item.resultingDecision))
      warnings.push({code:"CONSEQUENCE_CHARACTER_RESPONSE_MISSING",chapter:item.chapter,id:item.id,characterId:item.affectedCharacterId??null});
    if(!list(item.impactDomains).length)
      warnings.push({code:"CONSEQUENCE_IMPACT_DOMAIN_MISSING",chapter:item.chapter,id:item.id});
    if(!item.source || !allowedSources.has(item.source.kind) || !validId(item.source.recordId) || chapterNo(item.source.chapter)===null) {
      errors.push({code:"CONSEQUENCE_SOURCE_REFERENCE_INVALID",chapter:item.chapter,id:item.id});
    } else {
      if(item.source.chapter>item.chapter) errors.push({code:"CONSEQUENCE_SOURCE_FROM_FUTURE",chapter:item.chapter,id:item.id,sourceChapter:item.source.chapter});
      if(item.source.kind!=="consequence" && !findSource(chapters,item.source.kind,item.source.recordId,item.source.chapter))
        errors.push({code:"CONSEQUENCE_SOURCE_NOT_FOUND",chapter:item.chapter,id:item.id,source:item.source});
      if(item.source.kind==="consequence" && !byId.has(item.source.recordId))
        errors.push({code:"CONSEQUENCE_PARENT_NOT_FOUND_OR_NOT_EARLIER",chapter:item.chapter,id:item.id,parentId:item.source.recordId});
      const source=findSource(chapters,item.source.kind,item.source.recordId,item.source.chapter);
      if(source && item.source.chapter===item.chapter && Number.isFinite(source.order) && Number.isFinite(item.order) && source.order>item.order)
        errors.push({code:"CONSEQUENCE_PRECEDES_SAME_CHAPTER_SOURCE",chapter:item.chapter,id:item.id,sourceId:item.source.recordId});
    }
    if(item.causedByConsequenceId) {
      const parent=byId.get(item.causedByConsequenceId);
      if(!validId(item.causedByConsequenceId)||!parent||parent.chapter>item.chapter || parent.id===item.id)
        errors.push({code:"CONSEQUENCE_CHAIN_REFERENCE_INVALID",chapter:item.chapter,id:item.id,parentId:item.causedByConsequenceId});
    }
    const relationshipId=item.relationshipImpact?.relationshipId;
    if(relationshipId && !relationships.has(relationshipId))
      errors.push({code:"CONSEQUENCE_RELATIONSHIP_UNKNOWN",chapter:item.chapter,id:item.id,relationshipId});
    if(item.relationshipImpact && !present(item.relationshipImpact.evidence))
      warnings.push({code:"CONSEQUENCE_RELATIONSHIP_IMPACT_UNSUPPORTED",chapter:item.chapter,id:item.id,relationshipId:relationshipId??null});
    if(item.characterStateImpact && !present(item.characterStateImpact.evidence))
      warnings.push({code:"CONSEQUENCE_CHARACTER_STATE_IMPACT_UNSUPPORTED",chapter:item.chapter,id:item.id,characterId:item.affectedCharacterId});
    const follow=item.followUp;
    if(follow) {
      if(chapterNo(follow.expectedByChapter)===null || follow.expectedByChapter<item.chapter)
        errors.push({code:"CONSEQUENCE_FOLLOWUP_DUE_DATE_INVALID",chapter:item.chapter,id:item.id,expectedByChapter:follow.expectedByChapter??null});
      if(follow.status==="observed" && (!chapterNo(follow.observedAtChapter) || !present(follow.evidence)))
        warnings.push({code:"CONSEQUENCE_FOLLOWUP_OBSERVATION_UNSUPPORTED",chapter:item.chapter,id:item.id});
      if(follow.status==="pending" && chapterNo(follow.expectedByChapter)!==null && latestChapter>=follow.expectedByChapter)
        warnings.push({code:"CONSEQUENCE_FOLLOWUP_OVERDUE",chapter:item.chapter,id:item.id,expectedByChapter:follow.expectedByChapter,latestChapter});
      if(follow.status && !["pending","observed","not_applicable"].includes(follow.status))
        errors.push({code:"CONSEQUENCE_FOLLOWUP_STATUS_INVALID",chapter:item.chapter,id:item.id,status:follow.status});
    }
    if(item.stateCarryForward?.required===true) {
      const states=list(registries?.["18_CHARACTER_STATE_HISTORY"]?.entries)
        .filter(state=>state?.characterId===item.affectedCharacterId && Number.isInteger(state.chapter) && state.chapter>=item.chapter)
        .sort((a,b)=>a.chapter-b.chapter);
      if(!states.some(state=>list(state.consequenceReferences).includes(item.id)))
        warnings.push({code:"CONSEQUENCE_NOT_CARRIED_INTO_CHARACTER_STATE",chapter:item.chapter,id:item.id,characterId:item.affectedCharacterId});
    }
    chapterByRecord.set(item.id,item.chapter);
  }
  return {errors,warnings,latestChapter};
}

export function getNarrativeConsequenceReport({registries={},chapters=[],characterId=null}={}) {
  if(characterId&&!validId(characterId)) throw Error("Provide a valid uppercase character ID");
  const result=checkNarrativeConsequences({registries,chapters});
  const all=collectConsequences(chapters);
  const selected=all.filter(item=>!characterId||item.affectedCharacterId===characterId||item.initiatingCharacterId===characterId);
  const ids=new Set(selected.map(item=>item.id));
  const chains=selected.map(item=>({
    ...item,
    causedBy: item.causedByConsequenceId ? (all.find(parent=>parent.id===item.causedByConsequenceId)??null) : null,
    downstream: all.filter(child=>child.causedByConsequenceId===item.id).map(child=>child.id)
  }));
  const findings=[...result.errors,...result.warnings].filter(item=>!characterId||selected.some(record=>record.id===item.id)||item.characterId===characterId);
  return {latestChapter:result.latestChapter,consequences:chains,findings,counts:{consequences:chains.length,findings:findings.length,chainsWithDownstream:chains.filter(x=>x.downstream.length).length}};
}
