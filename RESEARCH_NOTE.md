# Research Note

## 1. The learner problem

LLD practice has a structural asymmetry: **starting** a problem (Parking Lot, Elevator, Vending Machine) is easy — the prompts are well known and widely documented — but **evaluating your own solution** is hard, because LLD rarely has one correct answer. Two reasonable candidates can produce very different class structures and both be defensible. Without an interviewer or reviewer in the loop, a learner practicing alone has no reliable way to know:

- Are my class responsibilities actually well-separated, or did I just draw boxes?
- Did I miss an edge case a real interviewer would probe?
- Is my abstraction earning its complexity, or is it a pattern bolted on for its own sake?
- Am I actually improving attempt over attempt, or repeating the same mistakes?

This is different from DSA practice, where a test suite gives an unambiguous pass/fail. LLD feedback needs judgment, not just checking.

## 2. Existing approaches researched

| Tool | What it offers | Gap relative to the learner problem above |
|---|---|---|
| **Hello Interview – LLD Guided Practice** (hellointerview.com) | Walks through common LLD problems with "personalized feedback" during a guided session | Closest existing analog to a feedback loop; largely tied to their guided/interview-prep flow rather than free-form submit-your-own-design practice with a persistent history |
| **awesome-low-level-design** (GitHub, open-source, ashishps1) | Structured, free curriculum: OOP fundamentals → patterns → worked problems (parking lot, logging framework, etc.) with class/sequence/state diagrams | Static reference material. You read a model solution and compare it to your own by eye — there's no submission or evaluation step at all |
| **lldproblems.com** | Curated problems + solutions + an AI agent that generates class skeletons/type definitions from a sketched design | Oriented around *generating* code from a design, not *evaluating* a learner's own submitted design against a rubric |
| **codezym.com** | Machine-coding practice for LLD problems using design patterns | Reference/solution-based; practice is closer to "read and reproduce a known-good implementation" than "submit and get feedback on your own reasoning" |

## 3. Key gaps identified

1. **No tool closes the loop from submission to structured, evidence-based feedback.** Most either hand you a model solution to compare against yourself, or generate code *for* you — neither tells you what's specifically wrong with what *you* wrote.
2. **No persistent attempt history.** Every tool researched treats each problem as a one-shot read/attempt; none frame practice as a repeatable loop where a learner's second or third attempt on the same problem is compared against their first.
3. **Feedback, where it exists, tends toward a single score or a canned "correct answer" comparison**, rather than dimension-by-dimension feedback (responsibilities, coupling, extensibility, etc.) tied to evidence in the actual submission.

## 4. Product direction

Build a small, focused loop — not a course, not an LMS — that a learner can run repeatedly: **pick a problem → write a design (free text is enough to demonstrate reasoning) → submit → get feedback scored against a fixed, named rubric with evidence and concrete suggestions per dimension → see the attempt sitting alongside past attempts on the same problem.**

The bet: repeatable, evidence-grounded feedback (rather than a single opaque score, and rather than only a static reference solution) is what actually helps a learner improve attempt-over-attempt — which is the gap none of the researched tools fully close.

## 5. What I'd want to research further 

- Whether learners want feedback compared against *their own* past attempts explicitly ("you improved on X since last time") rather than just viewing history side by side — a natural next iteration once there's usage data.
- Whether a hybrid deterministic + LLM rubric (as designed in `DESIGN_NOTE.md`) actually produces more consistent scores across repeated evaluations of the same submission — worth an eval/consistency study before trusting scores as a real signal of improvement.
