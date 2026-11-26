import { file, exists, read, chapters } from "./io.js";
const list = v => Array.isArray(v) ? v : [];
const entries = (r,n) => list(r?.[n]?.entries);
const validId = v => /^[A-Z][A-Z0-9_-]{1,63}$/.test(v ?? "");
const target = v => { const n=Number(v); if(!Number.isInteger(n)||n<1) throw Error("Provide a positive target chapter number"); return n; };
const validChar = v => { if(!validId(v)) throw Error("Provide a valid uppercase character ID"); };
async function load() {
  const registries={}, records=[];
  for(const n of ["03_CHARACTER_REGISTRY","06_DOCUMENT_AND_OBJECT_REGISTRY","09_LOCATION_REGISTRY","10_EVENT_TIMELINE","14_POV_WHITELIST","15_KNOWLEDGE_TRACKER"]) {
    const p=file("CHAPTER_RECORDS",n); if(await exists(p)) registries[n]=await read(p);
  }
  for(const n of await chapters()) records.push(await read(file("CHAPTERS",n)));
  return {registries,records:records.sort((a,b)=>a.number-b.number)};
}
const LEARN=new Set(["learned","learn","discovered","taught","revealed","remembered","informed"]);
const FORGET=new Set(["forgotten","forget","forgot","lost","disproved","retracted"]);
export function reconstructKnowledge({registries={},chapters:records=[],characterId,chapter,factId=null}={}) {
  validChar(characterId); const at=target(chapter);
  if(factId&&!validId(factId)) throw Error("Provide a valid uppercase fact ID");
  const history=[];
  for(const x of entries(registries,"15_KNOWLEDGE_TRACKER")) if(x?.characterId===characterId&&(!factId||x.factId===factId)) {
    const n=x.source==="backstory"||x.learnedBeforeStory===true?0:x.learnedInChapter;
    if(Number.isInteger(n)&&n>=0) history.push({chapter:n,action:"learned",factId:x.factId,method:x.method??x.how??x.source??"registry",source:"15_KNOWLEDGE_TRACKER",recordId:x.id});
    const lost=x.forgottenInChapter??x.lostInChapter;
    if(Number.isInteger(lost)) history.push({chapter:lost,action:"forgotten",factId:x.factId,source:"15_KNOWLEDGE_TRACKER",recordId:x.id});
  }
  for(const c of records) if(c.number<=at) for(const x of list(c.knowledgeChanges)) if(x?.characterId===characterId&&x.factId&&(!factId||x.factId===factId)) history.push({chapter:c.number,action:x.action,factId:x.factId,method:x.method??x.how??"",source:"chapter",recordId:c.number,evidence:x.evidence??""});
  history.sort((a,b)=>a.chapter-b.chapter||(a.source==="15_KNOWLEDGE_TRACKER"?-1:1));
  const known=new Map();
  for(const x of history) { if(LEARN.has(x.action)) known.set(x.factId,x); else if(FORGET.has(x.action)) known.delete(x.factId); }
  const knownFacts=[...known.values()].sort((a,b)=>a.factId.localeCompare(b.factId));
  return {characterId,factId,targetChapter:at,knownFacts,knows:factId?known.has(factId):undefined,history};
}
export function listKnowledgeHolders({registries={},chapters:records=[],factId,chapter}={}) {
  if(!validId(factId)) throw Error("Provide a valid uppercase fact ID");
  const at=target(chapter), ids=new Set(entries(registries,"03_CHARACTER_REGISTRY").map(x=>x.id).filter(Boolean));
  for(const x of entries(registries,"15_KNOWLEDGE_TRACKER")) if(x?.factId===factId&&x.characterId) ids.add(x.characterId);
  for(const c of records) for(const x of list(c.knowledgeChanges)) if(x?.factId===factId&&x.characterId) ids.add(x.characterId);
  return [...ids].sort().map(characterId=>reconstructKnowledge({registries,chapters:records,characterId,chapter:at,factId})).filter(x=>x.knows).map(x=>({characterId:x.characterId,learnedBy:x.knownFacts[0]}));
}
export function getRecordHistory({registries={},chapters:records=[],registryName,recordId,chapter}={}) {
  if(!["06_DOCUMENT_AND_OBJECT_REGISTRY","09_LOCATION_REGISTRY"].includes(registryName)) throw Error("Unsupported history registry");
  if(!validId(recordId)) throw Error("Provide a valid uppercase record ID");
  const max=chapter==null?Infinity:target(chapter), object=registryName==="06_DOCUMENT_AND_OBJECT_REGISTRY";
  const base=entries(registries,registryName).find(x=>x.id===recordId)??null, history=[];
  if(base) history.push({chapter:0,action:"baseline",record:base});
  for(const c of records) if(c.number<=max) for(const x of list(c[object?"objectChanges":"locationChanges"])) if((x?.objectId??x?.locationId??x?.id)===recordId) history.push({chapter:c.number,...x});
  history.sort((a,b)=>a.chapter-b.chapter);
  return {registry:registryName,recordId,found:Boolean(base||history.length),record:base,history};
}
export function getChapterTimeline({registries={},chapters:records=[],chapter}={}) {
  const at=target(chapter), events=[];
  for(const x of entries(registries,"10_EVENT_TIMELINE")) {
    const n=x.chapter??x.chapterNumber??x.occurredInChapter;
    if(n===at||list(x.chapters).some(y=>(typeof y==="number"?y:y?.chapter)===at)) events.push({source:"10_EVENT_TIMELINE",...x});
  }
  const c=records.find(x=>x.number===at);
  for(const x of list(c?.events)) events.push({source:"chapter",...x});
  events.sort((a,b)=>String(a.occurredOn??a.date??"").localeCompare(String(b.occurredOn??b.date??""))||String(a.id??a.eventId??"").localeCompare(String(b.id??b.eventId??"")));
  return {chapter:at,inWorldDate:c?.inWorldDate??null,events};
}
const validDate=v=>typeof v==="string"&&/^\\d{4}-\\d{2}-\\d{2}$/.test(v)&&!Number.isNaN(new Date(v+"T00:00:00Z").getTime())&&new Date(v+"T00:00:00Z").toISOString().slice(0,10)===v;
export function checkKnowledgeTimeline({registries={},chapters:records=[]}={}) {
  const warnings=[], ordered=[...records].filter(x=>Number.isInteger(x?.number)).sort((a,b)=>a.number-b.number);
  const restricted=new Map();
  for(const x of entries(registries,"14_POV_WHITELIST")) { const ids=[...list(x.restrictedFactIds),...list(x.forbiddenFactIds)]; if(x.characterId&&ids.length) restricted.set(x.characterId,new Set(ids)); }
  const learned=new Map();
  for(const x of entries(registries,"15_KNOWLEDGE_TRACKER")) if(x?.characterId&&x.factId) {
    const n=x.source==="backstory"||x.learnedBeforeStory===true?0:x.learnedInChapter;
    if(Number.isInteger(n)&&n>=0) learned.set(x.characterId+"::"+x.factId,n);
  }
  for(const c of ordered) {
    for(const x of list(c.knowledgeChanges)) if(x?.characterId&&x.factId) {
      const key=x.characterId+"::"+x.factId;
      if(LEARN.has(x.action)&&(!learned.has(key)||c.number<learned.get(key))) learned.set(key,c.number);
      if(FORGET.has(x.action)) learned.delete(key);
    }
    for(const x of list(c.knowledgeUsed)) if(x?.characterId&&x.factId) {
      const n=learned.get(x.characterId+"::"+x.factId);
      if(n===undefined) warnings.push({code:"KNOWLEDGE_NOT_ESTABLISHED_BY_USE",chapter:c.number,characterId:x.characterId,factId:x.factId});
      else if(n>c.number) warnings.push({code:"KNOWLEDGE_USED_BEFORE_ACQUISITION",chapter:c.number,characterId:x.characterId,factId:x.factId,learnedInChapter:n});
      if(c.pov===x.characterId&&restricted.get(x.characterId)?.has(x.factId)) warnings.push({code:"POV_RESTRICTED_KNOWLEDGE_USED",chapter:c.number,characterId:x.characterId,factId:x.factId});
    }
  }
  const events=new Map(), remember=(x,source)=>{
    const id=x?.id??x?.eventId; if(!id)return;
    const date=x.occurredOn??x.date??x.startDate;
    if(date&&!validDate(date)) warnings.push({code:"EVENT_DATE_INVALID",eventId:id,date,source});
    if(date&&validDate(date)) {
      if(events.has(id)&&events.get(id).date!==date) warnings.push({code:"EVENT_DATE_CONFLICT",eventId:id,firstDate:events.get(id).date,conflictingDate:date,firstSource:events.get(id).source,conflictingSource:source});
      else events.set(id,{date,source,item:x});
    } else if(!events.has(id)) events.set(id,{date:null,source,item:x});
    if(x.endDate&&date&&validDate(date)&&validDate(x.endDate)&&x.endDate<date) warnings.push({code:"EVENT_END_BEFORE_START",eventId:id,startDate:date,endDate:x.endDate});
  };
  for(const x of entries(registries,"10_EVENT_TIMELINE")) remember(x,"10_EVENT_TIMELINE");
  for(const c of ordered) for(const x of list(c.events)) remember(x,"chapter "+c.number);
  for(const [id,r] of events) {
    for(const nextId of list(r.item.precedes)) { const next=events.get(nextId); if(next?.date&&r.date&&r.date>next.date) warnings.push({code:"EVENT_ORDER_CONTRADICTION",eventId:id,requiredBefore:nextId,eventDate:r.date,otherDate:next.date}); }
    for(const prevId of [r.item.afterEventId,...list(r.item.follows)].filter(Boolean)) { const prev=events.get(prevId); if(prev?.date&&r.date&&r.date<prev.date) warnings.push({code:"EVENT_ORDER_CONTRADICTION",eventId:id,requiredAfter:prevId,eventDate:r.date,otherDate:prev.date}); }
  }
  const objects=new Map(), places=new Map();
  for(const x of entries(registries,"06_DOCUMENT_AND_OBJECT_REGISTRY")) objects.set(x.id,{ownerId:x.currentOwnerId??x.ownerId??null,locationId:x.currentLocationId??x.locationId??null});
  for(const x of entries(registries,"09_LOCATION_REGISTRY")) places.set(x.id,{ownerId:x.currentOwnerId??x.ownerId??null});
  for(const c of ordered) {
    for(const x of list(c.objectChanges)) {
      const id=x?.objectId??x?.id;if(!id)continue; const s=objects.get(id)??{ownerId:null,locationId:null};
      if(x.fromOwnerId!=null&&s.ownerId!=null&&x.fromOwnerId!==s.ownerId) warnings.push({code:"OBJECT_OWNER_TRANSITION_MISMATCH",chapter:c.number,objectId:id,expectedOwnerId:s.ownerId,recordedFromOwnerId:x.fromOwnerId});
      if(x.fromLocationId!=null&&s.locationId!=null&&x.fromLocationId!==s.locationId) warnings.push({code:"OBJECT_LOCATION_TRANSITION_MISMATCH",chapter:c.number,objectId:id,expectedLocationId:s.locationId,recordedFromLocationId:x.fromLocationId});
      if(x.toOwnerId!==undefined)s.ownerId=x.toOwnerId;if(x.toLocationId!==undefined)s.locationId=x.toLocationId;objects.set(id,s);
    }
    for(const x of list(c.locationChanges)) {
      const id=x?.locationId??x?.id;if(!id)continue;const s=places.get(id)??{ownerId:null};
      if(x.fromOwnerId!=null&&s.ownerId!=null&&x.fromOwnerId!==s.ownerId) warnings.push({code:"LOCATION_OWNER_TRANSITION_MISMATCH",chapter:c.number,locationId:id,expectedOwnerId:s.ownerId,recordedFromOwnerId:x.fromOwnerId});
      if(x.toOwnerId!==undefined)s.ownerId=x.toOwnerId;places.set(id,s);
    }
  }
  return warnings;
}
export async function getKnowledgeState(characterId,chapter,factId=null) { const x=await load(); return reconstructKnowledge({registries:x.registries,chapters:x.records,characterId,chapter,factId}); }
export async function getKnowledgeHolders(factId,chapter) { const x=await load(); return listKnowledgeHolders({registries:x.registries,chapters:x.records,factId,chapter}); }
export async function getRecordHistoryFromDisk(registryName,recordId,chapter) { const x=await load(); return getRecordHistory({registries:x.registries,chapters:x.records,registryName,recordId,chapter}); }
export async function getChapterTimelineFromDisk(chapter) { const x=await load(); return getChapterTimeline({registries:x.registries,chapters:x.records,chapter}); }
