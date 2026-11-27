import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {stageDraftReview,decideDraftProposal,showDraftReview} from "../src/draft-workflow.js";

async function fixture(t) {
  const root=await fs.mkdtemp(path.join(os.tmpdir(),"beast-draft-review-"));
  const old=process.cwd(); process.chdir(root);
  t.after(async()=>{process.chdir(old);await fs.rm(root,{recursive:true,force:true});});
  await fs.mkdir("DRAFT_REVIEWS",{recursive:true});
  await fs.mkdir("CHAPTER_RECORDS",{recursive:true});
  await fs.mkdir("CHAPTERS",{recursive:true});
  await fs.writeFile("CHAPTER_RECORDS/03_CHARACTER_REGISTRY",JSON.stringify({registry:"03_CHARACTER_REGISTRY",entries:[{id:"CHAR_A",name:"A"}]}));
  await fs.writeFile("CHAPTERS/CHAPTER_0002.json",JSON.stringify({number:2,summary:"old summary",knowledgeChanges:[]}));
  return root;
}

test("staging AI analysis creates a review without changing canon",async t=>{
  await fixture(t);
  await fs.writeFile("analysis.json",JSON.stringify({chapterNumber:2,summary:"Review",findings:[{message:"Possible inconsistency",severity:"high",confidence:0.9}],proposals:[{id:"PROP_ADD",type:"add_chapter_item",chapter:2,field:"knowledgeChanges",value:{characterId:"CHAR_A",factId:"FACT_SECRET",action:"learned"},reason:"Explicit revelation",evidence:"I told you the truth."}]}));
  const staged=await stageDraftReview("analysis.json");
  const chapter=JSON.parse(await fs.readFile("CHAPTERS/CHAPTER_0002.json","utf8"));
  assert.equal(chapter.knowledgeChanges.length,0);
  assert.equal(staged.proposals[0].status,"pending");
  assert.equal((await showDraftReview(staged.id)).findings.length,1);
});

test("approval applies one proposal and records its decision",async t=>{
  await fixture(t);
  await fs.writeFile("analysis.json",JSON.stringify({chapterNumber:2,findings:[],proposals:[{id:"PROP_ADD",type:"add_chapter_item",chapter:2,field:"knowledgeChanges",value:{characterId:"CHAR_A",factId:"FACT_SECRET",action:"learned"}}]}));
  const staged=await stageDraftReview("analysis.json");
  await decideDraftProposal(staged.id,"PROP_ADD","approve");
  const chapter=JSON.parse(await fs.readFile("CHAPTERS/CHAPTER_0002.json","utf8"));
  assert.equal(chapter.knowledgeChanges.length,1);
  assert.equal((await showDraftReview(staged.id)).proposals[0].status,"approved");
});

test("stale registry proposal is rejected without overwriting newer canon",async t=>{
  await fixture(t);
  await fs.writeFile("analysis.json",JSON.stringify({chapterNumber:2,findings:[],proposals:[{id:"PROP_UPDATE",type:"update_registry_entry",registry:"03_CHARACTER_REGISTRY",recordId:"CHAR_A",expected:{id:"CHAR_A",name:"A"},value:{id:"CHAR_A",name:"Proposed"}}]}));
  const staged=await stageDraftReview("analysis.json");
  await fs.writeFile("CHAPTER_RECORDS/03_CHARACTER_REGISTRY",JSON.stringify({registry:"03_CHARACTER_REGISTRY",entries:[{id:"CHAR_A",name:"Changed elsewhere"}]}));
  await assert.rejects(()=>decideDraftProposal(staged.id,"PROP_UPDATE","approve"),/changed since analysis/);
  const registry=JSON.parse(await fs.readFile("CHAPTER_RECORDS/03_CHARACTER_REGISTRY","utf8"));
  assert.equal(registry.entries[0].name,"Changed elsewhere");
});

test("chapter append approval refuses a changed chapter baseline",async t=>{
  await fixture(t);
  await fs.writeFile("analysis.json",JSON.stringify({chapterNumber:2,findings:[],proposals:[{id:"PROP_APPEND",type:"add_chapter_item",chapter:2,field:"knowledgeChanges",value:{characterId:"CHAR_A",factId:"FACT_A",action:"learned"}}]}));
  const staged=await stageDraftReview("analysis.json");
  const chapter=JSON.parse(await fs.readFile("CHAPTERS/CHAPTER_0002.json","utf8"));
  chapter.knowledgeChanges.push({characterId:"CHAR_A",factId:"FACT_B",action:"learned"});
  await fs.writeFile("CHAPTERS/CHAPTER_0002.json",JSON.stringify(chapter));
  await assert.rejects(()=>decideDraftProposal(staged.id,"PROP_APPEND","approve"),/changed since proposal staging/);
});

test("duplicate proposal IDs are rejected during staging",async t=>{
  await fixture(t);
  await fs.writeFile("analysis.json",JSON.stringify({chapterNumber:2,findings:[],proposals:[
    {id:"PROP_DUP",type:"add_chapter_item",chapter:2,field:"knowledgeChanges",value:{a:1}},
    {id:"PROP_DUP",type:"add_chapter_item",chapter:2,field:"knowledgeChanges",value:{a:2}}
  ]}));
  await assert.rejects(()=>stageDraftReview("analysis.json"),/Duplicate proposal ID/);
});

