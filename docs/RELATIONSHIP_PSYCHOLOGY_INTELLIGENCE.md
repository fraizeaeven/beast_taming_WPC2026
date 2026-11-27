# Relationship Psychology Intelligence

Version 2.3 reviews the psychological feedback loop between two characters. It builds on the existing `04_RELATIONSHIP_REGISTRY`, chapter `relationshipChanges`, and `sceneBehaviourChecks`; it does not replace those records.

## Core interaction loop

For each consequential interaction, record:

1. **Trigger** — what initiates the exchange.
2. **Initiator's inner driver** — intent, fear or need.
3. **Initiator's observable behaviour** — what they actually do or say.
4. **Responder's interpretation** — what the behaviour means to them; it may be accurate, partial or mistaken.
5. **Responder's reaction** — emotional or observable response.
6. **Feedback loop** — how the responder's reaction changes the initiator's next behaviour.
7. **Relationship effects** — trust impact, power dynamic, boundary impact and relationship shift.
8. **Repair** — whether someone attempts repair and what actually happens afterward.

The engine does not infer private states from prose. It checks only explicitly recorded annotations and evidence.

## Chapter record

Add `relationshipPsychologyChecks` to a chapter. Example:

```json
{
  "id": "RELBEAT_001",
  "relationshipId": "REL_KAEL_LINA",
  "initiatorCharacterId": "CHAR_KAEL",
  "responderCharacterId": "CHAR_LINA",
  "trigger": "Lina tries to leave during an argument",
  "initiatorIntent": "Kael wants to keep her safe",
  "initiatorFearOrNeed": "He fears losing someone he loves",
  "initiatorBehaviour": "He blocks the doorway and orders her to stay",
  "responderInterpretation": "Lina believes he does not respect her judgement",
  "interpretationAccuracy": "misread",
  "interpretationGapEvidence": "Kael admits privately that his action came from fear, not contempt",
  "responderResponse": "Lina withdraws and stops sharing information",
  "initiatorNextBehaviour": "Kael becomes more controlling after Lina withdraws",
  "initiatorNextBehaviour": "Kael becomes more controlling after Lina withdraws",
  "defensiveStrategy": "protective_control",
  "trustImpact": "damaged",
  "trustEvidence": "She conceals her next plan from him",
  "powerDynamic": "Kael controls access to the exit",
  "powerEvidence": "He physically blocks the doorway",
  "boundaryCrossed": true,
  "boundaryImpact": "Lina's autonomy is overridden",
  "repairAttempt": true,
  "repairOutcome": "Lina hears the apology but does not yet trust him",
  "repairEvidence": "She accepts the explanation but keeps her distance",
  "relationshipShift": "The relationship becomes more guarded",
  "relationshipShiftEvidence": "She no longer tells him where she is going",
  "observableEvidence": "He blocks the doorway; she leaves without answering"
}
```

## Supported optional fields

| Field | Purpose |
| --- | --- |
| `initiatorIntent`, `initiatorFearOrNeed` | Record the initiating character's purpose and emotional driver. |
| `responderInterpretation`, `interpretationAccuracy`, `interpretationGapEvidence` | Record what the responder thinks happened and whether that reading is accurate, partial or mistaken. |
| `responderResponse` | Record the responder's emotional/behavioural reaction. |
| `initiatorNextBehaviour` | Record the initiator's subsequent behaviour after seeing the responder's reaction, making the feedback loop explicit. |
| `defensiveStrategy`, `strategyReview`, `attemptedAlternative` | Track repeated protective or defensive patterns and whether the character questions or changes them. |
| `trustImpact`, `trustEvidence` | Describe and support the effect on trust. |
| `powerDynamic`, `powerEvidence` | Record an explicit power difference and its evidence. |
| `dependencyDynamic`, `dependencyEvidence` | Record an explicitly described emotional-dependency dynamic and its evidence; this is not a diagnosis. |
| `attachmentPattern` | Optional author interpretation; use only when supported, not as a diagnosis. |
| `boundaryCrossed`, `boundaryImpact` | Record an explicitly crossed boundary and its impact. |
| `repairAttempt`, `repairOutcome`, `repairEvidence` | Distinguish an attempt to repair from the other character's actual response. |
| `relationshipShift`, `relationshipShiftEvidence` | Record and support a change in the relationship. |
| `observableEvidence` | Ground the interaction in visible action, dialogue or explicit narration. |

The relationship registry must contain the referenced `relationshipId` and its two participants in `from` and `to`. The interaction's initiator and responder must be those same two characters; either character may initiate.

## Report and validation

```bash
npm run relationship:psychology
npm run relationship:psychology -- REL_KAEL_LINA
npm run validate
```

The report lists interactions and findings for each relationship. Validation adds structural errors for unknown relationship/character references and participant mismatches. Missing causal details, unsupported interpretations, trust/power claims, repair outcomes and repeated costly defensive patterns are advisory warnings.

A `relationshipChanges` item may include `sourceInteractionId` to link a state transition to its causal interaction. If supplied, the ID must resolve to an earlier interaction for the same relationship.

## Review boundaries

- A character's intention and the other character's interpretation are separate facts; a misunderstanding can be emotionally real without being factually correct.
- Do not assume either character is wholly right or wrong. Both may act from understandable fears and still cause harm.
- A power imbalance is not neutral merely because the more powerful character has protective intentions.
- An apology, explanation or repair attempt does not automatically restore trust or require forgiveness.
- Repeated defensive behaviour is flagged only when the same explicitly labelled strategy recurs and its trust impact is explicitly marked as damaging/strained.
- Attachment patterns are optional author interpretations, not clinical diagnoses.
- Relationship development can stall, regress, remain unequal or end. The engine does not force reconciliation, romance or a happy ending.
- No relationship registry or chapter canon is changed automatically.
