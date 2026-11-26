import test from "node:test";
import assert from "node:assert/strict";
import {checkContinuity} from "../src/continuity.js";

const base = () => ({
  registries: {
    "03_CHARACTER_REGISTRY": {entries:[{id:"CHAR_A",birthDate:"2000-06-15"}]},
    "04_RELATIONSHIP_REGISTRY": {entries:[{id:"REL_A_B",from:"CHAR_A",to:"CHAR_B",initialState:"distant",currentState:"hostile"}]},
    "10_EVENT_TIMELINE": {entries:[{id:"EVT_A",occurredOn:"2026-01-02"}]},
    "13_PROMISE_AND_PAYOFF_REGISTER": {entries:[{id:"PROM_A",madeInChapter:2,notBeforeChapter:5,dueByChapter:6,status:"open"}]},
    "15_KNOWLEDGE_TRACKER": {entries:[{id:"KNOW_A",characterId:"CHAR_A",factId:"FACT_SECRET",learnedInChapter:4}]}
  }, chapters: []
});
const codes = input => checkContinuity(input).map(w => w.code);

test("flags an explicitly annotated personality inconsistency",()=>{
  const x=base();x.chapters=[{number:3,behaviorChecks:[{characterId:"CHAR_A",traitId:"TRAIT_PATIENCE",assessment:"inconsistent",evidence:"The scene text"}]}];
  assert.ok(codes(x).includes("PERSONALITY_INCONSISTENCY"));
});
test("flags knowledge used before its discovery",()=>{
  const x=base();x.chapters=[{number:2,knowledgeUsed:[{characterId:"CHAR_A",factId:"FACT_SECRET"}]}];
  assert.ok(codes(x).includes("KNOWLEDGE_BEFORE_DISCOVERY"));
});
test("flags a recorded age that conflicts with the in-world date",()=>{
  const x=base();x.chapters=[{number:1,inWorldDate:"2026-06-14",characterAges:[{characterId:"CHAR_A",age:26}]}];
  assert.ok(codes(x).includes("AGE_TIMELINE_MISMATCH"));
});
test("flags a relationship transition without a reason and stale registry state",()=>{
  const x=base();x.chapters=[{number:1,relationshipChanges:[{relationshipId:"REL_A_B",fromState:"distant",toState:"close"}]}];
  const found=codes(x);assert.ok(found.includes("RELATIONSHIP_CHANGE_WITHOUT_CAUSE"));assert.ok(found.includes("RELATIONSHIP_REGISTRY_STALE"));
});
test("flags a promise fulfilled before its allowed payoff chapter",()=>{
  const x=base();x.chapters=[{number:3,promises:[{promiseId:"PROM_A",action:"fulfilled"}]}];
  assert.ok(codes(x).includes("PROMISE_FULFILLED_PREMATURELY"));
});
test("flags an event date that contradicts its timeline entry",()=>{
  const x=base();x.chapters=[{number:3,events:[{eventId:"EVT_A",occurredOn:"2026-01-03"}]}];
  assert.ok(codes(x).includes("EVENT_CONTRADICTION"));
});
test("does not flag a consistent set of records",()=>{
  const x=base();x.registries["04_RELATIONSHIP_REGISTRY"].entries[0].currentState="close";x.chapters=[{number:4,inWorldDate:"2026-06-15",characterAges:[{characterId:"CHAR_A",age:26}],knowledgeUsed:[{characterId:"CHAR_A",factId:"FACT_SECRET"}],relationshipChanges:[{relationshipId:"REL_A_B",fromState:"distant",toState:"close",reason:"Shared danger"}],events:[{eventId:"EVT_A",occurredOn:"2026-01-02"}]}];
  assert.deepEqual(codes(x),[]);
});
