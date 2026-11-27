import fs from "node:fs/promises";
import path from "node:path";
import { REGISTRIES } from "./constants.js";
import { file, exists, read, write } from "./io.js";
import { buildChapterContext, formatChapterContext } from "./context.js";

const safeId = value => typeof value === "string" && /^[A-Z][A-Z0-9_-]{1,63}$/.test(value);
const chapterPath = n => file("CHAPTERS", "CHAPTER_" + String(n).padStart(4, "0") + ".json");
const proposalPath = id => file("DRAFT_REVIEWS", id + ".json");
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const allowedChapterFields = new Set(["summary","scenes","charactersPresent","characterAges","behaviorChecks","psychologyChecks","sceneBehaviourChecks","sceneConstructionChecks","relationshipPsychologyChecks","sceneInterpretationChecks","knowledgeUsed","knowledgeChanges","relationshipChanges","storyLinks","locations","locationChanges","events","canonChanges","mysteryChanges","objectChanges","financialAndLegalChanges","promises","openLoops","continuityNotes","authorNotes"]);
const arrayChapterFields = new Set(["scenes","sceneConstructionChecks","charactersPresent","characterAges","behaviorChecks","psychologyChecks","sceneBehaviourChecks","relationshipPsychologyChecks","sceneInterpretationChecks","knowledgeUsed","knowledgeChanges","relationshipChanges","storyLinks","locations","locationChanges","events","canonChanges","mysteryChanges","objectChanges","financialAndLegalChanges","promises","openLoops","continuityNotes"]);

