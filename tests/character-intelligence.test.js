import test from "node:test";
import assert from "node:assert/strict";
import {checkCharacterIntelligence,getCharacterIntelligenceReport} from "../src/character-intelligence.js";
const registries={
 "03_CHARACTER_REGISTRY":{entries:[{id:"CHAR_A",name:"A"}]},
 "17_STORY_STRUCTURE_REGISTRY":{entries:[
  {id:"PLOT_SETUP",type:"main_plot",startChapter:8,milestones:[{id:"MILESTONE_TRUTH",chapter:8}]},
  {id:"ARC_A",type:"character_arc",startChapter:3,dependencies:["PLOT_SETUP"],milestones:[{id:"MILESTONE_CHANGE",chapter:5,dependsOn:["MILESTONE_TRUTH"]}]}
 ]},
 "18_CHARACTER_STATE_HISTORY":{entries:[
  {id:"STATE_A_1",characterId:"CHAR_A",chapter:1,activeGoal:"Protect family",motivation:"Fear of betrayal",arcStage:2,relationshipStates:[{relationshipId:"REL_A_B",state:"trusting"}]},
  {id:"STATE_A_5",characterId:"CHAR_A",chapter:5,activeGoal:"Leave family",motivation:"Self-preservation",arcStage:5,truthRecognized:"My refusal hurts them",relationshipStates:[{relationshipId:"REL_A_B",state:"broken"}]}
 ]}
};
test("flags unexplained goal, motivation and relationship changes",()=>{
 const codes=checkCharacterIntelligence({registries,chapters:[]}).warnings.map(x=>x.code);
 assert.ok(codes.includes("CHARACTER_GOAL_SHIFT_UNEXPLAINED"));
 assert.ok(codes.includes("CHARACTER_MOTIVATION_SHIFT_UNEXPLAINED"));
 assert.ok(codes.includes("RELATIONSHIP_STATE_CHANGE_UNEXPLAINED"));
});
test("checks consequential choices and scheduled consequence follow-through",()=>{
 const codes=checkCharacterIntelligence({registries,chapters:[{number:2,psychologyChecks:[{id:"PSY_A_002",characterId:"CHAR_A",deliberateChoice:"Refuses help",consequenceTracking:{expectedByChapter:4}}]}]}).warnings.map(x=>x.code);
 assert.ok(codes.includes("CHARACTER_CHOICE_CONSEQUENCE_UNRECORDED"));
 assert.ok(codes.includes("CHARACTER_CONSEQUENCE_FOLLOW_THROUGH_MISSING"));
});
test("flags an explicitly marked goal conflict without rationale",()=>{
 const r=checkCharacterIntelligence({registries,chapters:[{number:2,psychologyChecks:[{id:"PSY_A_002",characterId:"CHAR_A",goalAlignment:"conflicts"}]}]});
 assert.ok(r.warnings.some(x=>x.code==="CHARACTER_MOTIVATION_CONFLICT_UNEXPLAINED"));
});
test("requires bridge evidence for multi-stage jumps and support for transformation",()=>{
 const r=checkCharacterIntelligence({registries:{"03_CHARACTER_REGISTRY":{entries:[{id:"CHAR_A"}]},"18_CHARACTER_STATE_HISTORY":{entries:[
  {id:"STATE_A_1",characterId:"CHAR_A",chapter:1,arcStage:2},
  {id:"STATE_A_8",characterId:"CHAR_A",chapter:8,arcStage:7,stageEvidence:"Accepts the truth"}
 ]}},chapters:[]});
 const codes=r.warnings.map(x=>x.code);
 assert.ok(codes.includes("CHARACTER_ARC_STAGE_JUMP_UNSUPPORTED"));
 assert.ok(codes.includes("CHARACTER_TRANSFORMATION_SUPPORT_INCOMPLETE"));
});
test("checks story-unit and milestone prerequisite ordering",()=>{
 const codes=checkCharacterIntelligence({registries,chapters:[]}).warnings.map(x=>x.code);
 assert.ok(codes.includes("STORY_MILESTONE_DEPENDENCY_ORDER_CONFLICT"));
 assert.ok(codes.includes("STORY_DEPENDENCY_STARTS_BEFORE_SETUP"));
});
test("report supports character filtering and retains story findings in full report",()=>{
 const full=getCharacterIntelligenceReport({registries,chapters:[]});
 assert.equal(full.characterReports[0].characterId,"CHAR_A");
 assert.ok(full.counts.storyDependencies>0);
 const filtered=getCharacterIntelligenceReport({registries,chapters:[],characterId:"CHAR_A"});
 assert.ok(filtered.findings.every(x=>x.characterId==="CHAR_A"));
});
test("documented goal and relationship changes are not warned",()=>{
 const data=structuredClone(registries),state=data["18_CHARACTER_STATE_HISTORY"].entries[1];
 state.goalChangeReason="The family rejects the alliance";
 state.motivationChangeReason="He fears losing them more than betrayal";
 state.stageEvidence="He recognises the harm caused by refusal";
 state.relationshipStates[0].reason="He concealed the warning and abandoned her";
 const codes=checkCharacterIntelligence({registries:data,chapters:[]}).warnings.map(x=>x.code);
 assert.ok(!codes.includes("CHARACTER_GOAL_SHIFT_UNEXPLAINED"));
 assert.ok(!codes.includes("CHARACTER_MOTIVATION_SHIFT_UNEXPLAINED"));
 assert.ok(!codes.includes("RELATIONSHIP_STATE_CHANGE_UNEXPLAINED"));
});
