import test from "node:test";
import assert from "node:assert/strict";
import {buildChapterContext, formatChapterContext} from "../src/context.js";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

async function fixture(t) {
  const cwd = process.cwd();
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "beast-context-"));
  process.chdir(dir);
  t.after(async () => { process.chdir(cwd); await fs.rm(dir, {recursive:true,force:true}); });
  await fs.mkdir("CHAPTERS");
  await fs.mkdir("CHAPTER_RECORDS");
  const put = (p, value) => fs.writeFile(p, JSON.stringify(value, null, 2));
  await put("CHAPTERS/CHAPTER_0007.json", {
    number:7,title:"The First Fracture",status:"draft",pov:"CHAR_A",
    charactersPresent:["CHAR_A","CHAR_B"],transformationChecks:[{id:"TRANS_CTX_001",characterId:"CHAR_A",triggerKey:"TRIGGER_REJECTION",currentResponse:{behaviour:"He listens",evidence:"He lowers his voice"}}],consequenceChecks:[{id:"CONSEQ_CTX_001",source:{kind:"decision",recordId:"PSY_A_001",chapter:7},initiatingCharacterId:"CHAR_A",affectedCharacterId:"CHAR_B",description:"B withdraws",responseBehaviour:"B avoids A",impactDomains:["trust"],evidence:"B leaves",causalEvidence:"B says the lie changed the relationship"}],sceneInterpretationChecks:[{id:"SCNVIEW_007",sceneId:"SCENE_07",objectiveEvent:"A conceals a plan",perspectives:[{characterId:"CHAR_A",interpretation:"B agrees"},{characterId:"CHAR_B",interpretation:"A is controlling"}]}],relationshipPsychologyChecks:[{
      id:"RELBEAT_007",relationshipId:"REL_A_B",initiatorCharacterId:"CHAR_A",responderCharacterId:"CHAR_B",
      trigger:"A hides a truth",initiatorIntent:"Protect B",initiatorBehaviour:"Lies",responderInterpretation:"B thinks A distrusts them",
      responderResponse:"B withdraws",observableEvidence:"B leaves the room"
    }]
  });
  await put("CHAPTERS/CHAPTER_0008.json", {
    number:8,title:"The Price of Trust",status:"planned",pov:"CHAR_A",
    charactersPresent:["CHAR_A","CHAR_B"],storyLinks:[{storyId:"ARC_A",role:"complication"}],
    locations:["LOC_KEEP"],summary:"A test chapter",scenes:[]
  });
  const names = ["00_MEMORY_INDEX","01_CANON_REGISTRY","02_WORLD_STATE","03_CHARACTER_REGISTRY","04_RELATIONSHIP_REGISTRY","05_MISBELIEF_AND_ARC_TRACKER","06_DOCUMENT_AND_OBJECT_REGISTRY","07_FINANCIAL_AND_LEGAL_LEDGER","09_LOCATION_REGISTRY","10_EVENT_TIMELINE","11_MYSTERY_REGISTER","12_OPEN_LOOP_REGISTER","13_PROMISE_AND_PAYOFF_REGISTER","14_POV_WHITELIST","15_KNOWLEDGE_TRACKER","16_CONTINUITY_LEDGER","17_STORY_STRUCTURE_REGISTRY"];
  for (const name of names) await put("CHAPTER_RECORDS/"+name,{registry:name,entries:[]});
  await put("CHAPTER_RECORDS/01_CANON_REGISTRY",{registry:"01_CANON_REGISTRY",entries:[{id:"FACT_GLOBAL",status:"confirmed",fact:"World rule"},{id:"FACT_PRIVATE",characterId:"CHAR_Z",fact:"Not relevant"}]});
  await put("CHAPTER_RECORDS/03_CHARACTER_REGISTRY",{registry:"03_CHARACTER_REGISTRY",entries:[{id:"CHAR_A",name:"A"},{id:"CHAR_B",name:"B"},{id:"CHAR_Z",name:"Z"}]});
  await put("CHAPTER_RECORDS/04_RELATIONSHIP_REGISTRY",{registry:"04_RELATIONSHIP_REGISTRY",entries:[{id:"REL_A_B",from:"CHAR_A",to:"CHAR_B",currentState:"strained"},{id:"REL_Z_A",from:"CHAR_Z",to:"CHAR_A"}]});
  await put("CHAPTER_RECORDS/09_LOCATION_REGISTRY",{registry:"09_LOCATION_REGISTRY",entries:[{id:"LOC_KEEP",name:"The Keep"},{id:"LOC_OTHER",name:"Other place"}]});
  await put("CHAPTER_RECORDS/11_MYSTERY_REGISTER",{registry:"11_MYSTERY_REGISTER",entries:[{id:"MYS_A",characterId:"CHAR_A",status:"open",notBeforeChapter:14},{id:"MYS_Z",characterId:"CHAR_Z",status:"open"}]});
  await put("CHAPTER_RECORDS/17_STORY_STRUCTURE_REGISTRY",{registry:"17_STORY_STRUCTURE_REGISTRY",entries:[
    {id:"PLOT_MAIN",type:"main_plot",status:"active",parentId:null,characterIds:["CHAR_A"],chapters:[{chapter:2}],milestones:[]},
    {id:"ARC_A",type:"character_arc",status:"active",parentId:"PLOT_MAIN",characterIds:["CHAR_A"],chapters:[{chapter:8}],dependencies:[],milestones:[{id:"MILESTONE_NEXT",chapter:12,status:"planned"}]},
    {id:"SUBPLOT_Z",type:"subplot",status:"active",parentId:"PLOT_MAIN",characterIds:["CHAR_Z"],chapters:[],milestones:[]}
  ]});
  return dir;
}