export async function prepareDraftReview(chapterNumber, draftFile) {
  const n = Number(chapterNumber);
  if (!Number.isInteger(n) || n < 1) throw Error("Provide a positive chapter number");
  if (!draftFile?.trim()) throw Error("Provide a path to the chapter draft");
  const draftPath = path.resolve(process.cwd(), draftFile);
  const draft = await fs.readFile(draftPath, "utf8");
  const context = await buildChapterContext(n);
  const prompt = [
    "# AI chapter analysis request",
    "",
    "Analyse the supplied draft against the recorded context. Treat the draft as proposed narrative, not canon.",
    "Do not invent facts to fill gaps. Separate direct textual evidence, canon evidence, inference and uncertainty.",
    "Review: character behaviour/personality; emotional and physical reactions; seven-stage arc progression; knowledge timing and secrets; POV boundaries; relationship state; event/date chronology; plot/subplot/arc progression; mysteries, promises and open loops. Check clue/setup/reveal chapter order, repeated or premature payoffs, unresolved threads, explicit canon assertions sharing a fact ID, and exact-ID downstream dependencies. Treat all findings as advisory; never invent a clue or silently resolve a thread.",
    "For every important character beat, analyse the causal chain in sequence: trigger; automatic/unconscious reaction before deliberation; the character's interpretation of what is happening; belief or misbelief activated; immediate thought; named emotion(s); physical sensation/body response; outwardly expressed emotion (including masking or mismatch); underlying need/fear; deliberate choice and its rationale; consequence; whether the experience reinforces or challenges the misbelief; and the resulting effect on the character arc. Where useful, connect the decision to a specific earlier psychology beat using priorExperienceBeatId. Identify repeated choicePattern strategies and whether their consequences are explicitly worsening. Distinguish an action that fits the character's established personality from an action that is wise or morally right. Keep observable draft evidence separate from interpretation. Do not invent an inner thought or bodily sensation absent from text; mark it as an inference or an author question.",
    "For every scene, analyse its immediate goal, opposition, conflict, stakes, escalation beats, turning point/reversal, emotional shift, outcome and exit hook. Estimate tension at entry, peak and exit on a 1–10 scale as an author judgement, not an objective score. Explain how the scene advances plot, character arc, relationship, revelation or a consequential decision. Quiet/breather/transition scenes are valid when their deliberate purpose is stated; do not force every scene to escalate. Review scene-sequence tension variation, release, repetition, abrupt jumps and cumulative emotional fatigue; do not prescribe a rigid rising curve.\n    For every consequential scene interaction, also track the actor's concrete action, dialogue behaviour, body language, deliberate avoidance, target, what an observer can actually see/hear, the observer's interpretation (which may be mistaken), relationship impact, scene outcome and causal evidence. Separate observable behaviour from observer interpretation; do not claim an observer knows private thoughts. For every consequential relationship interaction, track the initiator's intent/fear/need and observable behaviour; the responder's interpretation, emotional/behavioural response and whether the interpretation is accurate, partial or mistaken; trust impact; power dynamic; attachment/defensive pattern when explicitly supported; boundary impact; repair attempt and outcome; relationship shift; and evidence. Analyse the feedback loop: how the responder's reaction changes the initiator's next behaviour. Never assume an apology repairs trust, that forgiveness is owed, or that a power imbalance is harmless.",
    "For each consequential scene, distinguish the objective event from each character's observed facts and interpretation. Record conflicting interpretations and evidence for the gap; distinguish what each character knows from what the reader knows; record who holds concealed information, why it is withheld, resulting behaviour, later belief updates and the evidence that changes a belief. Record reader knowledge only when the draft explicitly gives it to the reader. Never leak reader-only facts into a character's thoughts, actions or knowledge. A reveal should point to earlier setup scenes or explicitly recorded concealment; do not manufacture foreshadowing retrospectively.",
    "Check motivation consistency using explicit goalAlignment, decisionRationale and conflictEvidence; do not infer goal conflict from free text alone. Track consequential choices and consequenceTracking follow-through. Compare snapshots for goal/motivation shifts, relationship-state changes and seven-stage transitions; require transitionEvidence for multi-stage jumps and truth/decision/consequence support for stage 7. Check story milestone dependsOn IDs and chapter order, allowing deliberate overlap and reversals. Evaluate the seven-stage arc only from the character's actual response and stage evidence: 1 denial; 2 recognises but refuses; 3 sees suffering but doubts change; 4 considers change; 5 recognises harm to self/others; 6 attempts change; 7 accepts truth and transforms. Stalling, partial change, setback and regression are valid; do not force progression. Distinguish emotional intensity from arc-stage advancement.",
    "For every finding include severity (critical/high/medium/low), confidence (0-1), category, concise explanation, draftEvidence (short exact quote), canonEvidence (record IDs/fields), and recommendedAction.",
    "Only propose structured changes when the draft explicitly establishes them. Never claim a suggestion is already canon.",
    "Return ONLY valid JSON matching this shape:",
    JSON.stringify({schemaVersion:1,chapterNumber:n,draftFile:path.basename(draftPath),summary:"",findings:[{id:"FINDING_001",severity:"medium",confidence:0.8,category:"character|psychology|motivation|consequence|relationship|arc|story_dependency|scene_behaviour|scene_construction|pacing|emotion|knowledge|pov|timeline|plot|mystery|promise|other",message:"",draftEvidence:"",canonEvidence:["CHAR_ID"],recommendedAction:"",psychologyAnalysis:{characterId:"CHAR_ID",sceneId:"SCENE_01",trigger:"",automaticReaction:"",interpretation:"",beliefActivated:"",thought:"",emotion:"",physicalSensation:"",expressedEmotion:"",underlyingNeed:"",misbelief:"",deliberateChoice:"",decisionRationale:"",choicePattern:"",decisionAlignment:"aligned|conflicts|unclear",conflictEvidence:"",priorExperienceBeatId:"PSY_PREVIOUS_001",consequence:"",consequenceTrend:"stable|worsening|improving",strategyReview:"",attemptedAlternative:"",misbeliefEffect:"reinforced|challenged|unchanged",misbeliefEffectEvidence:"",arcEffect:"",arcEffectEvidence:"",responseMismatch:false,responseMismatchReason:"",activeGoal:"",motivation:"",goalAlignment:"aligned|conflicts|unclear",consequenceTracking:{expectedByChapter:null,recordedInChapter:null,evidence:"",requireStateUpdate:false},observableEvidence:"",arcStage:3,stageEvidence:""},sceneConstructionAnalysis:{id:"SCNBUILD_001",sceneId:"SCENE_01",order:1,povCharacterId:"CHAR_KAEL",involvedCharacterIds:["CHAR_KAEL","CHAR_LINA"],sceneGoal:"",opposition:"",conflict:"",stakes:"",escalationSteps:[],turningPoint:"",reversal:"",emotionalShift:"",outcome:"",hookOrExit:"",tensionStart:2,tensionPeak:7,tensionEnd:4,pacingMode:"escalation|breather|transition|reversal|climax|aftermath",plotProgress:"",characterArcProgress:"",relationshipProgress:"",revelationProgress:"",decisionProgress:"",purposeRationale:"",evidence:""},sceneBehaviourAnalysis:{id:"SCNBEH_KAEL_001",sceneId:"SCENE_01",actorId:"CHAR_KAEL",targetCharacterId:"CHAR_LINA",action:"",dialogueBehaviour:"",bodyLanguage:"",avoidance:"",observerId:"CHAR_LINA",observerObservation:"",observerInterpretation:"",relationshipImpact:"",relationshipEvidence:"",sceneOutcome:"",causalLink:"",arcEffect:"",arcEvidence:"",observableEvidence:"",interpretation:""},sceneInterpretationAnalysis:{id:"SCNVIEW_001",sceneId:"SCENE_01",order:1,objectiveEvent:"",objectiveEvidence:"",perspectiveGapEvidence:"",perspectives:[{characterId:"CHAR_A",observedFacts:"",interpretation:"",interpretationAccuracy:"accurate|partial|misread|unknown",interpretationEvidence:"",misreadEvidence:"",beliefActivated:"",emotion:"",expressedEmotion:"",resultingBehaviour:"",behaviourEvidence:"",knowledgeIds:[],knowledgeEvidence:""}],concealedInformation:[{informationId:"SECRET_001",holderCharacterId:"CHAR_A",description:"",concealmentReason:"",evidence:""}],readerKnowledge:{knownFacts:[],evidence:""},beliefUpdates:[{characterId:"CHAR_A",priorInterpretation:"",newInterpretation:"",newEvidence:""}],reveals:[{informationId:"SECRET_001",setupSceneIds:["SCENE_01"],revealEvidence:""}]},relationshipPsychologyAnalysis:{id:"RELBEAT_001",relationshipId:"REL_KAEL_LINA",initiatorCharacterId:"CHAR_KAEL",responderCharacterId:"CHAR_LINA",trigger:"",initiatorIntent:"",initiatorFearOrNeed:"",initiatorBehaviour:"",responderInterpretation:"",interpretationAccuracy:"accurate|partial|misread|unknown",interpretationGapEvidence:"",responderResponse:"",initiatorNextBehaviour:"",defensiveStrategy:"",strategyReview:"",attemptedAlternative:"",trustImpact:"strengthened|improved|unchanged|strained|damaged|mixed",trustEvidence:"",powerDynamic:"",powerEvidence:"",dependencyDynamic:"",dependencyEvidence:"",attachmentPattern:"",boundaryCrossed:false,boundaryImpact:"",repairAttempt:false,repairOutcome:"",repairEvidence:"",relationshipShift:"",relationshipShiftEvidence:"",observableEvidence:""}}],proposals:[{id:"PROP_001",type:"add_registry_entry|update_registry_entry|add_chapter_item|update_chapter_field",registry:"03_CHARACTER_REGISTRY",recordId:"CHAR_ID",chapter:n,field:"sceneConstructionChecks",expected:null,value:{},reason:"",evidence:""}]},null,2),
    "",
    "## Recorded chapter context",
    formatChapterContext(context),
    "",
    "## Draft manuscript",
    draft
  ].join("\n");
  await fs.mkdir(file("reports"), {recursive:true});
  const output = file("reports", "CHAPTER_" + String(n).padStart(4,"0") + "_AI_REVIEW_PROMPT.md");
  await fs.writeFile(output, prompt + "\n");
  return {chapterNumber:n,draftFile:draftPath,promptFile:output,charactersInContext:context.selection.characterIds.length,storyUnitsInContext:context.selection.storyIds.length};
}

