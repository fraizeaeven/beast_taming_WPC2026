# Character Psychology and Emotional Analysis

The engine records scene-level character psychology as author-reviewable evidence. It does not claim to read a character's mind or determine psychological truth automatically.

## Query

```bash
npm run psychology:chapter -- 12
npm run psychology:character -- CHAR_KAEL
npm run validate
```

A chapter's `psychologyChecks` array stores one beat per meaningful character reaction or turning point. A character history query lists their recorded beats in chapter order.

## Suggested beat shape

```json
{
  "id": "PSY_KAEL_0012_03",
  "characterId": "CHAR_KAEL",
  "sceneId": "SCENE_12_03",
  "trigger": "Lina offers to take the risk in his place",
  "automaticReaction": "He steps in front of her before answering",
  "thought": "If she gets hurt, it will be my fault",
  "emotion": "Fear, guilt and irritation",
  "physicalSensation": "Jaw locks; shoulders tense; breath catches",
  "expressedEmotion": "He speaks sharply and looks away",
  "underlyingNeed": "To keep people he loves safe",
  "misbelief": "Only he can prevent harm; accepting help makes him weak",
  "deliberateChoice": "Refuses her offer and takes the task alone",
  "consequence": "Lina loses the chance to warn the others",
  "observableEvidence": "He moves before she finishes speaking and answers in a clipped voice",
  "interpretation": "Protectiveness is genuine, but fear is disguised as anger",
  "arcId": "ARC_KAEL_TRUST",
  "arcStage": 3,
  "stageEvidence": "He recognises that isolation hurts others, yet still doubts accepting help will reduce the danger",
  "changeType": "stalled",
  "source": { "kind": "chapter", "reference": "CHAPTER_0012, scene 3" }
}
```

## Analyse the beat in order

1. **Trigger:** What specific event, words, gesture or discovery activates the character?
2. **Automatic reaction:** What do they do before consciously deciding? Include reflex, habit, defence mechanism or avoidance where the draft supports it.
3. **Thought:** What immediate interpretation or internal sentence occurs?
4. **Emotion:** Name the emotion precisely. Mixed emotions are allowed.
5. **Physical sensation:** Show the bodily experience (breath, pulse, muscles, heat, nausea, trembling, numbness, pain, posture).
6. **Expressed emotion:** What does another character see or hear? Does the character reveal, suppress, disguise or misdirect the feeling?
7. **Underlying need and misbelief:** What need/fear is active, and what mistaken belief shapes the reaction?
8. **Choice and consequence:** What does the character choose after the automatic response, and what does that choice cost?

Not every beat needs every interpretation field. Do not fill gaps with invented certainty. Use a question or mark the point as inference when the manuscript does not establish it.

## Seven-stage arc evidence

The AI review prompt now checks the character's actual response against the seven-stage arc:

1. Denial of the problem.
2. Recognises the problem but refuses to change.
3. Sees the suffering caused by the problem but doubts change will help.
4. Begins considering change.
5. Realises continued refusal will make self or others suffer.
6. Makes an effort to change.
7. Accepts the truth and transforms.

A stage label is not proof. `stageEvidence` should describe what the character did, thought, refused, attempted or accepted in the scene. A character can stall, partially change, suffer a setback or regress. Do not treat stronger emotion as automatic stage advancement.

## AI-assisted workflow

`npm run draft:prepare -- 12 drafts/chapter-0012.md` generates a chapter-context prompt. It now explicitly asks the AI to distinguish automatic reaction, thought, emotion, physical sensation and outward expression, and to separate draft evidence from interpretation. AI findings remain advisory. To persist a psychology beat, the model may propose an `add_chapter_item` proposal targeting the chapter's `psychologyChecks` array. The author must inspect and approve it through the v1.6 proposal workflow.

## Validation and limits

`npm run validate` checks:
- Stable beat IDs and character references.
- Seven-stage values are within 1–7.
- Scene identifiers and core psychological layers are present.
- Observable evidence and interpretation are recorded separately.
- Arc stage evidence is present when a stage is assigned.

Missing evidence is reported as a warning. Invalid IDs/references and invalid arc-stage values are structural errors. Validation does not decide whether a character's response is believable, whether an inference is correct, or whether an arc stage is emotionally earned. Those decisions remain with the author.
