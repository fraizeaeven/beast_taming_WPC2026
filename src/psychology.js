import {file,exists,read,chapters} from "./io.js";

const validId=value=>typeof value==="string"&&/^[A-Z][A-Z0-9_-]{1,63}$/.test(value);
const chapterFile=n=>"CHAPTER_"+String(n).padStart(4,"0")+".json";

export function checkPsychology({registries={},chapters:chapterRecords=[]}={}) {
  const errors=[],warnings=[],characters=new Set((registries["03_CHARACTER_REGISTRY"]?.entries??[]).map(x=>x.id)),seen=new Set();
  for(const chapter of chapterRecords) {
    for(const beat of chapter.psychologyChecks??[]) {
      if(!beat||!validId(beat.id)){errors.push({code:"PSYCHOLOGY_BEAT_ID_INVALID",chapter:chapter.number});continue;}
      const key=chapter.number+"::"+beat.id;
      if(seen.has(key))errors.push({code:"PSYCHOLOGY_BEAT_ID_DUPLICATE",chapter:chapter.number,id:beat.id});
      seen.add(key);
      if(!validId(beat.characterId)||!characters.has(beat.characterId))errors.push({code:"PSYCHOLOGY_CHARACTER_MISSING",chapter:chapter.number,id:beat.id,characterId:beat.characterId});
      if(!beat.sceneId||typeof beat.sceneId!=="string")warnings.push({code:"PSYCHOLOGY_SCENE_UNSPECIFIED",chapter:chapter.number,id:beat.id});
      if(beat.arcStage!=null&&(!Number.isInteger(beat.arcStage)||beat.arcStage<1||beat.arcStage>7))errors.push({code:"PSYCHOLOGY_ARC_STAGE_INVALID",chapter:chapter.number,id:beat.id,arcStage:beat.arcStage});
      if(beat.arcStage!=null&&!String(beat.stageEvidence??"").trim())warnings.push({code:"PSYCHOLOGY_ARC_STAGE_WITHOUT_EVIDENCE",chapter:chapter.number,id:beat.id});
      const fields=["trigger","automaticReaction","thought","emotion","physicalSensation","expressedEmotion"];
      const missing=fields.filter(field=>!String(beat[field]??"").trim());
      if(missing.length)warnings.push({code:"PSYCHOLOGY_BEAT_INCOMPLETE",chapter:chapter.number,id:beat.id,missing});
      if(!String(beat.observableEvidence??"").trim())warnings.push({code:"PSYCHOLOGY_OBSERVABLE_EVIDENCE_MISSING",chapter:chapter.number,id:beat.id});
      if(!String(beat.interpretation??"").trim())warnings.push({code:"PSYCHOLOGY_INTERPRETATION_MISSING",chapter:chapter.number,id:beat.id});
      if(beat.arcStage!=null&&beat.changeType==="regression"&&!String(beat.stageEvidence??"").trim())warnings.push({code:"PSYCHOLOGY_REGRESSION_WITHOUT_EVIDENCE",chapter:chapter.number,id:beat.id});
    }
  }
  return {errors,warnings};
}

export async function getPsychologyByChapter(chapterNumber) {
  const n=Number(chapterNumber);
  if(!Number.isInteger(n)||n<1)throw Error("Provide a positive chapter number");
  const p=file("CHAPTERS",chapterFile(n));
  if(!(await exists(p)))throw Error("Chapter not found");
  const chapter=await read(p);
  return {chapterNumber:n,beats:chapter.psychologyChecks??[]};
}

export async function getCharacterPsychologyHistory(characterId) {
  if(!validId(characterId))throw Error("Provide a valid uppercase character ID");
  const out=[];
  for(const name of await chapters()) {
    const n=Number(name.match(/\d+/)?.[0]);
    const chapter=await read(file("CHAPTERS",name));
    for(const beat of chapter.psychologyChecks??[])if(beat.characterId===characterId)out.push({chapter:n,...beat});
  }
  return out.sort((a,b)=>a.chapter-b.chapter||a.id.localeCompare(b.id));
}
