import test from "node:test";
import assert from "node:assert/strict";
import { checkDecisionIntelligence, getDecisionIntelligenceReport } from "../src/decision-intelligence.js";

const registries = {
  "03_CHARACTER_REGISTRY": { entries: [{ id: "CHAR_A", name: "A" }] },
  "18_CHARACTER_STATE_HISTORY": { entries: [] }
};
const earlier = {
  id: "PSY_A_001", characterId: "CHAR_A", trigger: "A threat",
  automaticReaction: "Steps between danger and his sister", thought: "I must protect her",
  emotion: "Fear", physicalSensation: "Chest tightens", expressedEmotion: "Cold anger",
  interpretation: "He reads the threat as proof that only he can protect her",
  beliefActivated: "If I rely on others, someone will get hurt",
  deliberateChoice: "Refuses help", decisionRationale: "His old belief overrides the evidence",
  choicePattern: "protective_control", consequence: "His sister stops trusting him",
  observableEvidence: "He blocks her from leaving", misbeliefEffect: "reinforced",
  misbeliefEffectEvidence: "He interprets her anger as proof she needs stricter protection",
  arcEffect: "Deepens his isolation", arcEffectEvidence: "He ends the scene alone"
};
const later = {
  id: "PSY_A_002", characterId: "CHAR_A", trigger: "His sister disappears",
  automaticReaction: "Calls everyone repeatedly", interpretation: "He assumes she was taken",
  deliberateChoice: "Goes alone", decisionRationale: "He believes involving others risks her safety",
  priorExperienceBeatId: "PSY_A_001", choicePattern: "protective_control",
  consequence: "He loses the only witness", consequenceTrend: "worsening", strategyReview: "He begins questioning whether control is helping",
  responseMismatch: true, responseMismatchReason: "He performs anger to conceal panic",
  misbeliefEffect: "challenged", misbeliefEffectEvidence: "The solo search makes the danger worse",
  arcEffect: "Begins questioning control", arcEffectEvidence: "He admits his choice increased the risk"
};

test("complete decision chain with a valid prior experience is accepted", () => {
  const result = checkDecisionIntelligence({ registries, chapters: [
    { number: 1, psychologyChecks: [earlier] },
    { number: 2, psychologyChecks: [later] }
  ] });
  assert.deepEqual(result, { errors: [], warnings: [] });
});

test("flags missing interpretation, rationale and unsupported arc or misbelief effects", () => {
  const result = checkDecisionIntelligence({ registries, chapters: [
    { number: 1, psychologyChecks: [{
      id: "PSY_A_003", characterId: "CHAR_A", deliberateChoice: "Leaves",
      misbeliefEffect: "challenged", arcEffect: "Transforms"
    }] }
  ] });
  const codes = result.warnings.map(item => item.code);
  assert.ok(codes.includes("DECISION_INTERPRETATION_OR_BELIEF_MISSING"));
  assert.ok(codes.includes("DECISION_RATIONALE_MISSING"));
  assert.ok(codes.includes("DECISION_MISBELIEF_EFFECT_UNSUPPORTED"));
  assert.ok(codes.includes("DECISION_ARC_EFFECT_UNSUPPORTED"));
});

test("checks prior experience references and unexplained deliberate mismatches", () => {
  const result = checkDecisionIntelligence({ registries, chapters: [
    { number: 2, psychologyChecks: [{
      id: "PSY_A_004", characterId: "CHAR_A", deliberateChoice: "Acts alone",
      priorExperienceBeatId: "PSY_UNKNOWN", responseMismatch: true
    }] }
  ] });
  const codes = result.warnings.map(item => item.code);
  assert.ok(codes.includes("DECISION_PRIOR_EXPERIENCE_REFERENCE_INVALID"));
  assert.ok(codes.includes("DECISION_RESPONSE_MISMATCH_UNEXPLAINED"));
});

test("flags repeated strategy when the author marks its consequences as worsening", () => {
  const first = { ...earlier, consequenceTrend: "worsening" };
  const second = { ...later, consequenceTrend: "worsening", strategyReview: "" };
  const result = checkDecisionIntelligence({ registries, chapters: [
    { number: 1, psychologyChecks: [first] },
    { number: 2, psychologyChecks: [second] }
  ] });
  assert.ok(result.warnings.some(item => item.code === "DECISION_PATTERN_REPEATED_DESPITE_WORSENING_COST"));
});

test("checks whether a consequence is carried into the next character state", () => {
  const data = structuredClone(registries);
  const beat = { ...earlier, consequenceTracking: { recordedInChapter: 2, requireStateUpdate: true } };
  const result = checkDecisionIntelligence({ registries: data, chapters: [
    { number: 1, psychologyChecks: [beat] },
    { number: 2, psychologyChecks: [] }
  ] });
  assert.ok(result.warnings.some(item => item.code === "DECISION_CONSEQUENCE_NOT_CARRIED_INTO_CHARACTER_STATE"));
  data["18_CHARACTER_STATE_HISTORY"].entries.push({
    id: "STATE_A_2", characterId: "CHAR_A", chapter: 2, consequenceReferences: ["PSY_A_001"]
  });
  assert.ok(!checkDecisionIntelligence({ registries: data, chapters: [
    { number: 1, psychologyChecks: [beat] }
  ] }).warnings.some(item => item.code === "DECISION_CONSEQUENCE_NOT_CARRIED_INTO_CHARACTER_STATE"));
});

test("decision report filters characters and exposes the annotated causal chain", () => {
  const report = getDecisionIntelligenceReport({ registries, chapters: [
    { number: 1, psychologyChecks: [earlier] },
    { number: 2, psychologyChecks: [later] }
  ], characterId: "CHAR_A" });
  assert.equal(report.characterReports[0].decisions.length, 2);
  assert.equal(report.characterReports[0].decisions[1].priorExperienceBeatId, "PSY_A_001");
});
