import test from "node:test";
import assert from "node:assert/strict";
import {checkStoryStructure} from "../src/story-structure.js";

const base = () => ({
  registries: {
    "03_CHARACTER_REGISTRY": {entries:[{id:"CHAR_A"},{id:"CHAR_B"}]},
    "17_STORY_STRUCTURE_REGISTRY": {entries:[
      {id:"PLOT_MAIN",type:"main_plot",status:"active",parentId:null,characterIds:["CHAR_A"],chapters:[{chapter:1}],milestones:[{id:"MILESTONE_SETUP",chapter:1}],dependencies:[],source:{kind:"author_note",reference:"Outline v1"}},
      {id:"ARC_A",type:"character_arc",status:"planned",parentId:"PLOT_MAIN",characterIds:["CHAR_A"],chapters:[],milestones:[],dependencies:[],source:{kind:"author_note",reference:"Character outline"}}
    ]}
  },
  chapters:[{number:1,storyLinks:[{storyId:"PLOT_MAIN",role:"setup"}]}]
});

test("accepts a valid hierarchy and chapter mapping",()=>{
  const result=checkStoryStructure(base());
  assert.deepEqual(result.errors,[]);
  assert.deepEqual(result.warnings,[]);
});
test("rejects missing parents, characters, chapters and dependencies",()=>{
  const x=base();x.registries["17_STORY_STRUCTURE_REGISTRY"].entries[1].parentId="NO_PARENT";
  x.registries["17_STORY_STRUCTURE_REGISTRY"].entries[1].characterIds=["NO_CHARACTER"];
  x.registries["17_STORY_STRUCTURE_REGISTRY"].entries[1].dependencies=["NO_DEPENDENCY"];
  x.registries["17_STORY_STRUCTURE_REGISTRY"].entries[1].chapters=[{chapter:99}];
  const codes=checkStoryStructure(x).errors.map(e=>e.code);
  for(const code of ["STORY_PARENT_MISSING","STORY_CHARACTER_MISSING","STORY_DEPENDENCY_MISSING","STORY_CHAPTER_MISSING"]) assert.ok(codes.includes(code));
});
test("detects parent and dependency cycles",()=>{
  const x=base();const entries=x.registries["17_STORY_STRUCTURE_REGISTRY"].entries;
  entries[0].dependencies=["ARC_A"];entries[1].dependencies=["PLOT_MAIN"];
  entries[0].parentId="ARC_A";
  const codes=checkStoryStructure(x).errors.map(e=>e.code);
  assert.ok(codes.includes("STORY_PARENT_CYCLE"));
  assert.ok(codes.includes("STORY_DEPENDENCY_CYCLE"));
});
test("warns when chapter and registry links disagree",()=>{
  const x=base();x.chapters[0].storyLinks=[];
  const codes=checkStoryStructure(x).warnings.map(e=>e.code);
  assert.ok(codes.includes("STORY_CHAPTER_LINK_MISSING"));
});