export async function stageDraftReview(inputFile) {
  const raw = JSON.parse(await fs.readFile(path.resolve(process.cwd(), inputFile), "utf8"));
  const n = Number(raw.chapterNumber);
  if (!Number.isInteger(n) || n < 1) throw Error("Analysis must include a positive chapterNumber");
  if (!Array.isArray(raw.findings) || !Array.isArray(raw.proposals)) throw Error("Analysis must include findings[] and proposals[]");
  const id = "REVIEW_CH" + String(n).padStart(4,"0") + "_" + Date.now().toString(36).toUpperCase();
  const findings = raw.findings.map((f,i) => ({
    id: safeId(f.id) ? f.id : "FINDING_" + String(i+1).padStart(3,"0"),
    severity: ["critical","high","medium","low"].includes(f.severity) ? f.severity : "medium",
    confidence: Number.isFinite(f.confidence) ? Math.max(0,Math.min(1,f.confidence)) : null,
    category: String(f.category ?? "other"), message: String(f.message ?? ""),
    draftEvidence: String(f.draftEvidence ?? ""), canonEvidence: Array.isArray(f.canonEvidence) ? f.canonEvidence : [],
    recommendedAction: String(f.recommendedAction ?? "")
  }));
  const proposals = [];
  for (let i=0;i<raw.proposals.length;i++) {
    const p=raw.proposals[i], proposal={
      id: safeId(p.id) ? p.id : "PROP_" + String(i+1).padStart(3,"0"),
      type:p.type,registry:p.registry,recordId:p.recordId,chapter:p.chapter??n,
      field:p.field,expected:p.expected,value:p.value,reason:String(p.reason??""),
      evidence:String(p.evidence??""),status:"pending",decision:null
    };
    if (proposal.type==="add_chapter_item") {
      const chapterNo=Number(proposal.chapter), target=chapterPath(chapterNo);
      if(!Number.isInteger(chapterNo)||chapterNo<1||!(await exists(target))) throw Error("Proposal targets a missing chapter");
      if(!arrayChapterFields.has(proposal.field)) throw Error("Chapter append target must be an allowlisted array field");
      if(proposal.value===undefined) throw Error("Chapter item proposal must include a value");
      const chapter=await read(target);
      proposal.expected=Array.isArray(chapter[proposal.field])?[...chapter[proposal.field]]:[];
    }
    proposals.push(proposal);
  }
  const proposalIds=new Set();
  for(const p of proposals){if(proposalIds.has(p.id))throw Error("Duplicate proposal ID: "+p.id);proposalIds.add(p.id);}
  const record = {schemaVersion:1,id,chapterNumber:n,draftFile:raw.draftFile ?? null,createdAt:new Date().toISOString(),summary:String(raw.summary ?? ""),findings,proposals};
  await fs.mkdir(file("DRAFT_REVIEWS"), {recursive:true});
  await write(proposalPath(id),record);
  return record;
}

