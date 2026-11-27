import {file,exists,read,chapters} from "./io.js";

const validId=value=>typeof value==="string"&&/^[A-Z][A-Z0-9_-]{1,63}$/.test(value);
const chapterFile=n=>"CHAPTER_"+String(n).padStart(4,"0")+".json";
const present=value=>String(value??"").trim().length>0;

export function checkSceneBehaviour({registries={},chapters:chapterRecords=[]}={}) {
  const errors=[],warnings=[],characters=new Set((registries["03_CHARACTER_REGISTRY"]?.entries??[]).map(x=>x.id)),seen=new Set();
  for(const chapter of chapterRecords) for(const beat of chapter.sceneBehaviourChecks??[]) {
    if(!beat||!validId(beat.id)){errors.push({code:"SCENE_BEHAVIOUR_ID_INVALID",chapter:chapter.number});continue;}
    const key=chapter.number+"::"+beat.id;
    if(seen.has(key))errors.push({code:"SCENE_BEHAVIOUR_ID_DUPLICATE",chapter:chapter.number,id:beat.id});
    seen.add(key);
    for(const field of ["actorId","targetCharacterId","observerId"]) if(beat[field]&&!characters.has(beat[field]))errors.push({code:"SCENE_BEHAVIOUR_CHARACTER_MISSING",chapter:chapter.number,id:beat.id,field,characterId:beat[field]});
    if(!present(beat.sceneId))warnings.push({code:"SCENE_BEHAVIOUR_SCENE_UNSPECIFIED",chapter:chapter.number,id:beat.id});
    const core=["action","dialogueBehaviour","bodyLanguage","avoidance","sceneOutcome"];
    const missing=core.filter(field=>!present(beat[field]));
    if(missing.length)warnings.push({code:"SCENE_BEHAVIOUR_INCOMPLETE",chapter:chapter.number,id:beat.id,missing});
    if(!present(beat.observableEvidence))warnings.push({code:"SCENE_BEHAVIOUR_EVIDENCE_MISSING",chapter:chapter.number,id:beat.id});
    if(beat.observerId&&!present(beat.observerObservation))warnings.push({code:"SCENE_BEHAVIOUR_OBSERVATION_MISSING",chapter:chapter.number,id:beat.id});
    if(beat.observerObservation&&!present(beat.observerInterpretation))warnings.push({code:"SCENE_BEHAVIOUR_INTERPRETATION_MISSING",chapter:chapter.number,id:beat.id});
    if(beat.relationshipImpact&&!present(beat.relationshipEvidence))warnings.push({code:"SCENE_BEHAVIOUR_RELATIONSHIP_EVIDENCE_MISSING",chapter:chapter.number,id:beat.id});
    if(beat.arcEffect&&!present(beat.arcEvidence))warnings.push({code:"SCENE_BEHAVIOUR_ARC_EVIDENCE_MISSING",chapter:chapter.number,id:beat.id});
    if(!present(beat.causalLink))warnings.push({code:"SCENE_BEHAVIOUR_CAUSAL_LINK_MISSING",chapter:chapter.number,id:beat.id});
  }
  return {errors,warnings};
}

export async function getSceneBehaviourByChapter(chapterNumber,sceneId=null) {
  const n=Number(chapterNumber);
  if(!Number.isInteger(n)||n<1)throw Error("Provide a positive chapter number");
  const p=file("CHAPTERS",chapterFile(n));
  if(!(await exists(p)))throw Error("Chapter not found");
  const chapter=await read(p),beats=chapter.sceneBehaviourChecks??[];
  return {chapterNumber:n,sceneId,beats:sceneId?beats.filter(x=>x.sceneId===sceneId):beats};
}

export async function getCharacterSceneBehaviourHistory(characterId) {
  if(!validId(characterId))throw Error("Provide a valid uppercase character ID");
  const out=[];
  for(const name of await chapters()) {
    const n=Number(name.match(/\d+/)?.[0]),chapter=await read(file("CHAPTERS",name));
    for(const beat of chapter.sceneBehaviourChecks??[])if([beat.actorId,beat.targetCharacterId,beat.observerId].includes(characterId))out.push({chapter:n,...beat});
  }
  return out.sort((a,b)=>a.chapter-b.chapter||a.id.localeCompare(b.id));
}
