#!/usr/bin/env node
import {init,file,write} from "./io.js";
import {validate} from "./validate.js";
import {create,show} from "./chapter.js";
import {createStoryItem,listStoryItems,showStoryItem} from "./story-structure.js";
const [cmd="help",...a]=process.argv.slice(2);
try{
  if(cmd==="init"){await init();console.log("Initialized registries and folders; existing files preserved")}
  else if(cmd==="validate"){await init();const r=await validate();await write(file("reports","LATEST_VALIDATION.json"),{generatedAt:new Date().toISOString(),...r});console.log(JSON.stringify(r,null,2));if(!r.ok)process.exitCode=1}
  else if(cmd==="chapter:new"){await init();console.log("Created "+await create(a[0],a.slice(1).join(" ")))}
  else if(cmd==="chapter:show")console.log(JSON.stringify(await show(a[0]),null,2))
  else if(cmd==="story:new"){await init();console.log("Created story item "+await createStoryItem(a[0],a[1],a.slice(2).join(" ")))}
  else if(cmd==="story:list")console.log(JSON.stringify(await listStoryItems(),null,2))
  else if(cmd==="story:show")console.log(JSON.stringify(await showStoryItem(a[0]),null,2))
  else console.log("Commands: init | validate | chapter:new <number> <title> | chapter:show <number> | story:new <ID> <type> <title> | story:list | story:show <ID>")
}catch(e){console.error("Error: "+e.message);process.exitCode=1}
