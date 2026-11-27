import test from "node:test";
import assert from "node:assert/strict";
import { checkEmotionalSceneIntelligence, getEmotionalSceneReport } from "../src/emotional-scene-intelligence.js";

const registries = { "03_CHARACTER_REGISTRY": { entries: [{ id: "CHAR_A" }, { id: "CHAR_B" }] } };
const scene = {
  id: "SCNVIEW_001", sceneId: "SCENE_01", order: 1,
  objectiveEvent: "A tells B not to leave the house",
  objectiveEvidence: "A says the exact words in dialogue",
  perspectives: [
    { characterId: "CHAR_A", observedFacts: "B goes quiet", interpretation: "B has agreed", interpretationEvidence: "B nods once", interpretationAccuracy: "misread", misreadEvidence: "B later packs a bag", resultingBehaviour: "A relaxes", behaviourEvidence: "A turns away" },
    { characterId: "CHAR_B", observedFacts: "A blocks the doorway", interpretation: "A is controlling me", interpretationEvidence: "A physically blocks the exit", resultingBehaviour: "B secretly arranges to leave", behaviourEvidence: "B messages a friend" }
  ],
  perspectiveGapEvidence: "A mistakes silence for agreement; B reads the order as control",
  concealedInformation: [{ informationId: "SECRET_EXIT_PLAN", holderCharacterId: "CHAR_B", description: "B has arranged transport", concealmentReason: "B fears A will stop them", evidence: "B sends a private message" }],
  readerKnowledge: { knownFacts: ["SECRET_EXIT_PLAN"], evidence: "The narration shows B sending the message" }
};

test("accepts evidence-backed conflicting interpretations and explicit reader knowledge", () => {
  assert.deepEqual(checkEmotionalSceneIntelligence({ registries, chapters: [{ number: 1, sceneInterpretationChecks: [scene] }] }), { errors: [], warnings: [] });
});

test("flags missing objective, interpretation and concealment evidence", () => {
  const result = checkEmotionalSceneIntelligence({ registries, chapters: [{ number: 1, sceneInterpretationChecks: [{
    id: "SCNVIEW_002", sceneId: "SCENE_02", perspectives: [{ characterId: "CHAR_A", interpretation: "B agrees" }],
    concealedInformation: [{ informationId: "SECRET_X", holderCharacterId: "CHAR_B", description: "A secret" }]
  }] }] });
  const codes = result.warnings.map(x => x.code);
  assert.ok(codes.includes("SCENE_OBJECTIVE_EVENT_MISSING"));
  assert.ok(codes.includes("SCENE_CHARACTER_INTERPRETATION_MISSING") === false);
  assert.ok(codes.includes("SCENE_INTERPRETATION_EVIDENCE_MISSING"));
  assert.ok(codes.includes("SCENE_CONCEALMENT_UNSUPPORTED"));
});

test("rejects unknown perspective and secret-holder characters", () => {
  const result = checkEmotionalSceneIntelligence({ registries, chapters: [{ number: 1, sceneInterpretationChecks: [{
    ...scene, id: "SCNVIEW_003",
    perspectives: [{ characterId: "CHAR_UNKNOWN", interpretation: "A lie" }],
    concealedInformation: [{ informationId: "SECRET_X", holderCharacterId: "CHAR_UNKNOWN", description: "Secret", evidence: "A note" }]
  }] }] });
  assert.ok(result.errors.some(x => x.code === "SCENE_PERSPECTIVE_CHARACTER_MISSING"));
  assert.ok(result.errors.some(x => x.code === "SCENE_SECRET_HOLDER_UNKNOWN"));
});

test("requires evidence for belief changes and reveal setup", () => {
  const result = checkEmotionalSceneIntelligence({ registries, chapters: [{ number: 2, sceneInterpretationChecks: [{
    ...scene, id: "SCNVIEW_004", sceneId: "SCENE_04",
    beliefUpdates: [{ characterId: "CHAR_A", priorInterpretation: "Safe", newInterpretation: "Dangerous" }],
    reveals: [{ informationId: "SECRET_UNSET", revealEvidence: "The door opens" }]
  }] }] });
  assert.ok(result.warnings.some(x => x.code === "SCENE_BELIEF_UPDATE_WITHOUT_NEW_EVIDENCE"));
  assert.ok(result.warnings.some(x => x.code === "SCENE_REVEAL_WITHOUT_RECORDED_SETUP"));
});

test("flags reader-only information copied into a character knowledge record", () => {
  const result = checkEmotionalSceneIntelligence({ registries, chapters: [{ number: 1, sceneInterpretationChecks: [{
    ...scene, id: "SCNVIEW_005",
    readerKnowledge: { knownFacts: ["SECRET_EXIT_PLAN"], readerOnlyFacts: ["SECRET_EXIT_PLAN"], evidence: "Narration reveals the plan" },
    perspectives: [{ characterId: "CHAR_A", interpretation: "B is calm", interpretationEvidence: "B says nothing", knowledgeIds: ["SECRET_EXIT_PLAN"], knowledgeEvidence: "A somehow knows" }]
  }] }] });
  assert.ok(result.warnings.some(x => x.code === "SCENE_READER_ONLY_KNOWLEDGE_LEAK"));
});

test("returns character-filtered scene history", () => {
  const report = getEmotionalSceneReport({ registries, chapters: [{ number: 1, sceneInterpretationChecks: [scene] }], characterId: "CHAR_B" });
  assert.equal(report.scenes.length, 1);
  assert.equal(report.scenes[0].sceneId, "SCENE_01");
});
