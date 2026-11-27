const list = v => Array.isArray(v) ? v : [];
const present = v => typeof v === "string" && v.trim().length > 0;
const chapterNo = v => Number.isInteger(v) && v > 0 ? v : null;
const validId = v => typeof v === "string" && /^[A-Z][A-Z0-9_-]{1,63}$/.test(v);
const states = r => list(r?.["18_CHARACTER_STATE_HISTORY"]?.entries);
const chars = r => list(r?.["03_CHARACTER_REGISTRY"]?.entries);

function compareSnapshots(registries,warnings) {
  const groups=new Map();
  for(const s of states(registries)) if(s?.characterId&&chapterNo(s.chapter)!==null) {
    if(!groups.has(s.characterId)) groups.set(s.characterId,[]);
    groups.get(s.characterId).push(s);
  }
  for(const [characterId,history] of groups) {
    history.sort((a,b)=>a.chapter-b.chapter);
    for(let i=1;i<history.length;i++) {
      const prev=history[i-1],cur=history[i];
      if(present(prev.activeGoal)&&present(cur.activeGoal)&&prev.activeGoal!==cur.activeGoal&&!present(cur.goalChangeReason)&&!present(cur.stageEvidence))
        warnings.push({code:"CHARACTER_GOAL_SHIFT_UNEXPLAINED",characterId,chapter:cur.chapter,previousGoal:prev.activeGoal,currentGoal:cur.activeGoal});
      if(present(prev.motivation)&&present(cur.motivation)&&prev.motivation!==cur.motivation&&!present(cur.motivationChangeReason)&&!present(cur.stageEvidence))
        warnings.push({code:"CHARACTER_MOTIVATION_SHIFT_UNEXPLAINED",characterId,chapter:cur.chapter});
      if(Number.isInteger(prev.arcStage)&&Number.isInteger(cur.arcStage)) {
        if(cur.arcStage>prev.arcStage+1&&!present(cur.transitionEvidence))
          warnings.push({code:"CHARACTER_ARC_STAGE_JUMP_UNSUPPORTED",characterId,chapter:cur.chapter,previousStage:prev.arcStage,currentStage:cur.arcStage});
        if(cur.arcStage===5&&!present(cur.truthRecognized))
          warnings.push({code:"CHARACTER_ARC_HARM_RECOGNITION_UNRECORDED",characterId,chapter:cur.chapter});
        if(cur.arcStage===7) {
          const missing=["truthRecognized","decision","consequence"].filter(f=>!present(cur[f]));
          if(missing.length) warnings.push({code:"CHARACTER_TRANSFORMATION_SUPPORT_INCOMPLETE",characterId,chapter:cur.chapter,missing});
        }
      }
      const prior=new Map(list(prev.relationshipStates).filter(x=>x?.relationshipId).map(x=>[x.relationshipId,x]));
      for(const rel of list(cur.relationshipStates)) {
        const before=prior.get(rel?.relationshipId);
        if(before&&present(before.state)&&present(rel.state)&&before.state!==rel.state&&!present(rel.reason)&&!present(rel.evidence))
          warnings.push({code:"RELATIONSHIP_STATE_CHANGE_UNEXPLAINED",characterId,relationshipId:rel.relationshipId,chapter:cur.chapter,previousState:before.state,currentState:rel.state});
      }
    }
  }
}

function checkDependencies(registries,warnings) {
  const items=list(registries?.["17_STORY_STRUCTURE_REGISTRY"]?.entries);
  const byId=new Map(items.filter(x=>x?.id).map(x=>[x.id,x]));
  const milestones=new Map();
  for(const item of items) for(const m of list(item.milestones)) if(m?.id) milestones.set(m.id,{...m,storyId:item.id});
  for(const item of items) {
    for(const dependencyId of list(item.dependencies)) {
      const prerequisite=byId.get(dependencyId);
      if(prerequisite&&chapterNo(item.startChapter)!==null&&chapterNo(prerequisite.startChapter)!==null&&item.startChapter<prerequisite.startChapter)
        warnings.push({code:"STORY_DEPENDENCY_STARTS_BEFORE_SETUP",storyId:item.id,dependencyId,dependentStartChapter:item.startChapter,dependencyStartChapter:prerequisite.startChapter});
    }
    for(const m of list(item.milestones)) for(const dependencyId of list(m?.dependsOn)) {
      const prerequisite=milestones.get(dependencyId);
      if(!prerequisite) warnings.push({code:"STORY_MILESTONE_DEPENDENCY_MISSING",storyId:item.id,milestoneId:m.id,dependencyMilestoneId:dependencyId});
      else if(chapterNo(m.chapter)!==null&&chapterNo(prerequisite.chapter)!==null&&m.chapter<prerequisite.chapter)
        warnings.push({code:"STORY_MILESTONE_DEPENDENCY_ORDER_CONFLICT",storyId:item.id,milestoneId:m.id,chapter:m.chapter,dependencyMilestoneId:dependencyId,dependencyChapter:prerequisite.chapter});
    }
  }
}

