import { file, exists, read } from "./io.js";
const entries = registries => registries?.["18_CHARACTER_STATE_HISTORY"]?.entries ?? [];
const validId = value => /^[A-Z][A-Z0-9_-]{1,63}$/.test(value ?? "");
export function reconstructCharacterState({ registries = {}, characterId, chapter } = {}) {
  if (!validId(characterId)) throw Error("Provide a valid uppercase character ID");
  if (!Number.isInteger(Number(chapter)) || Number(chapter) < 1) throw Error("Provide a positive target chapter number");
  const target = Number(chapter);
  const history = entries(registries).filter(item => item?.characterId === characterId && Number.isInteger(item.chapter) && item.chapter <= target).sort((a,b)=>a.chapter-b.chapter);
  if (!history.length) return { characterId, targetChapter:target, found:false, state:null, latestRecordedChapter:null, history:[] };
  const latest=history.at(-1);
  return { characterId,targetChapter:target,found:true,latestRecordedChapter:latest.chapter,snapshotAgeInChapters:target-latest.chapter,state:latest,history };
}
export async function getCharacterState(characterId,chapter) {
  const p=file("CHAPTER_RECORDS","18_CHARACTER_STATE_HISTORY");
  if (!(await exists(p))) throw Error("Character state registry missing; run npm run init");
  return reconstructCharacterState({registries:{"18_CHARACTER_STATE_HISTORY":await read(p)},characterId,chapter});
}
export async function listCharacterHistory(characterId) {
  if (!validId(characterId)) throw Error("Provide a valid uppercase character ID");
  const p=file("CHAPTER_RECORDS","18_CHARACTER_STATE_HISTORY");
  if (!(await exists(p))) throw Error("Character state registry missing; run npm run init");
  return entries({"18_CHARACTER_STATE_HISTORY":await read(p)}).filter(x=>x?.characterId===characterId).sort((a,b)=>(a.chapter??0)-(b.chapter??0));
}
export function checkCharacterStateHistory({registries={}}={}) {
  const errors=[],warnings=[],characters=new Set((registries["03_CHARACTER_REGISTRY"]?.entries??[]).map(x=>x.id)),snapshots=entries(registries),seen=new Set(),byCharacter=new Map();
  for(const item of snapshots){
    if(!item||!validId(item.id)){errors.push({code:"CHARACTER_STATE_ID_INVALID"});continue}
    if(!validId(item.characterId)||!characters.has(item.characterId))errors.push({code:"CHARACTER_STATE_CHARACTER_MISSING",id:item.id,characterId:item.characterId});
    if(!Number.isInteger(item.chapter)||item.chapter<1)errors.push({code:"CHARACTER_STATE_CHAPTER_INVALID",id:item.id,chapter:item.chapter});
    const key=item.characterId+"::"+item.chapter;
    if(seen.has(key))errors.push({code:"CHARACTER_STATE_DUPLICATE_SNAPSHOT",characterId:item.characterId,chapter:item.chapter});
    seen.add(key);
    if(item.arcStage!=null&&(!Number.isInteger(item.arcStage)||item.arcStage<1||item.arcStage>7))errors.push({code:"CHARACTER_ARC_STAGE_INVALID",id:item.id,arcStage:item.arcStage});
    if(item.arcStage!=null&&!item.stageEvidence?.trim())warnings.push({code:"CHARACTER_ARC_STAGE_WITHOUT_EVIDENCE",id:item.id});
    if(!item.source?.kind||!item.source?.reference)warnings.push({code:"CHARACTER_STATE_SOURCE_UNDOCUMENTED",id:item.id});
    if(!byCharacter.has(item.characterId))byCharacter.set(item.characterId,[]);
    byCharacter.get(item.characterId).push(item);
  }
  for(const [characterId,history] of byCharacter){
    history.sort((a,b)=>(a.chapter??0)-(b.chapter??0));
    for(let i=1;i<history.length;i++){const prev=history[i-1],cur=history[i];if(Number.isInteger(prev.arcStage)&&Number.isInteger(cur.arcStage)&&cur.arcStage<prev.arcStage&&cur.changeType!=="regression")warnings.push({code:"CHARACTER_ARC_REGRESSION_UNMARKED",characterId,chapter:cur.chapter,previousStage:prev.arcStage,currentStage:cur.arcStage})}
  }
  return {errors,warnings};
}
