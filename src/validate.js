import {REGISTRIES} from "./constants.js";
import {registries,chapters,file,read} from "./io.js";
import {checkContinuity} from "./continuity.js";
import {checkStoryStructure} from "./story-structure.js";
import {checkCharacterStateHistory} from "./character-state.js";
import {checkKnowledgeTimeline} from "./knowledge-timeline.js";
import {checkPsychology} from "./psychology.js";
import {checkSceneBehaviour} from "./scene-behaviour.js";
import {checkSceneConstruction} from "./scene-construction.js";
import {checkNovelIntelligence} from "./novel-intelligence.js";
export async function validate(){
  const errors=[],warnings=[],r=await registries(),ids={};
  for(const n of REGISTRIES){const d=r[n];if(!d){errors.push({code:"REGISTRY_MISSING",file:n});continue}if(d.registry!==n)errors.push({code:"REGISTRY_NAME",file:n});if(!Array.isArray(d.entries)){errors.push({code:"ENTRIES_NOT_ARRAY",file:n});continue}ids[n]=new Set();for(const [i,e] of d.entries.entries()){if(!e||typeof e!=="object"||!/^[A-Z][A-Z0-9_-]{1,63}$/.test(e.id??"")){errors.push({code:"ENTRY_OR_ID_INVALID",file:n,index:i});continue}if(ids[n].has(e.id))errors.push({code:"ID_DUPLICATE",file:n,id:e.id});ids[n].add(e.id)}}
  const chars=ids["03_CHARACTER_REGISTRY"]??new Set();
  for(const n of ["04_RELATIONSHIP_REGISTRY","05_MISBELIEF_AND_ARC_TRACKER","14_POV_WHITELIST","15_KNOWLEDGE_TRACKER"]){const fs=n==="04_RELATIONSHIP_REGISTRY"?["from","to"]:["characterId"];for(const e of r[n]?.entries??[])for(const f of fs)if(e[f]&&!chars.has(e[f]))errors.push({code:"CHARACTER_REF_MISSING",file:n,id:e.id,value:e[f]})}
  const seen=new Set(),chapterRecords=[];
  for(const f of await chapters()){try{const c=await read(file("CHAPTERS",f));if(!Number.isInteger(c.number)||c.number<1)errors.push({code:"CHAPTER_NUMBER",file:f});if(seen.has(c.number))errors.push({code:"CHAPTER_DUPLICATE",file:f});seen.add(c.number);chapterRecords.push(c);for(const id of c.charactersPresent??[])if(!chars.has(id))errors.push({code:"CHAPTER_CHARACTER_UNKNOWN",file:f,id})}catch(e){errors.push({code:"CHAPTER_JSON_INVALID",file:f,message:e.message})}}
  warnings.push(...checkContinuity({registries:r,chapters:chapterRecords}));
  const story=checkStoryStructure({registries:r,chapters:chapterRecords});errors.push(...story.errors);warnings.push(...story.warnings);
  const characterStates=checkCharacterStateHistory({registries:r});errors.push(...characterStates.errors);warnings.push(...characterStates.warnings);
  warnings.push(...checkKnowledgeTimeline({registries:r,chapters:chapterRecords}));
  const psychology=checkPsychology({registries:r,chapters:chapterRecords});errors.push(...psychology.errors);warnings.push(...psychology.warnings);
  const sceneBehaviour=checkSceneBehaviour({registries:r,chapters:chapterRecords});errors.push(...sceneBehaviour.errors);warnings.push(...sceneBehaviour.warnings);
  const sceneConstruction=checkSceneConstruction({registries:r,chapters:chapterRecords});errors.push(...sceneConstruction.errors);warnings.push(...sceneConstruction.warnings);
  warnings.push(...checkNovelIntelligence({registries:r,chapters:chapterRecords}));
  return{ok:errors.length===0,errors,warnings,registryCount:Object.keys(r).length,chapterCount:seen.size,continuityWarningCount:warnings.length};
}
