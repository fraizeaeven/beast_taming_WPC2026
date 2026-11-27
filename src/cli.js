#!/usr/bin/env node
import {init,file,write} from "./io.js";
import {validate} from "./validate.js";
import {create,show} from "./chapter.js";
import {createStoryItem,listStoryItems,showStoryItem} from "./story-structure.js";
import {buildChapterContext,formatChapterContext} from "./context.js";
import {getCharacterState,listCharacterHistory} from "./character-state.js";
import {getKnowledgeState,getKnowledgeHolders,getRecordHistoryFromDisk,getChapterTimelineFromDisk} from "./knowledge-timeline.js";
import {prepareDraftReview,stageDraftReview,listDraftReviews,showDraftReview,decideDraftProposal} from "./draft-workflow.js";
import {getPsychologyByChapter,getCharacterPsychologyHistory} from "./psychology.js";
import {getSceneBehaviourByChapter,getCharacterSceneBehaviourHistory} from "./scene-behaviour.js";
const [cmd="help",...a]=process.argv.slice(2);
try{
  if(cmd==="init"){await init();console.log("Initialized registries and folders; existing files preserved")}
  else if(cmd==="validate"){await init();const r=await validate();await write(file("reports","LATEST_VALIDATION.json"),{generatedAt:new Date().toISOString(),...r});console.log(JSON.stringify(r,null,2));if(!r.ok)process.exitCode=1}
  else if(cmd==="chapter:new"){await init();console.log("Created "+await create(a[0],a.slice(1).join(" ")))}
  else if(cmd==="chapter:show")console.log(JSON.stringify(await show(a[0]),null,2))
  else if(cmd==="story:new"){await init();console.log("Created story item "+await createStoryItem(a[0],a[1],a.slice(2).join(" ")))}
  else if(cmd==="story:list")console.log(JSON.stringify(await listStoryItems(),null,2))
  else if(cmd==="story:show")console.log(JSON.stringify(await showStoryItem(a[0]),null,2))
  else if(cmd==="context:chapter"){const context=await buildChapterContext(a[0]);console.log(formatChapterContext(context))}
  else if(cmd==="context:write"){const context=await buildChapterContext(a[0]);const output=file("reports","CHAPTER_"+String(Number(a[0])).padStart(4,"0")+"_CONTEXT.md");await writeText(output,formatChapterContext(context));console.log("Wrote "+output)}
  else if(cmd==="character:state")console.log(JSON.stringify(await getCharacterState(a[0],a[1]),null,2))
  else if(cmd==="character:history")console.log(JSON.stringify(await listCharacterHistory(a[0]),null,2))
  else if(cmd==="knowledge:state")console.log(JSON.stringify(await getKnowledgeState(a[0],a[1],a[2]??null),null,2))
  else if(cmd==="knowledge:who-knows")console.log(JSON.stringify(await getKnowledgeHolders(a[0],a[1]),null,2))
  else if(cmd==="timeline:chapter")console.log(JSON.stringify(await getChapterTimelineFromDisk(a[0]),null,2))
  else if(cmd==="object:history")console.log(JSON.stringify(await getRecordHistoryFromDisk("06_DOCUMENT_AND_OBJECT_REGISTRY",a[0],a[1]),null,2))
  else if(cmd==="location:history")console.log(JSON.stringify(await getRecordHistoryFromDisk("09_LOCATION_REGISTRY",a[0],a[1]),null,2))
  else if(cmd==="psychology:chapter")console.log(JSON.stringify(await getPsychologyByChapter(a[0]),null,2))
  else if(cmd==="psychology:character")console.log(JSON.stringify(await getCharacterPsychologyHistory(a[0]),null,2))
  else if(cmd==="scene:behaviour")console.log(JSON.stringify(await getSceneBehaviourByChapter(a[0],a[1]??null),null,2))
  else if(cmd==="scene:character")console.log(JSON.stringify(await getCharacterSceneBehaviourHistory(a[0]),null,2))
  else if(cmd==="draft:prepare")console.log(JSON.stringify(await prepareDraftReview(a[0],a[1]),null,2))
  else if(cmd==="draft:stage"){const r=await stageDraftReview(a[0]);console.log(JSON.stringify({id:r.id,chapterNumber:r.chapterNumber,findings:r.findings.length,proposals:r.proposals.length,status:"staged; no canon changed"},null,2))}
  else if(cmd==="draft:list")console.log(JSON.stringify(await listDraftReviews(),null,2))
  else if(cmd==="draft:show")console.log(JSON.stringify(await showDraftReview(a[0]),null,2))
  else if(cmd==="draft:approve")console.log(JSON.stringify(await decideDraftProposal(a[0],a[1],"approve"),null,2))
  else if(cmd==="draft:reject")console.log(JSON.stringify(await decideDraftProposal(a[0],a[1],"reject"),null,2))
  else console.log("Commands: init | validate | chapter:new <number> <title> | chapter:show <number> | story:new <ID> <type> <title> | story:list | story:show <ID> | context:chapter <number> | context:write <number> | character:state <CHAR_ID> <chapter> | character:history <CHAR_ID> | knowledge:state <CHAR_ID> <chapter> [FACT_ID] | knowledge:who-knows <FACT_ID> <chapter> | timeline:chapter <chapter> | object:history <OBJECT_ID> [chapter] | location:history <LOCATION_ID> [chapter] | psychology:chapter <chapter> | psychology:character <CHAR_ID> | scene:behaviour <chapter> [sceneId] | scene:character <CHAR_ID> | draft:prepare <chapter> <draft-file> | draft:stage <analysis.json> | draft:list | draft:show <REVIEW_ID> | draft:approve <REVIEW_ID> <PROPOSAL_ID> | draft:reject <REVIEW_ID> <PROPOSAL_ID>")
}catch(e){console.error("Error: "+e.message);process.exitCode=1}
async function writeText(path,content){const fs=await import("node:fs/promises");const pathModule=await import("node:path");await fs.mkdir(pathModule.dirname(path),{recursive:true});await fs.writeFile(path,content+String.fromCharCode(10))}
