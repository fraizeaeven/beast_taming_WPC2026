import test from "node:test";
import assert from "node:assert/strict";
import { checkRelationshipPsychology, getRelationshipPsychologyReport } from "../src/relationship-psychology.js";

const registries = {
  "03_CHARACTER_REGISTRY": { entries: [{ id: "CHAR_A" }, { id: "CHAR_B" }] },
  "04_RELATIONSHIP_REGISTRY": { entries: [{ id: "REL_A_B", from: "CHAR_A", to: "CHAR_B", initialState: "guarded", currentState: "strained" }] }
};
const first = {
  id: "RELBEAT_001", relationshipId: "REL_A_B", initiatorCharacterId: "CHAR_A", responderCharacterId: "CHAR_B",
  trigger: "B refuses to leave the dangerous room", initiatorIntent: "Keep B safe", initiatorFearOrNeed: "Fear of losing B",
  initiatorBehaviour: "Orders B to stay behind", responderInterpretation: "B thinks A does not trust their judgement",
  interpretationAccuracy: "misread", interpretationGapEvidence: "A privately admits the order came from fear, not distrust",
  responderResponse: "B withdraws and stops sharing information", defensiveStrategy: "protective_control",
  trustImpact: "damaged", trustEvidence: "B refuses to tell A about the next meeting",
  relationshipShift: "B becomes more guarded", relationshipShiftEvidence: "B conceals the meeting plan",
  powerDynamic: "A controls access to the exit", powerEvidence: "A physically blocks the doorway",
  boundaryCrossed: true, boundaryImpact: "B's autonomy is overridden",
  repairAttempt: false, observableEvidence: "A blocks the doorway; B leaves without answering"
};
const second = {
  ...first, id: "RELBEAT_002", trigger: "B tries to leave again", initiatorBehaviour: "A repeats the order",
  responderResponse: "B refuses to speak", trustEvidence: "B stops answering A's calls"
};

test("accepts a fully evidenced two-sided relationship interaction", () => {
  const result = checkRelationshipPsychology({ registries, chapters: [{ number: 1, relationshipPsychologyChecks: [first] }] });
  assert.deepEqual(result, { errors: [], warnings: [] });
});

test("flags missing motive, interpretation, response and evidence", () => {
  const result = checkRelationshipPsychology({ registries, chapters: [{ number: 1, relationshipPsychologyChecks: [{
    id: "RELBEAT_003", relationshipId: "REL_A_B", initiatorCharacterId: "CHAR_A", responderCharacterId: "CHAR_B"
  }] }] });
  const codes = result.warnings.map(item => item.code);
  assert.ok(codes.includes("RELATIONSHIP_PSYCHOLOGY_TRIGGER_MISSING"));
  assert.ok(codes.includes("RELATIONSHIP_PSYCHOLOGY_INITIATOR_MOTIVE_MISSING"));
  assert.ok(codes.includes("RELATIONSHIP_PSYCHOLOGY_RESPONDER_INTERPRETATION_MISSING"));
  assert.ok(codes.includes("RELATIONSHIP_PSYCHOLOGY_RESPONDER_RESPONSE_MISSING"));
  assert.ok(codes.includes("RELATIONSHIP_PSYCHOLOGY_EVIDENCE_MISSING"));
});

test("rejects unknown relationship IDs and participants outside the relationship", () => {
  const result = checkRelationshipPsychology({ registries, chapters: [{ number: 1, relationshipPsychologyChecks: [
    { ...first, relationshipId: "REL_UNKNOWN" },
    { ...first, id: "RELBEAT_004", responderCharacterId: "CHAR_C" }
  ] }] });
  const codes = result.errors.map(item => item.code);
  assert.ok(codes.includes("RELATIONSHIP_PSYCHOLOGY_RELATIONSHIP_MISSING"));
  assert.ok(codes.includes("RELATIONSHIP_PSYCHOLOGY_CHARACTER_MISSING"));
  assert.ok(codes.includes("RELATIONSHIP_PSYCHOLOGY_PARTICIPANTS_MISMATCH"));
});

test("requires evidence for misreading, trust, power, repair and boundary effects", () => {
  const result = checkRelationshipPsychology({ registries, chapters: [{ number: 1, relationshipPsychologyChecks: [{
    ...first, id: "RELBEAT_005", interpretationGapEvidence: "", trustEvidence: "", powerEvidence: "",
    repairAttempt: true, repairOutcome: "", repairEvidence: "", boundaryImpact: ""
  }] }] });
  const codes = result.warnings.map(item => item.code);
  assert.ok(codes.includes("RELATIONSHIP_MISINTERPRETATION_UNSUPPORTED"));
  assert.ok(codes.includes("RELATIONSHIP_TRUST_IMPACT_UNSUPPORTED"));
  assert.ok(codes.includes("RELATIONSHIP_POWER_DYNAMIC_UNSUPPORTED"));
  assert.ok(codes.includes("RELATIONSHIP_REPAIR_OUTCOME_UNRECORDED"));
  assert.ok(codes.includes("RELATIONSHIP_BOUNDARY_IMPACT_UNRECORDED"));
});

test("detects a repeated defensive strategy explicitly marked as damaging trust", () => {
  const result = checkRelationshipPsychology({ registries, chapters: [
    { number: 1, relationshipPsychologyChecks: [first] },
    { number: 2, relationshipPsychologyChecks: [second] }
  ] });
  assert.ok(result.warnings.some(item => item.code === "RELATIONSHIP_DEFENSIVE_PATTERN_REPEATED_DESPITE_TRUST_COST"));
});

test("validates relationship change source and produces relationship-filtered report", () => {
  const chapters = [
    { number: 1, relationshipPsychologyChecks: [first] },
    { number: 2, relationshipChanges: [{ relationshipId: "REL_A_B", fromState: "guarded", toState: "strained", reason: "Trust is damaged", sourceInteractionId: "RELBEAT_UNKNOWN" }] }
  ];
  const result = checkRelationshipPsychology({ registries, chapters });
  assert.ok(result.warnings.some(item => item.code === "RELATIONSHIP_CHANGE_SOURCE_INTERACTION_INVALID"));
  const report = getRelationshipPsychologyReport({ registries, chapters, relationshipId: "REL_A_B" });
  assert.equal(report.relationshipReports[0].interactions.length, 1);
  assert.equal(report.relationshipReports[0].participants[0], "CHAR_A");
});
