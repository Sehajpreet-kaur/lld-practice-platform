import { Evaluator } from "./Evaluator.js";

/**
 * Deliberately minimal - this exists to PROVE the Evaluator seam works,
 * not to be a real evaluator. It's the answer to "Change Test B": add a
 * second evaluation strategy without touching evaluationService, routes,
 * or the data model. Register it in evaluators/index.js and it's live.
 *
 * A real version of this could check deterministic things an LLM
 * shouldn't have to: minimum length, whether required class names appear,
 * whether the submission is empty/gibberish, etc.
 */
export class RuleBasedEvaluator extends Evaluator {
  get type() {
    return "rule-based";
  }

  async evaluate({ problem, submission }) {
    const content = submission.content || "";
    const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
    const mentionsRequirement = problem.requirements.some((r) =>
      content.toLowerCase().includes(r.toLowerCase().split(" ")[0])
    );

    const lengthScore = wordCount > 150 ? 5 : wordCount > 50 ? 3 : 1;

    return {
      criteria: [
        {
          name: "Submission Completeness",
          score: lengthScore,
          evidence: `Submission contains ${wordCount} words.`,
          suggestion:
            wordCount < 150
              ? "Expand on class responsibilities and edge cases - a thorough LLD write-up is rarely this short."
              : "Length is reasonable; focus on depth of individual class responsibilities next.",
        },
        {
          name: "Requirement Coverage (heuristic)",
          score: mentionsRequirement ? 4 : 1,
          evidence: mentionsRequirement
            ? "Submission text references at least one stated requirement keyword."
            : "No stated requirement keywords were found in the submission text.",
          suggestion: "Explicitly map each requirement to the class/method that satisfies it.",
        },
      ],
      overallSummary:
        "Automated heuristic check only - use this alongside the LLM evaluation, not instead of it.",
      confidence: 0.4,
    };
  }
}
