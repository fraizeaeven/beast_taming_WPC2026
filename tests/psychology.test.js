import test from "node:test";
import assert from "node:assert/strict";
import {checkPsychology} from "../src/psychology.js";

const registries={"03_CHARACTER_REGISTRY":{entries:[{id:"CHAR_A"}]}};
const beat={id:"PSY_A_001",characterId:"CHAR_A",sceneId:"SCENE_01",trigger:"A threat",automaticReaction:"Steps between danger and sibling",thought:"I cannot lose them",emotion:"Fear",physicalSensation:"Chest tightens",expressedEmotion:"Cold anger",underlyingNeed:"Safety",misbelief:"Only I can protect them",deliberateChoice:"Refuses help",consequence:"Acts alone",observableEvidence:"He moves before answering",interpretation:"Fear is masked as anger",arcStage:3,stageEvidence:"He sees the cost but rejects support"};

test("complete evidenced psychology beat passes without warnings",()=>{
  const result=checkPsychology({registries,chapters:[{number:1,psychologyChecks:[beat]}]});
  assert.deepEqual(result,{errors:[],warnings:[]});
});

test("missing psychological layers produce specific warnings",()=>{
  const result=checkPsychology({registries,chapters:[{number:1,psychologyChecks:[{id:"PSY_A_002",characterId:"CHAR_A"}]}]});
  assert.ok(result.warnings.some(x=>x.code==="PSYCHOLOGY_BEAT_INCOMPLETE"));
  assert.ok(result.warnings.some(x=>x.code==="PSYCHOLOGY_OBSERVABLE_EVIDENCE_MISSING"));
});

test("invalid arc stage and unknown character are structural errors",()=>{
  const result=checkPsychology({registries,chapters:[{number:1,psychologyChecks:[{...beat,characterId:"CHAR_UNKNOWN",arcStage:8}]}]});
  assert.ok(result.errors.some(x=>x.code==="PSYCHOLOGY_CHARACTER_MISSING"));
  assert.ok(result.errors.some(x=>x.code==="PSYCHOLOGY_ARC_STAGE_INVALID"));
});
