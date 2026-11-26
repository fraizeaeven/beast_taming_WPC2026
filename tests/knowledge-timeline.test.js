import test from "node:test";
import assert from "node:assert/strict";
import {reconstructKnowledge,listKnowledgeHolders,getRecordHistory,getChapterTimeline,checkKnowledgeTimeline} from "../src/knowledge-timeline.js";
const registries=()=>({
  "03_CHARACTER_REGISTRY":{entries:[{id:"CHAR_A"},{id:"CHAR_B"}]},
  "15_KNOWLEDGE_TRACKER":{entries:[{id:"KNOW_A",characterId:"CHAR_A",factId:"FACT_SECRET",learnedInChapter:2,method:"witnessed"},{id:"KNOW_B",characterId:"CHAR_B",factId:"FACT_SECRET",source:"backstory"}]},
  "14_POV_WHITELIST":{entries:[{id:"POV_A",characterId:"CHAR_A",restrictedFactIds:["FACT_SECRET"]}]},
  "10_EVENT_TIMELINE":{entries:[{id:"EVT_LATER",occurredOn:"2026-05-02",chapter:4,afterEventId:"EVT_EARLIER"},{id:"EVT_EARLIER",occurredOn:"2026-05-03",chapter:2}]},
  "06_DOCUMENT_AND_OBJECT_REGISTRY":{entries:[{id:"OBJ_CORE",ownerId:"CHAR_A",locationId:"LOC_KEEP"}]},
  "09_LOCATION_REGISTRY":{entries:[{id:"LOC_KEEP",ownerId:"CHAR_A"}]}
});
test("reconstructs knowledge at a historical chapter and applies forgetting",()=>{
  const r=registries(), chapters=[{number:5,knowledgeChanges:[{characterId:"CHAR_A",factId:"FACT_SECRET",action:"forgotten"}]},{number:7,knowledgeChanges:[{characterId:"CHAR_A",factId:"FACT_SECRET",action:"remembered"}]}];
  assert.equal(reconstructKnowledge({registries:r,chapters,characterId:"CHAR_A",chapter:4,factId:"FACT_SECRET"}).knows,true);
  assert.equal(reconstructKnowledge({registries:r,chapters,characterId:"CHAR_A",chapter:6,factId:"FACT_SECRET"}).knows,false);
  assert.equal(reconstructKnowledge({registries:r,chapters,characterId:"CHAR_A",chapter:8,factId:"FACT_SECRET"}).knows,true);
});
test("lists who knows a fact at a selected chapter",()=>{
  const result=listKnowledgeHolders({registries:registries(),chapters:[],factId:"FACT_SECRET",chapter:3});
  assert.deepEqual(result.map(x=>x.characterId),["CHAR_A","CHAR_B"]);
});
test("reconstructs object transfer history",()=>{
  const result=getRecordHistory({registries:registries(),chapters:[{number:3,objectChanges:[{objectId:"OBJ_CORE",action:"stolen",fromOwnerId:"CHAR_A",toOwnerId:"CHAR_B",toLocationId:"LOC_CAVE"}]}],registryName:"06_DOCUMENT_AND_OBJECT_REGISTRY",recordId:"OBJ_CORE",chapter:3});
  assert.equal(result.history.length,2); assert.equal(result.history[1].toOwnerId,"CHAR_B");
});
test("returns chapter timeline events in date order",()=>{
  const r=registries();r["10_EVENT_TIMELINE"]={entries:[{id:"EVT_B",chapter:2,occurredOn:"2026-05-02"},{id:"EVT_A",chapter:2,occurredOn:"2026-05-01"}]};
  const result=getChapterTimeline({registries:r,chapters:[],chapter:2});
  assert.deepEqual(result.events.map(x=>x.id),["EVT_A","EVT_B"]);
});
test("flags POV knowledge, event ordering and ownership continuity violations",()=>{
  const warnings=checkKnowledgeTimeline({registries:registries(),chapters:[
    {number:2,pov:"CHAR_A",knowledgeUsed:[{characterId:"CHAR_A",factId:"FACT_SECRET"}]},
    {number:3,objectChanges:[{objectId:"OBJ_CORE",fromOwnerId:"CHAR_B",toOwnerId:"CHAR_C"}]}
  ]});
  const codes=warnings.map(x=>x.code);
  assert.ok(codes.includes("POV_RESTRICTED_KNOWLEDGE_USED")); assert.ok(codes.includes("EVENT_ORDER_CONTRADICTION")); assert.ok(codes.includes("OBJECT_OWNER_TRANSITION_MISMATCH"));
});