export async function listDraftReviews() {
  const dir=file("DRAFT_REVIEWS");
  if (!(await exists(dir))) return [];
  const names=(await fs.readdir(dir)).filter(x=>/^REVIEW_.*\.json$/.test(x)).sort();
  const out=[]; for(const name of names){const r=await read(path.join(dir,name));out.push({id:r.id,chapterNumber:r.chapterNumber,createdAt:r.createdAt,summary:r.summary,pending:r.proposals.filter(p=>p.status==="pending").length,approved:r.proposals.filter(p=>p.status==="approved").length,rejected:r.proposals.filter(p=>p.status==="rejected").length});}
  return out;
}

export async function decideDraftProposal(reviewId, proposalId, decision) {
  if (!/^[A-Z0-9_-]{4,100}$/.test(reviewId ?? "") || !safeId(proposalId)) throw Error("Provide valid review and proposal IDs");
  if (!["approve","reject"].includes(decision)) throw Error("Decision must be approve or reject");
  const p=proposalPath(reviewId); if (!(await exists(p))) throw Error("Draft review not found");
  const review=await read(p), proposal=review.proposals.find(x=>x.id===proposalId);
  if (!proposal) throw Error("Proposal not found");
  if (proposal.status!=="pending") throw Error("Proposal already has a decision: "+proposal.status);
  if (decision==="approve") await applyProposal(proposal);
  proposal.status=decision==="approve"?"approved":"rejected";
  proposal.decision={at:new Date().toISOString(),action:decision};
  await write(p,review);
  return {reviewId,proposalId,status:proposal.status};
}

