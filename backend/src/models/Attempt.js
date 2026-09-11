import mongoose from "mongoose";

/**
 * An Attempt is one learner's session against one Problem.
 * It is the anchor for "History": a user's list of Attempts on a Problem
 * is literally their improvement timeline.
 *
 * Retrying a problem = starting a NEW Attempt, not mutating an old one.
 * This keeps every past submission + feedback pair immutable and reviewable.
 */
const attemptSchema = new mongoose.Schema(
  {
    problem: { type: mongoose.Schema.Types.ObjectId, ref: "Problem", required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: ["InProgress", "Submitted"],
      default: "InProgress",
    },
    submission: { type: mongoose.Schema.Types.ObjectId, ref: "Submission", default: null },
    startedAt: { type: Date, default: Date.now },
    submittedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

attemptSchema.index({ user: 1, problem: 1, createdAt: -1 });

export default mongoose.model("Attempt", attemptSchema);
