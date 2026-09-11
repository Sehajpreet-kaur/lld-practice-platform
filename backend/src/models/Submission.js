import mongoose from "mongoose";

/**
 * Submission is the evidence the learner hands in.
 * `format` keeps the door open for code/diagram formats later (Change Test A)
 * without altering Attempt or the evaluation pipeline - only a new
 * renderer/validator for that format needs to be added.
 *
 * Status is the state machine the whole async evaluation flow hangs off:
 *   Submitted -> Evaluating -> Completed
 *                          \-> Failed
 * Persisting the submission BEFORE evaluation starts means a slow/crashed
 * evaluator never loses the learner's work.
 */
const submissionSchema = new mongoose.Schema(
  {
    attempt: { type: mongoose.Schema.Types.ObjectId, ref: "Attempt", required: true },
    format: { type: String, enum: ["text"], default: "text" }, // extend enum when new formats ship
    content: { type: String, required: true },
    status: {
      type: String,
      enum: ["Submitted", "Evaluating", "Completed", "Failed"],
      default: "Submitted",
    },
    failureReason: { type: String, default: null },
    evaluation: { type: mongoose.Schema.Types.ObjectId, ref: "Evaluation", default: null },
  },
  { timestamps: true }
);

export default mongoose.model("Submission", submissionSchema);