export function checkCharacterIntelligence({registries={},chapters=[]}={}) {
  const errors=[],warnings=[],known=new Set(chars(registries).map(x=>x.id));
  const ordered=[...chapters].filter(c=>chapterNo(c?.number)!==null).sort((a,b)=>a.number-b.number);
  const latest=ordered.at(-1)?.number??0;
  for(const chapter of ordered) for(const beat of list(chapter.psychologyChecks)) {
    if(!beat||!validId(beat.id)||!known.has(beat.characterId)) continue;
    if(present(beat.deliberateChoice)&&!present(beat.consequence))
      warnings.push({code:"CHARACTER_CHOICE_CONSEQUENCE_UNRECORDED",characterId:beat.characterId,chapter:chapter.number,beatId:beat.id});
    if(["conflicts","conflicting","misaligned"].includes(String(beat.goalAlignment??"").toLowerCase())&&!present(beat.decisionRationale)&&!present(beat.conflictEvidence))
      warnings.push({code:"CHARACTER_MOTIVATION_CONFLICT_UNEXPLAINED",characterId:beat.characterId,chapter:chapter.number,beatId:beat.id,activeGoal:beat.activeGoal??null});
    const tracking=beat.consequenceTracking;
    if(tracking&&chapterNo(tracking.expectedByChapter)!==null&&latest>=tracking.expectedByChapter&&chapterNo(tracking.recordedInChapter)===null)
      warnings.push({code:"CHARACTER_CONSEQUENCE_FOLLOW_THROUGH_MISSING",characterId:beat.characterId,chapter:chapter.number,beatId:beat.id,expectedByChapter:tracking.expectedByChapter});
    if(tracking&&chapterNo(tracking.recordedInChapter)!==null&&tracking.recordedInChapter<chapter.number)
      warnings.push({code:"CHARACTER_CONSEQUENCE_CHAPTER_PRECEDES_TRIGGER",characterId:beat.characterId,chapter:chapter.number,beatId:beat.id,recordedInChapter:tracking.recordedInChapter});
    if(tracking&&chapterNo(tracking.recordedInChapter)!==null&&!present(tracking.evidence))
      warnings.push({code:"CHARACTER_CONSEQUENCE_EVIDENCE_MISSING",characterId:beat.characterId,chapter:chapter.number,beatId:beat.id});
  }
  compareSnapshots(registries,warnings);
  checkDependencies(registries,warnings);
  return {errors,warnings};
}

export function getCharacterIntelligenceReport({registries={},chapters=[],characterId=null}={}) {
  if(characterId&&!validId(characterId)) throw Error("Provide a valid uppercase character ID");
  const result=checkCharacterIntelligence({registries,chapters});
  const findings=result.warnings.filter(x=>!characterId||x.characterId===characterId);
  const selected=characterId?chars(registries).filter(x=>x.id===characterId):chars(registries);
  return {
    latestChapter:chapters.reduce((max,c)=>Math.max(max,chapterNo(c?.number)??0),0),
    characterReports:selected.map(c=>({characterId:c.id,name:c.name??c.displayName??null,findings:findings.filter(x=>x.characterId===c.id)})),
    storyDependencyFindings:findings.filter(x=>String(x.code).startsWith("STORY_")),
    findings,
    counts:{total:findings.length,character:findings.filter(x=>x.characterId).length,storyDependencies:findings.filter(x=>String(x.code).startsWith("STORY_")).length}
  };
}
