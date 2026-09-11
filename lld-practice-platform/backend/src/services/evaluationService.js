import Submission from "../models/Submission.js";
import Evaluation from "../models/Evaluation.js";
import Attempt from "../models/Attempt.js";
import Problem from "../models/Problem.js";
import { getEvaluator } from "../evaluators/index.js";

/**
 * Owns the Submitted -> Evaluating -> Completed/Failed lifecycle.
 *
 * Design decision: runEvaluation is fire-and-forget from the caller's
 * perspective. The HTTP request that creates the submission returns
 * immediately with status "Submitted" - the learner is never blocked on
 * the LLM call. This is the practical answer to "what if evaluation is
 * slow or fails": the work is already durably stored before we ever touch
 * the network.
 *
 * A naive retry (double-submitting the same attempt) is prevented by
 * checking the Attempt is still InProgress before creating a submission -
 * see submissionController.
 */
export async function submitAndEvaluate({ attemptId, problemId, evaluatorType = "llm" }) {
  const attempt = await Attempt.findById(attemptId);
  if (!attempt) throw new Error("Attempt not found");

  const submission = await Submission.findById(attempt.submission);
  if (!submission) throw new Error("Submission not found");

  // Kick off evaluation without awaiting - caller already has what it needs.
  runEvaluation(submission._id, problemId, evaluatorType).catch((err) => {
    // runEvaluation already persists failure state; this catch is a last-resort
    // safety net so an unhandled rejection never crashes the process.
    console.error(`[evaluation] unrecoverable error for submission ${submission._id}:`, err);
  });

  return submission;
}

export async function runEvaluation(submissionId, problemId, evaluatorType = "llm") {
  await Submission.findByIdAndUpdate(submissionId, { status: "Evaluating" });

  try {
    const [submission, problem] = await Promise.all([
      Submission.findById(submissionId),
      Problem.findById(problemId),
    ]);
    if (!submission) throw new Error("Submission disappeared mid-evaluation");
    if (!problem) throw new Error("Problem not found for evaluation");

    const evaluator = getEvaluator(evaluatorType);
    const result = await evaluator.evaluate({ problem, submission });

    const evaluation = await Evaluation.create({
      submission: submission._id,
      evaluatorType: evaluator.type,
      criteria: result.criteria,
      overallSummary: result.overallSummary,
      confidence: result.confidence,
    });

    await Submission.findByIdAndUpdate(submissionId, {
      status: "Completed",
      evaluation: evaluation._id,
    });

    return evaluation;
  } catch (err) {
    await Submission.findByIdAndUpdate(submissionId, {
      status: "Failed",
      failureReason: err.message?.slice(0, 500) || "Unknown evaluation error",
    });
    throw err;
  }
}

/** Allows a learner to retry evaluation on a Failed submission without resubmitting content. */
export async function retryEvaluation(submissionId, problemId, evaluatorType = "llm") {
  const submission = await Submission.findById(submissionId);
  if (!submission) throw new Error("Submission not found");
  if (submission.status !== "Failed") {
    throw new Error(`Cannot retry a submission with status ${submission.status}`);
  }
  return runEvaluation(submissionId, problemId, evaluatorType);
}