test("approved AI proposal can append an evidenced psychology beat",async t=>{
  await fixture(t);
  const beat={id:"PSY_A_002",characterId:"CHAR_A",sceneId:"SCENE_02",trigger:"A warning",automaticReaction:"Steps back",thought:"I am not ready",emotion:"Fear",physicalSensation:"Pulse races",expressedEmotion:"Silence",observableEvidence:"He steps back and says nothing",interpretation:"He masks fear with withdrawal",arcStage:2,stageEvidence:"He recognises the fear but refuses to face it"};
  await fs.writeFile("analysis.json",JSON.stringify({chapterNumber:2,findings:[],proposals:[{id:"PROP_PSY",type:"add_chapter_item",chapter:2,field:"psychologyChecks",value:beat}]}));
  const staged=await stageDraftReview("analysis.json");
  await decideDraftProposal(staged.id,"PROP_PSY","approve");
  const chapter=JSON.parse(await fs.readFile("CHAPTERS/CHAPTER_0002.json","utf8"));
  assert.equal(chapter.psychologyChecks[0].id,"PSY_A_002");
});

test("approved AI proposal can append a scene construction record",async t=>{
  await fixture(t);
  const scene={id:"SCNBUILD_A_001",sceneId:"SCENE_02",order:1,sceneGoal:"Escape",opposition:"The gate is locked",conflict:"They argue over the route",stakes:"Capture",escalationSteps:["Alarm sounds"],turningPoint:"A guard opens the gate",emotionalShift:"Fear becomes resolve",outcome:"They escape",hookOrExit:"A second alarm",tensionStart:2,tensionPeak:7,tensionEnd:4,pacingMode:"reversal",plotProgress:"The escape reveals the traitor",evidence:"They run through the gate"};
  await fs.writeFile("analysis.json",JSON.stringify({chapterNumber:2,findings:[],proposals:[{id:"PROP_SCENE",type:"add_chapter_item",chapter:2,field:"sceneConstructionChecks",value:scene}]}));
  const staged=await stageDraftReview("analysis.json");
  await decideDraftProposal(staged.id,"PROP_SCENE","approve");
  const chapter=JSON.parse(await fs.readFile("CHAPTERS/CHAPTER_0002.json","utf8"));
  assert.equal(chapter.sceneConstructionChecks[0].id,"SCNBUILD_A_001");
});

test("approved AI proposal can append a relationship psychology interaction",async t=>{
  await fixture(t);
  const interaction={id:"RELBEAT_A_001",relationshipId:"REL_A_B",initiatorCharacterId:"CHAR_A",responderCharacterId:"CHAR_B",trigger:"A refuses to answer",initiatorIntent:"Avoid conflict",initiatorBehaviour:"Changes the subject",responderInterpretation:"B thinks A does not trust them",responderResponse:"B withdraws",observableEvidence:"B leaves the room"};
  await fs.writeFile("analysis.json",JSON.stringify({chapterNumber:2,findings:[],proposals:[{id:"PROP_REL",type:"add_chapter_item",chapter:2,field:"relationshipPsychologyChecks",value:interaction}]}));
  const staged=await stageDraftReview("analysis.json");
  await decideDraftProposal(staged.id,"PROP_REL","approve");
  const chapter=JSON.parse(await fs.readFile("CHAPTERS/CHAPTER_0002.json","utf8"));
  assert.equal(chapter.relationshipPsychologyChecks[0].id,"RELBEAT_A_001");
});

test("approved AI proposal can append an emotional scene interpretation",async t=>{
  await fixture(t);
  const annotation={id:"SCNVIEW_A_002",sceneId:"SCENE_02",objectiveEvent:"A orders B to stay",objectiveEvidence:"A says to stay",perspectives:[{characterId:"CHAR_A",interpretation:"B agrees",interpretationEvidence:"B falls silent"}],readerKnowledge:{knownFacts:["SECRET_PLAN"],readerOnlyFacts:["SECRET_PLAN"],evidence:"Narration reveals the plan"}};
  await fs.writeFile("analysis.json",JSON.stringify({chapterNumber:2,findings:[],proposals:[{id:"PROP_VIEW",type:"add_chapter_item",chapter:2,field:"sceneInterpretationChecks",value:annotation}]}));
  const staged=await stageDraftReview("analysis.json");
  await decideDraftProposal(staged.id,"PROP_VIEW","approve");
  const chapter=JSON.parse(await fs.readFile("CHAPTERS/CHAPTER_0002.json","utf8"));
  assert.equal(chapter.sceneInterpretationChecks[0].id,"SCNVIEW_A_002");
});

test("approved AI proposal can append a consequence chain record",async t=>{
  await fixture(t);
  const consequence={id:"CONSEQ_A_002",order:1,source:{kind:"decision",recordId:"PSY_A_001",chapter:1},causedByConsequenceId:"",initiatingCharacterId:"CHAR_A",affectedCharacterId:"CHAR_B",description:"B withdraws after the lie",responseBehaviour:"B stops asking for help",resultingDecision:"B handles the crisis alone",impactDomains:["trust","behaviour"],evidence:"B refuses A's offer",causalEvidence:"B explicitly says the earlier lie is why they no longer trust A",followUp:{expectedByChapter:4,status:"pending",observedAtChapter:null,evidence:""},stateCarryForward:{required:false}};
  await fs.writeFile("analysis.json",JSON.stringify({chapterNumber:2,findings:[],proposals:[{id:"PROP_CONSEQ",type:"add_chapter_item",chapter:2,field:"consequenceChecks",value:consequence}]}));
  const staged=await stageDraftReview("analysis.json");
  await decideDraftProposal(staged.id,"PROP_CONSEQ","approve");
  const chapter=JSON.parse(await fs.readFile("CHAPTERS/CHAPTER_0002.json","utf8"));
  assert.equal(chapter.consequenceChecks[0].id,"CONSEQ_A_002");
});