test("retrieves chapter-linked characters, story ancestors, related relationships and open mysteries",async t=>{
  await fixture(t);
  const context=await buildChapterContext(8);
  assert.deepEqual(context.selection.characterIds.sort(),["CHAR_A","CHAR_B"]);
  assert.deepEqual(context.selection.storyIds.sort(),["ARC_A","PLOT_MAIN"]);
  assert.ok(context.records["03_CHARACTER_REGISTRY"].some(x=>x.id==="CHAR_A"));
  assert.ok(context.records["04_RELATIONSHIP_REGISTRY"].some(x=>x.id==="REL_A_B"));
  assert.equal(context.relationshipPsychologyHistory.length,1);
  assert.equal(context.relationshipPsychologyHistory[0].id,"RELBEAT_007");
  assert.equal(context.sceneInterpretationHistory.length,1);
  assert.equal(context.sceneInterpretationHistory[0].id,"SCNVIEW_007");
  assert.equal(context.consequenceHistory.length,1);
  assert.equal(context.consequenceHistory[0].id,"CONSEQ_CTX_001");
  assert.equal(context.transformationHistory.length,1);
  assert.equal(context.transformationHistory[0].id,"TRANS_CTX_001");
  assert.ok(context.records["09_LOCATION_REGISTRY"].some(x=>x.id==="LOC_KEEP"));
  assert.ok(context.records["11_MYSTERY_REGISTER"].some(x=>x.id==="MYS_A"));
  assert.ok(!context.records["11_MYSTERY_REGISTER"].some(x=>x.id==="MYS_Z"));
  assert.ok(context.constraintsAndUnresolved.some(x=>x.constraint==="future_milestone"&&x.chapter===12));
  assert.ok(context.constraintsAndUnresolved.some(x=>x.constraint==="not_before_chapter"&&x.chapter===14));
});
test("formats a readable, explicit-context writing brief",async t=>{
  await fixture(t);
  const brief=formatChapterContext(await buildChapterContext(8));
  assert.match(brief,/Chapter 8 — Writing Context/);
  assert.match(brief,/Do not treat missing information as permission to invent canon/);
  assert.match(brief,/17_STORY_STRUCTURE_REGISTRY/);
  assert.match(brief,/Relationship psychology history/);
  assert.match(brief,/Earlier scene interpretations and dramatic irony/);
  assert.match(brief,/Historical consequence chains/);
  assert.match(brief,/Character transformation and repeat-trigger history/);
});
test("rejects invalid or missing chapter numbers",async t=>{
  await fixture(t);
  await assert.rejects(()=>buildChapterContext(0),/positive chapter number/);
  await assert.rejects(()=>buildChapterContext(9),/Chapter not found/);
});
