import {file,exists,read} from "./io.js";
const validId=v=>typeof v==="string"&&/^[A-Z][A-Z0-9_-]{1,63}$/.test(v);
const present=v=>String(v??"").trim().length>0;
const tension=v=>Number.isInteger(v)&&v>=1&&v<=10;
const chapterFile=n=>"CHAPTER_"+String(n).padStart(4,"0")+".json";
export function checkSceneConstruction({registries={},chapters=[]}={}){
 const errors=[],warnings=[],chars=new Set((registries["03_CHARACTER_REGISTRY"]?.entries??[]).map(x=>x.id));
 for(const chapter of chapters){
  const ids=new Set(),sceneIds=new Set(),orders=new Set();
  for(const s of chapter.sceneConstructionChecks??[]){
   if(!s||!validId(s.id)){errors.push({code:"SCENE_CONSTRUCTION_ID_INVALID",chapter:chapter.number});continue}
   if(ids.has(s.id))errors.push({code:"SCENE_CONSTRUCTION_ID_DUPLICATE",chapter:chapter.number,id:s.id});ids.add(s.id);
   if(!present(s.sceneId))warnings.push({code:"SCENE_CONSTRUCTION_SCENE_UNSPECIFIED",chapter:chapter.number,id:s.id});
   else if(sceneIds.has(s.sceneId))errors.push({code:"SCENE_CONSTRUCTION_SCENE_DUPLICATE",chapter:chapter.number,sceneId:s.sceneId});else sceneIds.add(s.sceneId);
   if(s.order!=null){if(!Number.isInteger(s.order)||s.order<1)errors.push({code:"SCENE_CONSTRUCTION_ORDER_INVALID",chapter:chapter.number,id:s.id});else if(orders.has(s.order))errors.push({code:"SCENE_CONSTRUCTION_ORDER_DUPLICATE",chapter:chapter.number,order:s.order});else orders.add(s.order)}
   if(s.povCharacterId&&!chars.has(s.povCharacterId))errors.push({code:"SCENE_CONSTRUCTION_POV_UNKNOWN",chapter:chapter.number,id:s.id,characterId:s.povCharacterId});
   if(s.involvedCharacterIds!=null&&!Array.isArray(s.involvedCharacterIds))errors.push({code:"SCENE_CONSTRUCTION_CHARACTERS_INVALID",chapter:chapter.number,id:s.id});
   for(const c of (Array.isArray(s.involvedCharacterIds)?s.involvedCharacterIds:[]))if(!chars.has(c))errors.push({code:"SCENE_CONSTRUCTION_CHARACTER_UNKNOWN",chapter:chapter.number,id:s.id,characterId:c});
   for(const f of ["sceneGoal","opposition","conflict","stakes","turningPoint","outcome"])if(!present(s[f]))warnings.push({code:"SCENE_CONSTRUCTION_FIELD_MISSING",chapter:chapter.number,id:s.id,field:f});
   if(!Array.isArray(s.escalationSteps)||!s.escalationSteps.length)warnings.push({code:"SCENE_CONSTRUCTION_ESCALATION_UNSPECIFIED",chapter:chapter.number,id:s.id});
   for(const f of ["tensionStart","tensionPeak","tensionEnd"])if(s[f]!=null&&!tension(s[f]))errors.push({code:"SCENE_CONSTRUCTION_TENSION_INVALID",chapter:chapter.number,id:s.id,field:f,value:s[f]});
   if(tension(s.tensionStart)&&tension(s.tensionPeak)&&s.tensionPeak<s.tensionStart)warnings.push({code:"SCENE_CONSTRUCTION_PEAK_BELOW_START",chapter:chapter.number,id:s.id});
   if(tension(s.tensionPeak)&&tension(s.tensionEnd)&&s.tensionEnd>s.tensionPeak)warnings.push({code:"SCENE_CONSTRUCTION_END_ABOVE_PEAK",chapter:chapter.number,id:s.id});
   const advances=["plotProgress","characterArcProgress","relationshipProgress","revelationProgress","decisionProgress"].some(f=>present(s[f]));
   const intentional=["breather","transition"].includes(s.pacingMode);
   if(!advances&&!(intentional&&present(s.purposeRationale)))warnings.push({code:"SCENE_CONSTRUCTION_PURPOSE_UNCLEAR",chapter:chapter.number,id:s.id});
   if(intentional&&!present(s.purposeRationale))warnings.push({code:"SCENE_CONSTRUCTION_BREATHER_RATIONALE_MISSING",chapter:chapter.number,id:s.id});
   if(!present(s.emotionalShift))warnings.push({code:"SCENE_CONSTRUCTION_EMOTIONAL_SHIFT_MISSING",chapter:chapter.number,id:s.id});
   if(!present(s.hookOrExit))warnings.push({code:"SCENE_CONSTRUCTION_EXIT_MISSING",chapter:chapter.number,id:s.id});
   if(!present(s.evidence))warnings.push({code:"SCENE_CONSTRUCTION_EVIDENCE_MISSING",chapter:chapter.number,id:s.id});
  }
 }
 return {errors,warnings};
}
export async function getSceneConstructionByChapter(n){
 n=Number(n);if(!Number.isInteger(n)||n<1)throw Error("Provide a positive chapter number");
 const p=file("CHAPTERS",chapterFile(n));if(!(await exists(p)))throw Error("Chapter not found");
 const c=await read(p);return {chapterNumber:n,scenes:[...(c.sceneConstructionChecks??[])].sort((a,b)=>(a.order??Number.MAX_SAFE_INTEGER)-(b.order??Number.MAX_SAFE_INTEGER))};
}
export async function getScenePacingByChapter(n){
 const r=await getSceneConstructionByChapter(n);
 const scenes=r.scenes.map((s,i)=>({order:s.order??i+1,sceneId:s.sceneId??s.id,pacingMode:s.pacingMode??"unspecified",tension:{start:s.tensionStart??null,peak:s.tensionPeak??null,end:s.tensionEnd??null},emotionalShift:s.emotionalShift??null,turningPoint:s.turningPoint??null,outcome:s.outcome??null,hookOrExit:s.hookOrExit??null,purpose:{sceneGoal:s.sceneGoal??null,plot:s.plotProgress??null,characterArc:s.characterArcProgress??null,relationship:s.relationshipProgress??null,revelation:s.revelationProgress??null,decision:s.decisionProgress??null,rationale:s.purposeRationale??null}}));
 const transitions=scenes.slice(1).map((s,i)=>({from:scenes[i].sceneId,to:s.sceneId,tensionChange:scenes[i].tension.end==null||s.tension.start==null?null:s.tension.start-scenes[i].tension.end,note:"A decrease may be a deliberate release or breather; judge against the intended emotional rhythm."}));
 return {chapterNumber:r.chapterNumber,scenes,transitions};
}
