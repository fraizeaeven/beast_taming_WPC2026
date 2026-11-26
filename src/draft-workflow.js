import fs from "node:fs/promises";
import path from "node:path";
import { REGISTRIES } from "./constants.js";
import { file, exists, read, write } from "./io.js";
import { buildChapterContext, formatChapterContext } from "./context.js";

const safeId = value => typeof value === "string" && /^[A-Z][A-Z0-9_-]{1,63}$/.test(value);
const chapterPath = n => file("CHAPTERS", "CHAPTER_" + String(n).padStart(4, "0") + ".json");
const proposalPath = id => file("DRAFT_REVIEWS", id + ".json");
const clone = value => JSON.parse(JSON.stringify(value));
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const allowedChapterFields = new Set(["summary","scenes","charactersPresent","characterAges","behaviorChecks","knowledgeUsed","knowledgeChanges","relationshipChanges","storyLinks","locations","locationChanges","events","canonChanges","objectChanges","financialAndLegalChanges","promises","openLoops","continuityNotes","authorNotes"]);
const arrayChapterFields = new Set(["scenes","charactersPresent","characterAges","behaviorChecks","knowledgeUsed","knowledgeChanges","relationshipChanges","storyLinks","locations","locationChanges","events","canonChanges","objectChanges","financialAndLegalChanges","promises","openLoops","continuityNotes"]);

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
    "Review: character behaviour/personality; emotional and physical reactions; seven-stage arc progression; knowledge timing and secrets; POV boundaries; relationship state; event/date chronology; plot/subplot/arc progression; mysteries, promises and open loops.",
    "For every finding include severity (critical/high/medium/low), confidence (0-1), category, concise explanation, draftEvidence (short exact quote), canonEvidence (record IDs/fields), and recommendedAction.",
    "Only propose structured changes when the draft explicitly establishes them. Never claim a suggestion is already canon.",
    "Return ONLY valid JSON matching this shape:",
    JSON.stringify({schemaVersion:1,chapterNumber:n,draftFile:path.basename(draftPath),summary:"",findings:[{id:"FINDING_001",severity:"medium",confidence:0.8,category:"character|emotion|arc|knowledge|pov|relationship|timeline|plot|mystery|promise|other",message:"",draftEvidence:"",canonEvidence:["CHAR_ID"],recommendedAction:""}],proposals:[{id:"PROP_001",type:"add_registry_entry|update_registry_entry|add_chapter_item|update_chapter_field",registry:"03_CHARACTER_REGISTRY",recordId:"CHAR_ID",chapter:n,field:"knowledgeChanges",expected:null,value:{},reason:"",evidence:""}]},null,2),
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
  const proposals = raw.proposals.map((p,i) => ({
    id: safeId(p.id) ? p.id : "PROP_" + String(i+1).padStart(3,"0"),
    type: p.type, registry: p.registry, recordId: p.recordId, chapter: p.chapter ?? n,
    field: p.field, expected: p.expected, value: p.value, reason: String(p.reason ?? ""),
    evidence: String(p.evidence ?? ""), status: "pending", decision: null
  }));
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
    if(!allowedChapterFields.has(p.field)) throw Error("Chapter field is not allowlisted");
    const chapter=await read(target), items=Array.isArray(chapter[p.field])?chapter[p.field]:[];
    items.push(p.value); chapter[p.field]=items; await write(target,chapter); return;
  }
  if(p.type==="update_chapter_field") {
    if(!allowedChapterFields.has(p.field)) throw Error("Chapter field is not allowlisted");
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
