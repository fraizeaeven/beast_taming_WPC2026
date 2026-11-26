import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {stageDraftReview,decideDraftProposal,showDraftReview} from "../src/draft-workflow.js";

async function fixture(t) {
  const root=await fs.mkdtemp(path.join(os.tmpdir(),"beast-draft-review-"));
  const old=process.cwd(); process.chdir(root);
  t.after(async()=>{process.chdir(old);await fs.rm(root,{recursive:true,force:true});});
  await fs.mkdir("DRAFT_REVIEWS",{recursive:true});
  await fs.mkdir("CHAPTER_RECORDS",{recursive:true});
  await fs.mkdir("CHAPTERS",{recursive:true});
  await fs.writeFile("CHAPTER_RECORDS/03_CHARACTER_REGISTRY",JSON.stringify({registry:"03_CHARACTER_REGISTRY",entries:[{id:"CHAR_A",name:"A"}]}));
  await fs.writeFile("CHAPTERS/CHAPTER_0002.json",JSON.stringify({number:2,summary:"old summary",knowledgeChanges:[]}));
  return root;
}

test("staging AI analysis creates a review without changing canon",async t=>{
  await fixture(t);
  await fs.writeFile("analysis.json",JSON.stringify({chapterNumber:2,summary:"Review",findings:[{message:"Possible inconsistency",severity:"high",confidence:0.9}],proposals:[{id:"PROP_ADD",type:"add_chapter_item",chapter:2,field:"knowledgeChanges",value:{characterId:"CHAR_A",factId:"FACT_SECRET",action:"learned"},reason:"Explicit revelation",evidence:"I told you the truth."}]}));
  const staged=await stageDraftReview("analysis.json");
  const chapter=JSON.parse(await fs.readFile("CHAPTERS/CHAPTER_0002.json","utf8"));
  assert.equal(chapter.knowledgeChanges.length,0);
  assert.equal(staged.proposals[0].status,"pending");
  assert.equal((await showDraftReview(staged.id)).findings.length,1);
});

test("approval applies one proposal and records its decision",async t=>{
  await fixture(t);
  await fs.writeFile("analysis.json",JSON.stringify({chapterNumber:2,findings:[],proposals:[{id:"PROP_ADD",type:"add_chapter_item",chapter:2,field:"knowledgeChanges",value:{characterId:"CHAR_A",factId:"FACT_SECRET",action:"learned"}}]}));
  const staged=await stageDraftReview("analysis.json");
  await decideDraftProposal(staged.id,"PROP_ADD","approve");
  const chapter=JSON.parse(await fs.readFile("CHAPTERS/CHAPTER_0002.json","utf8"));
  assert.equal(chapter.knowledgeChanges.length,1);
  assert.equal((await showDraftReview(staged.id)).proposals[0].status,"approved");
});

test("stale registry proposal is rejected without overwriting newer canon",async t=>{
  await fixture(t);
  await fs.writeFile("analysis.json",JSON.stringify({chapterNumber:2,findings:[],proposals:[{id:"PROP_UPDATE",type:"update_registry_entry",registry:"03_CHARACTER_REGISTRY",recordId:"CHAR_A",expected:{id:"CHAR_A",name:"A"},value:{id:"CHAR_A",name:"Proposed"}}]}));
  const staged=await stageDraftReview("analysis.json");
  await fs.writeFile("CHAPTER_RECORDS/03_CHARACTER_REGISTRY",JSON.stringify({registry:"03_CHARACTER_REGISTRY",entries:[{id:"CHAR_A",name:"Changed elsewhere"}]}));
  await assert.rejects(()=>decideDraftProposal(staged.id,"PROP_UPDATE","approve"),/changed since analysis/);
  const registry=JSON.parse(await fs.readFile("CHAPTER_RECORDS/03_CHARACTER_REGISTRY","utf8"));
  assert.equal(registry.entries[0].name,"Changed elsewhere");
});

test("chapter append approval refuses a changed chapter baseline",async t=>{
  await fixture(t);
  await fs.writeFile("analysis.json",JSON.stringify({chapterNumber:2,findings:[],proposals:[{id:"PROP_APPEND",type:"add_chapter_item",chapter:2,field:"knowledgeChanges",value:{characterId:"CHAR_A",factId:"FACT_A",action:"learned"}}]}));
  const staged=await stageDraftReview("analysis.json");
  const chapter=JSON.parse(await fs.readFile("CHAPTERS/CHAPTER_0002.json","utf8"));
  chapter.knowledgeChanges.push({characterId:"CHAR_A",factId:"FACT_B",action:"learned"});
  await fs.writeFile("CHAPTERS/CHAPTER_0002.json",JSON.stringify(chapter));
  await assert.rejects(()=>decideDraftProposal(staged.id,"PROP_APPEND","approve"),/changed since proposal staging/);
});

test("duplicate proposal IDs are rejected during staging",async t=>{
  await fixture(t);
  await fs.writeFile("analysis.json",JSON.stringify({chapterNumber:2,findings:[],proposals:[
    {id:"PROP_DUP",type:"add_chapter_item",chapter:2,field:"knowledgeChanges",value:{a:1}},
    {id:"PROP_DUP",type:"add_chapter_item",chapter:2,field:"knowledgeChanges",value:{a:2}}
  ]}));
  await assert.rejects(()=>stageDraftReview("analysis.json"),/Duplicate proposal ID/);
});
