# Design Note

## 1. MVP scope

A learner can: browse a small catalog of LLD problems → start an attempt → write a free-text design → submit → receive rubric-based feedback (LLM-evaluated) → view it in their attempt history → start a new attempt to retry.

Deliberately **out of scope** for this MVP: code/diagram submission formats, human review, multi-evaluator aggregation, a problem-authoring UI, job queues. The design leaves room for all of these without rework (see §4).

## 2. User flow

```
Login/Register
   │
   ▼
Problem list ──▶ Problem detail (requirements + past attempts) ──▶ Start attempt
                                                                        │
                                                                        ▼
                                                              Attempt workspace
                                                            (write free-text design)
                                                                        │
                                                                        ▼
                                                                    Submit
                                                          (202 - returns immediately)
                                                                        │
                                                          ┌─────────────┴─────────────┐
                                                          ▼                           ▼
                                                   Frontend polls          Backend runs evaluator
                                                   GET /submissions/:id    in background
                                                          │                           │
                                                          └─────────────┬─────────────┘
                                                                        ▼
                                                        Feedback shown (criteria + evidence + suggestions)
                                                                        │
                                                                        ▼
                                                              Attempt saved to History
```

## 3. Core domain model

| Class | Owns | Key responsibility |
|---|---|---|
| `Problem` | title, description, requirements[], tags | The static catalog entity. Knows nothing about any learner. |
| `Attempt` | problem ref, user ref, status, submission ref | One learner's session against one problem. The anchor for history — retrying = a new `Attempt`, not mutating an old one. |
| `Submission` | attempt ref, content, format, status, failureReason | The evidence handed in. Owns the `Submitted → Evaluating → Completed/Failed` state machine. |
| `Evaluation` | submission ref, evaluatorType, criteria[], overallSummary, confidence | The feedback, as its own document (not embedded), so a second evaluator can later produce a second `Evaluation` against the same `Submission` without a schema migration. |
| `Evaluator` (interface) | — | `evaluate({problem, submission}) → {criteria, overallSummary, confidence}`. Everything else in the system talks to this interface, never to a specific evaluator. |
| `LLMEvaluator` | Groq client | Sends a fixed-rubric prompt, parses structured JSON, defensively clamps scores/lengths. |
| `RuleBasedEvaluator` | — | Deterministic heuristic evaluator (length, keyword coverage). Exists to prove the seam works and to give tests a network-free evaluator. |

Why this shape, specifically:

- **`Attempt` vs `Submission` are separate classes**, not one. An attempt can exist `InProgress` with no submission yet (the learner is still writing). Collapsing them would force a submission row to exist before there's any content, which muddies the state machine.
- **`Evaluation` is not embedded in `Submission`.** A submission has *one* evaluator result today, but the relationship is a reference, not embedding, specifically so "add a second evaluator against the same submission" is an additive change (`Submission.evaluation` becoming `Submission.evaluations: []`) rather than a document restructure.
- **The `Evaluator` interface is the single extensibility seam.** `evaluationService` calls `getEvaluator(type).evaluate(...)` and does not know or care which implementation runs. This is the direct answer to "how would this accommodate another evaluation approach later" — see Change Test B below.

## 4. Two change tests

**Change Test A — new submission format (e.g. class diagram):**
`Submission.format` already exists as an enum (`"text"` today). Adding `"diagram"` means: (1) add the value to the enum, (2) add a new frontend input component, (3) teach `LLMEvaluator`'s prompt builder to serialize diagram data into the prompt instead of raw text. `Attempt`, `Evaluation`, routes, and the state machine are untouched.

**Change Test B — second evaluator (rule-based or human):**
Already implemented as a proof: `RuleBasedEvaluator` sits alongside `LLMEvaluator` behind the same `Evaluator` interface, selected via `getEvaluator(type)`. A human-review evaluator would implement the same contract (its `evaluate()` would enqueue a review task and resolve when a reviewer submits their score) — `evaluationService`'s `Submitted → Evaluating → Completed/Failed` flow needs no changes.

## 5. Evaluation approach: what's deterministic vs. AI-judged

| Deterministic (code) | AI-judged (LLM) |
|---|---|
| Required fields present, non-empty submission | Class responsibility quality |
| Attempt/Submission state transitions | Coupling & cohesion |
| Duplicate-submission prevention | Appropriate abstraction / pattern use |
| Auth, ownership checks | Extensibility to changing requirements |
| | Requirement understanding, quality of reasoning |

The LLM is given a **fixed rubric** (6 named dimensions) and required to return structured JSON with `evidence` and `suggestion` per dimension — deliberately not asked the open-ended "is this a good design?" question, so feedback stays anchored to the actual submission rather than a generic verdict. Scores and text are clamped/truncated server-side after parsing; the model is never trusted blindly.

## 6. Handling slow/failed evaluation (practical, not distributed-systems)

- The `Submission` is written to the DB, and the HTTP request returns `202 Accepted`, **before** the LLM is called — a slow or crashed evaluator can never lose the learner's work.
- Status moves `Submitted → Evaluating → Completed/Failed`. The frontend polls `GET /submissions/:id` on a short interval while status is pending.
- On failure, `failureReason` is stored and a `POST /submissions/:id/retry` endpoint re-runs evaluation on the *same* submission without asking the learner to re-type their design.
- Duplicate processing is prevented at the source: an `Attempt` can only be submitted once (`409` on a second attempt), so retries don't fan out into parallel evaluation runs.
- No queue/worker infrastructure for the MVP — a single `runEvaluation()` async function is enough at this scale. If load grew, the first thing I'd pull out is exactly that function, into a worker consuming from a lightweight queue (e.g. BullMQ/Redis), with `Submission.status` as the durable checkpoint that already exists — the API and data model wouldn't need to change, only what invokes `runEvaluation`.

## 7. Key trade-offs

- **Text-only submissions** instead of also supporting code/diagrams: faster to build, and free-text design write-ups are still strong evidence of LLD reasoning (arguably *better* evidence of "why", which is what the rubric dimensions actually probe). Traded off breadth of format for depth of the evaluation and history experience.
- **In-process async evaluation** instead of a job queue: correct at MVP scale (single instance, low concurrency), simpler to run and test. Explicitly called out as the first thing to change under load, not something the design pretends won't happen.
- **One LLM evaluator live at a time** (not both LLM + rule-based combined into one score): keeps the feedback loop legible for the learner — combining conflicting deterministic and LLM signals into a single number felt like exactly the "random AI score" anti-pattern the assignment warns against. Both stay available as independent evaluators.