async function applyProposal(p) {
  if (p.type==="add_registry_entry" || p.type==="update_registry_entry") {
    if (!REGISTRIES.includes(p.registry) || !p.value || typeof p.value !== "object" || Array.isArray(p.value) || !safeId(p.value.id ?? p.recordId)) throw Error("Invalid registry target, entry payload or ID");
    const target=file("CHAPTER_RECORDS",p.registry); if (!(await exists(target))) throw Error("Registry file is missing: "+p.registry);
    const data=await read(target), entries=Array.isArray(data.entries)?data.entries:[];
    const index=entries.findIndex(x=>x.id===(p.recordId ?? p.value.id));
    if (p.type==="add_registry_entry") { if(index!==-1) throw Error("Entry already exists; refusing overwrite"); if(p.value.id!==p.recordId && p.recordId) throw Error("Entry ID mismatch"); entries.push(p.value); }
    else { if(index===-1) throw Error("Target entry not found"); if(p.expected===undefined) throw Error("Update proposal must include the exact expected entry"); if(!same(entries[index],p.expected)) throw Error("Registry entry changed since analysis; re-run review"); if(p.value.id!==entries[index].id) throw Error("Stable record ID cannot be changed"); entries[index]=p.value; }
    data.entries=entries; await write(target,data); return;
  }
  const n=Number(p.chapter), target=chapterPath(n);
  if(!Number.isInteger(n)||n<1||!(await exists(target))) throw Error("Target chapter does not exist");
  if(p.type==="add_chapter_item") {
    if(!arrayChapterFields.has(p.field)) throw Error("Chapter append target must be an allowlisted array field");
    if(p.value===undefined || !Array.isArray(p.expected)) throw Error("Chapter append proposal is missing its value or staged baseline");
    const chapter=await read(target), items=Array.isArray(chapter[p.field])?chapter[p.field]:[];
    if(!same(items,p.expected)) throw Error("Chapter field changed since proposal staging; re-stage review");
    items.push(p.value); chapter[p.field]=items; await write(target,chapter); return;
  }
  if(p.type==="update_chapter_field") {
    if(!allowedChapterFields.has(p.field)) throw Error("Chapter field is not allowlisted");
    if(p.expected===undefined || p.value===undefined) throw Error("Chapter field update must include expected and replacement values");
    const chapter=await read(target);
    if(!same(chapter[p.field],p.expected)) throw Error("Chapter field changed since analysis; re-run review");
    chapter[p.field]=p.value; await write(target,chapter); return;
  }
  throw Error("Unsupported proposal type: "+p.type);
}

export async function showDraftReview(reviewId) {
  if (!/^[A-Z0-9_-]{4,100}$/.test(reviewId ?? "")) throw Error("Invalid review ID");
  const p=proposalPath(reviewId); if(!(await exists(p))) throw Error("Draft review not found");
  return read(p);
}
