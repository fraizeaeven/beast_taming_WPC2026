import test from "node:test";
import assert from "node:assert/strict";
import {checkNarrativeConsequences,getNarrativeConsequenceReport} from "../src/narrative-consequences.js";

const registries={
 "03_CHARACTER_REGISTRY":{entries:[{id:"CHAR_A"},{id:"CHAR_B"}]},
 "04_RELATIONSHIP_REGISTRY":{entries:[{id:"REL_A_B",from:"CHAR_A",to:"CHAR_B"}]},
 "18_CHARACTER_STATE_HISTORY":{entries:[]}
};
const chapters=[
 {number:1,psychologyChecks:[{id:"PSY_A_001",characterId:"CHAR_A",deliberateChoice:"Hide the truth"}],consequenceChecks:[{
  id:"CONSEQ_A_001",order:2,source:{kind:"decision",recordId:"PSY_A_001",chapter:1},initiatingCharacterId:"CHAR_A",affectedCharacterId:"CHAR_B",
  description:"B stops sharing information",responseBehaviour:"B withdraws and stops asking for help",impactDomains:["trust","behaviour"],evidence:"B refuses the next conversation",
  relationshipImpact:{relationshipId:"REL_A_B",priorState:"open",currentState:"strained",evidence:"B refuses to speak privately"},
  followUp:{status:"pending",expectedByChapter:3}
 }]},
 {number:2,consequenceChecks:[{
  id:"CONSEQ_A_002",order:1,source:{kind:"consequence",recordId:"CONSEQ_A_001",chapter:1},causedByConsequenceId:"CONSEQ_A_001",
  initiatingCharacterId:"CHAR_B",affectedCharacterId:"CHAR_A",description:"A loses access to B's help",responseBehaviour:"A attempts to solve the problem alone",
  impactDomains:["goal","behaviour"],evidence:"A proceeds without B",causalEvidence:"A states that B no longer helps after the earlier withdrawal",followUp:{status:"observed",expectedByChapter:2,observedAtChapter:2,evidence:"A completes the task alone"}
 }]}
];

test("accepts a cross-chapter consequence chain with evidence",()=>{
 const result=checkNarrativeConsequences({registries,chapters});
 assert.deepEqual(result.errors,[]);
 assert.deepEqual(result.warnings,[]);
});

test("flags missing source, affected character and evidence",()=>{
 const result=checkNarrativeConsequences({registries,chapters:[{number:1,consequenceChecks:[{id:"CONSEQ_BAD_001",source:{kind:"decision",recordId:"PSY_MISSING",chapter:1},affectedCharacterId:"CHAR_UNKNOWN"}]}]});
 const codes=[...result.errors,...result.warnings].map(x=>x.code);
 assert.ok(codes.includes("CONSEQUENCE_SOURCE_NOT_FOUND"));
 assert.ok(codes.includes("CONSEQUENCE_AFFECTED_CHARACTER_UNKNOWN"));
 assert.ok(codes.includes("CONSEQUENCE_EVIDENCE_MISSING"));
 assert.ok(codes.includes("CONSEQUENCE_CAUSAL_LINK_EVIDENCE_MISSING"));
});

test("flags overdue follow-up and missing state carry-through",()=>{
 const data={...registries,"18_CHARACTER_STATE_HISTORY":{entries:[]}};
 const result=checkNarrativeConsequences({registries:data,chapters:[{number:4,consequenceChecks:[{
  id:"CONSEQ_DUE_001",source:{kind:"decision",recordId:"PSY_A_001",chapter:1},affectedCharacterId:"CHAR_B",description:"B changes plans",responseBehaviour:"B leaves",
  impactDomains:["goal"],evidence:"B leaves",followUp:{status:"pending",expectedByChapter:3},stateCarryForward:{required:true}
 }]}]});
 const codes=result.warnings.map(x=>x.code);
 assert.ok(codes.includes("CONSEQUENCE_FOLLOWUP_OVERDUE"));
 assert.ok(codes.includes("CONSEQUENCE_NOT_CARRIED_INTO_CHARACTER_STATE"));
});

test("rejects invalid consequence chain parent and relationship",()=>{
 const result=checkNarrativeConsequences({registries,chapters:[{number:2,consequenceChecks:[{
  id:"CONSEQ_CHAIN_001",source:{kind:"consequence",recordId:"CONSEQ_MISSING",chapter:1},causedByConsequenceId:"CONSEQ_MISSING",
  affectedCharacterId:"CHAR_A",description:"A reacts",responseBehaviour:"A retreats",impactDomains:["trust"],evidence:"A leaves",
  relationshipImpact:{relationshipId:"REL_UNKNOWN",evidence:"A refuses to speak"}
 }]}]});
 const codes=result.errors.map(x=>x.code);
 assert.ok(codes.includes("CONSEQUENCE_PARENT_NOT_FOUND_OR_NOT_EARLIER"));
 assert.ok(codes.includes("CONSEQUENCE_CHAIN_REFERENCE_INVALID"));
 assert.ok(codes.includes("CONSEQUENCE_RELATIONSHIP_UNKNOWN"));
});

test("requires evidence for source-to-effect causation",()=>{
 const result=checkNarrativeConsequences({registries,chapters:[{number:1,psychologyChecks:[{id:"PSY_A_001",characterId:"CHAR_A"}],consequenceChecks:[{
  id:"CONSEQ_CAUSAL_001",source:{kind:"decision",recordId:"PSY_A_001",chapter:1},affectedCharacterId:"CHAR_B",description:"B withdraws",
  responseBehaviour:"B stops speaking",impactDomains:["trust"],evidence:"B leaves the room"
 }]}]});
 assert.ok(result.warnings.some(x=>x.code==="CONSEQUENCE_CAUSAL_LINK_EVIDENCE_MISSING"));
});

test("reports filtered consequence chains and downstream links",()=>{
 const report=getNarrativeConsequenceReport({registries,chapters,characterId:"CHAR_B"});
 assert.equal(report.consequences.length,1);
 assert.deepEqual(report.consequences[0].downstream,["CONSEQ_A_002"]);
 assert.equal(report.counts.chainsWithDownstream,1);
});
