import test from "node:test";
import assert from "node:assert/strict";
import { checkCharacterTransformation, getCharacterTransformationReport } from "../src/character-transformation.js";

const registries = {
  "03_CHARACTER_REGISTRY": { entries: [{ id: "CHAR_A", name: "A" }, { id: "CHAR_B", name: "B" }] },
  "18_CHARACTER_STATE_HISTORY": { entries: [] }
};

const repeatTests = [
  { number: 2, transformationChecks: [{
    id: "TRANS_A_002", characterId: "CHAR_A", triggerKey: "TRIGGER_REJECTION",
    triggerDescription: "A trusted ally rejects his request", pressure: "He risks losing the alliance",
    priorPattern: { behaviour: "He threatens and withdraws", misbelief: "Rejection proves he is powerless", evidence: "Earlier scene PSY_A_001" },
    currentResponse: { behaviour: "He listens and asks what boundary was crossed", deliberateChoice: "Does not retaliate", appliedTruth: "Rejection is not proof of betrayal", evidence: "He lowers his weapon and listens" },
    appliedTruth: true, outcome: "different_response",
    choiceCost: { sacrifice: "He gives up immediate control", evidence: "He lets the ally leave without coercion" },
    witnesses: [{ characterId: "CHAR_B", observation: "A does not threaten", response: "B cautiously stays", evidence: "B remains in the room" }],
    arcStage: 6, stageEvidence: "He attempts a different response"
  }] },
  { number: 5, transformationChecks: [{
    id: "TRANS_A_005", characterId: "CHAR_A", triggerKey: "TRIGGER_REJECTION", priorCheckId: "TRANS_A_002",
    triggerDescription: "The ally refuses again", pressure: "The alliance is now collapsing",
    priorPattern: { behaviour: "He used to threaten and withdraw", evidence: "TRANS_A_002" },
    currentResponse: { behaviour: "He states his need without coercion", deliberateChoice: "Accepts the ally's decision", appliedTruth: "A boundary is not betrayal", evidence: "He leaves the decision with the ally" },
    appliedTruth: true, outcome: "different_response",
    choiceCost: { cost: "He loses the immediate alliance", evidence: "The ally leaves, and A does not stop them" },
    sustainedPattern: { evidence: "The same non-coercive response occurs again under greater pressure" },
    witnesses: [{ characterId: "CHAR_B", observation: "A does not pursue or threaten", response: "B begins to trust his restraint", evidence: "B later approaches voluntarily" }],
    arcStage: 7, stageEvidence: "He accepts the truth and acts on it"
  }] }
];

test("recognises repeated, evidence-backed behavioural change across chapters", () => {
  const report = getCharacterTransformationReport({ registries, chapters: repeatTests, characterId: "CHAR_A" });
  assert.equal(report.characterReports[0].triggerPatterns[0].sustainedAcrossChapters, true);
  assert.equal(report.findings.length, 0);
});

test("does not treat a claim or apology as transformation without behaviour", () => {
  const result = checkCharacterTransformation({ registries, chapters: [{ number: 3, transformationChecks: [{
    id: "TRANS_WORDS_003", characterId: "CHAR_A", triggerKey: "TRIGGER_REJECTION",
    claimOfChange: "I am different now", outcome: "not_tested"
  }] }] });
  assert.ok(result.warnings.some(x => x.code === "TRANSFORMATION_CLAIM_WITHOUT_BEHAVIOURAL_PROOF"));
  assert.ok(result.warnings.some(x => x.code === "TRANSFORMATION_PRIOR_PATTERN_UNSUPPORTED"));
});

test("flags a repeated old response and a change that has not yet been sustained", () => {
  const result = checkCharacterTransformation({ registries, chapters: [{ number: 1, transformationChecks: [{
    id: "TRANS_REPEAT_001", characterId: "CHAR_A", triggerKey: "TRIGGER_REJECTION",
    priorPattern: { behaviour: "Threatens", evidence: "Earlier scene" },
    currentResponse: { behaviour: "Threatens again", evidence: "He raises his weapon" },
    outcome: "old_pattern_repeated"
  }, {
    id: "TRANS_CHANGE_001", characterId: "CHAR_A", triggerKey: "TRIGGER_REJECTION",
    priorPattern: { behaviour: "Threatens", evidence: "Earlier scene" },
    currentResponse: { behaviour: "Listens", deliberateChoice: "Does not threaten", evidence: "He listens" },
    outcome: "different_response", choiceCost: { cost: "Loses leverage", evidence: "The ally leaves" }
  }] }] });
  const codes = result.warnings.map(x => x.code);
  assert.ok(codes.includes("TRANSFORMATION_OLD_PATTERN_REPEATED"));
  assert.ok(codes.includes("TRANSFORMATION_CHANGE_NOT_YET_SUSTAINED"));
});

test("tracks setbacks without treating regression as invalid", () => {
  const result = checkCharacterTransformation({ registries, chapters: [{ number: 4, transformationChecks: [{
    id: "TRANS_SETBACK_004", characterId: "CHAR_A", triggerKey: "TRIGGER_REJECTION",
    priorPattern: { behaviour: "Threatens", evidence: "Earlier scene" },
    currentResponse: { behaviour: "Threatens", evidence: "He shouts and blocks the exit" },
    setback: { oldMisbeliefReturned: true, evidence: "He interprets refusal as betrayal" },
    outcome: "mixed"
  }] }] });
  assert.equal(result.errors.length, 0);
  assert.ok(result.warnings.some(x => x.code === "TRANSFORMATION_CHANGE_NOT_YET_SUSTAINED") === false);
});

test("requires sustained behavioural evidence before accepting stage seven", () => {
  const data = structuredClone(registries);
  data["18_CHARACTER_STATE_HISTORY"].entries.push({ id: "STATE_A_007", characterId: "CHAR_A", chapter: 7, arcStage: 7 });
  const result = checkCharacterTransformation({ registries: data, chapters: repeatTests.slice(0, 1) });
  assert.ok(result.warnings.some(x => x.code === "TRANSFORMATION_STAGE_SEVEN_NOT_SUSTAINED"));
});

test("rejects invalid character, witness and prior-check references", () => {
  const result = checkCharacterTransformation({ registries, chapters: [{ number: 3, transformationChecks: [{
    id: "TRANS_BAD_003", characterId: "CHAR_MISSING", triggerKey: "TRIGGER_X",
    priorCheckId: "TRANS_MISSING_001", witnesses: [{ characterId: "CHAR_GHOST" }]
  }] }] });
  const codes = result.errors.map(x => x.code);
  assert.ok(codes.includes("TRANSFORMATION_CHARACTER_UNKNOWN"));
});
