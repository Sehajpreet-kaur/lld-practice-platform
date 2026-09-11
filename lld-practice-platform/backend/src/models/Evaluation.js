import mongoose from "mongoose";

/**
 * A single scored dimension of feedback. Kept as a subdocument, not a
 * separate collection, because criteria have no independent lifecycle -
 * they only ever exist as part of one Evaluation.
 */
const criterionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // e.g. "Class Responsibilities"
    score: { type: Number, min: 0, max: 5, required: true },
    evidence: { type: String, required: true }, // must reference the submission, not be generic
    suggestion: { type: String, required: true },
  },
  { _id: false }
);

/**
 * Evaluation is deliberately its own document (not embedded in Submission)
 * so a second evaluator (rule-based, human) can later produce a second
 * Evaluation against the same Submission without any migration -
 * Submission.evaluation just needs to become an array in that future.
 */
const evaluationSchema = new mongoose.Schema(
  {
    submission: { type: mongoose.Schema.Types.ObjectId, ref: "Submission", required: true },
    evaluatorType: { type: String, required: true }, // "llm" | "rule-based" | "human"
    criteria: { type: [criterionSchema], required: true },
    overallSummary: { type: String, required: true },
    confidence: { type: Number, min: 0, max: 1, default: 0.7 },
  },
  { timestamps: true }
);

export default mongoose.model("Evaluation", evaluationSchema);
