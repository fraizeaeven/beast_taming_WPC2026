import test from "node:test";
import assert from "node:assert/strict";
import {checkNovelIntelligence,analyzeCanonImpact,getNarrativeThreadReport} from "../src/novel-intelligence.js";

const fixture = () => ({
  registries: {
    "01_CANON_REGISTRY": {entries:[{id:"FACT_HERO_AGE",value:19}]},
    "03_CHARACTER_REGISTRY": {entries:[{id:"CHAR_HERO",ageFactId:"FACT_HERO_AGE"}]},
    "11_MYSTERY_REGISTER": {entries:[{id:"MYS_MASKED_KING",setupChapter:2,clues:[{chapter:4}],revealChapter:7,status:"open"}]},
    "12_OPEN_LOOP_REGISTER": {entries:[{id:"LOOP_MISSING_HEIR",openedInChapter:3,status:"open"}]},
    "13_PROMISE_AND_PAYOFF_REGISTER": {entries:[
      {id:"PROM_RETURN",madeInChapter:2,notBeforeChapter:6,dueByChapter:8,status:"open"},
      {id:"FORESHADOW_BLACK_WOLF",kind:"foreshadowing",madeInChapter:1,clueChapters:[2,5],status:"open"}
    ]}
  },
  chapters:[
    {number:2,canonChanges:[{factId:"FACT_HERO_AGE",value:21}],promises:[{promiseId:"PROM_RETURN",action:"fulfilled"}]},
    {number:3,openLoops:[{openLoopId:"LOOP_MISSING_HEIR",action:"resolved"}]},
    {number:4,events:[{eventId:"EVT_HEIR",occurredOn:"2026-01-01"}]},
    {number:5,storyLinks:[{storyId:"ARC_HEIR"}]},
    {number:7,mysteryChanges:[{mysteryId:"MYS_MASKED_KING",action:"revealed"}]}
  ]
});

test("flags explicit cross-chapter canon assertion conflicts",()=>{
  const x=fixture();
  assert.ok(checkNovelIntelligence(x).some(item=>item.code==="CANON_ASSERTION_CONFLICT"&&item.factId==="FACT_HERO_AGE"));
});

test("flags mystery clues recorded after the reveal",()=>{
  const x=fixture();
  x.registries["11_MYSTERY_REGISTER"].entries[0].clues.push({chapter:8});
  assert.ok(checkNovelIntelligence(x).some(item=>item.code==="MYSTERY_CLUE_AFTER_REVEAL"));
});

test("flags open-loop resolution before opening and promise payoff too early",()=>{
  const x=fixture();
  const codes=checkNovelIntelligence(x).map(item=>item.code);
  assert.ok(codes.includes("OPEN_LOOP_RESOLVED_BEFORE_OPENED"));
  assert.ok(codes.includes("PROMISE_PAYOFF_TOO_EARLY"));
});

test("impact analysis finds direct registry references and linked chapter references",()=>{
  const x=fixture();
  const impact=analyzeCanonImpact(x,"01_CANON_REGISTRY","FACT_HERO_AGE");
  assert.equal(impact.directRegistryReferences[0].id,"CHAR_HERO");
  assert.ok(impact.directlyAffectedChapters.some(item=>item.chapter===2));
  assert.ok(impact.linkedRecordIds.includes("CHAR_HERO"));
});

test("thread report separates mysteries, open loops, promises and foreshadowing",()=>{
  const x=fixture();
  const report=getNarrativeThreadReport(x.registries,x.chapters);
  assert.equal(report.mysteries.length,1);
  assert.equal(report.openLoops.length,1);
  assert.equal(report.promises.length,2);
  assert.equal(report.foreshadowing[0].id,"FORESHADOW_BLACK_WOLF");
});

test("does not flag an explicitly marked retcon as an unlabelled contradiction",()=>{
  const x=fixture();
  x.chapters[0].canonChanges[0].changeType="retcon";
  assert.ok(!checkNovelIntelligence(x).some(item=>item.code==="CANON_ASSERTION_CONFLICT"));
});
