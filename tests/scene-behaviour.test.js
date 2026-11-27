import test from "node:test";
import assert from "node:assert/strict";
import {checkSceneBehaviour} from "../src/scene-behaviour.js";

const registries={"03_CHARACTER_REGISTRY":{entries:[{id:"CHAR_A"},{id:"CHAR_B"}]}};
const beat={id:"SCNBEH_A_001",sceneId:"SCENE_01",actorId:"CHAR_A",targetCharacterId:"CHAR_B",action:"Blocks the doorway",dialogueBehaviour:"Changes the subject",bodyLanguage:"Arms crossed",avoidance:"Refuses to explain the injury",observerId:"CHAR_B",observerObservation:"Sees the doorway blocked",observerInterpretation:"Thinks he is being shut out",relationshipImpact:"Trust decreases",relationshipEvidence:"She withdraws her offer",sceneOutcome:"They leave without resolving the argument",causalLink:"The deflection prevents an honest exchange",observableEvidence:"He blocks the doorway and changes the subject",arcEffect:"Repeats his controlling protection pattern",arcEvidence:"He refuses help again"};

test("complete scene behaviour beat passes without warnings",()=>{
  assert.deepEqual(checkSceneBehaviour({registries,chapters:[{number:1,sceneBehaviourChecks:[beat]}]}),{errors:[],warnings:[]});
});

test("missing observation, causal and evidence layers are reported",()=>{
  const result=checkSceneBehaviour({registries,chapters:[{number:1,sceneBehaviourChecks:[{id:"SCNBEH_A_002",actorId:"CHAR_A",observerId:"CHAR_B"}]}]});
  assert.ok(result.warnings.some(x=>x.code==="SCENE_BEHAVIOUR_INCOMPLETE"));
  assert.ok(result.warnings.some(x=>x.code==="SCENE_BEHAVIOUR_OBSERVATION_MISSING"));
  assert.ok(result.warnings.some(x=>x.code==="SCENE_BEHAVIOUR_CAUSAL_LINK_MISSING"));
});

test("unknown scene character references are structural errors",()=>{
  const result=checkSceneBehaviour({registries,chapters:[{number:1,sceneBehaviourChecks:[{...beat,observerId:"CHAR_UNKNOWN"}]}]});
  assert.ok(result.errors.some(x=>x.code==="SCENE_BEHAVIOUR_CHARACTER_MISSING"));
});
