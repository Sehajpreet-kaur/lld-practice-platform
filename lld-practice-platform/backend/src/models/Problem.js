import mongoose from "mongoose";

/**
 * Problem is a static catalog entity: the LLD prompt itself.
 * It owns nothing about a learner's attempt - that separation is what
 * lets the same problem be attempted many times, by many users,
 * in different formats, without touching this model.
 */
const problemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    difficulty: { type: String, enum: ["Easy", "Medium", "Hard"], default: "Medium" },
    description: { type: String, required: true },
    requirements: [{ type: String, required: true }], // functional requirements shown to learner
    hints: [{ type: String }], // optional nudges, not shown unless requested
    tags: [{ type: String }], // e.g. ["OOP", "State Pattern", "Concurrency"]
  },
  { timestamps: true }
);

export default mongoose.model("Problem", problemSchema);
