# AI_USAGE.md

I used Claude (Anthropic) throughout this assignment for architecture discussion, scaffolding, and drafting docs. Below are the meaningful decisions — what was suggested, what I kept, what I changed, and why.

## 1. Separating `Evaluation` as its own document instead of embedding it in `Submission`

**Suggested:** Claude proposed making `Evaluation` a referenced document (`Submission.evaluation: ObjectId`) rather than an embedded subdocument, specifically so a second evaluator could later produce a second evaluation against the same submission without a schema migration.

**Accepted.** This directly answers one of the brief's core questions ("how would your design accommodate another evaluation approach later"), and the cost (one extra `populate()` call) is negligible. I kept the reasoning as an inline comment in the model so it's clear this was an intentional trade-off, not an oversight.

## 2. The `Evaluator` interface + a second, deterministic evaluator as proof

**Suggested:** Claude suggested not just describing the Evaluator interface in prose, but actually implementing a second evaluator (`RuleBasedEvaluator`) to prove the seam works, and using it in tests so the test suite doesn't depend on live LLM calls.

**Accepted, with a modification.** I liked this and kept the interface + registry pattern (`evaluators/index.js`) as-is. I changed the rule-based evaluator's rubric slightly from what was first drafted — I wanted it to check something a real deterministic check should catch (missing requirement keywords) rather than just word count, so I asked Claude to add a second criterion for requirement-keyword coverage.

## 3. Async evaluation flow: persist-then-evaluate, not evaluate-then-respond

**Suggested:** Claude proposed writing the `Submission` to the DB and returning `202 Accepted` to the client *before* calling the LLM, with status `Submitted → Evaluating → Completed/Failed`, and a `/retry` endpoint for failed evaluations.

**Accepted as designed.** This is the direct, practical answer to the brief's "what should happen if evaluation takes time or fails" question, without pulling in a job queue, which the brief explicitly says to avoid. I did push back on one part of the first draft — it initially had the retry endpoint re-create a new Submission; I asked Claude to change it to retry evaluation on the *existing* submission instead, so a learner doesn't need to re-type their design after a transient failure.

## 4. Duplicate-submission prevention

**Suggested:** Claude flagged that without a guard, a learner double-clicking "submit" (or a network retry) could create two submissions against the same attempt, and proposed checking `attempt.status !== "Submitted"` before allowing a new submission (returning `409` otherwise).

**Accepted.** Small addition, but it's exactly the kind of edge case the brief calls out ("avoid duplicate processing where a user retries the same request"), and I wanted a test explicitly covering it (see `tests/evaluationFlow.test.js`, "rejects a second submission on an already-submitted attempt").

## 5. Prompt design for the LLM evaluator — fixed rubric over open-ended scoring

**Suggested:** Claude's first draft of the Groq prompt asked for scores against six named dimensions (requirement understanding, class responsibilities, coupling/cohesion, encapsulation, abstraction, extensibility) and required an `evidence` string per dimension quoting/paraphrasing the actual submission, rather than asking a single open-ended "rate this design 1-100" question.

**Accepted.** This matches the assignment's own guidance to avoid unconstrained scoring prompts. I reviewed the six dimensions and decided they were reasonable and non-redundant, so I kept them as given rather than editing the rubric further.


**What I did NOT just accept wholesale:** I read through the generated backend/frontend code file-by-file rather than trusting it blindly, ran the test suite myself, and verified the frontend build (`npm run build`) completed with no errors before treating any of this as done. 
