import Attempt from "../models/Attempt.js";
import Problem from "../models/Problem.js";
import Submission from "../models/Submission.js";
import Evaluation from "../models/Evaluation.js";

// Start a fresh attempt at a problem. Multiple attempts per (user, problem)
// are allowed and expected - that's what "History" is built on.
export async function startAttempt(req, res) {
  try {
    const { problemId } = req.body;
    const problem = await Problem.findById(problemId);
    if (!problem) return res.status(404).json({ error: "Problem not found" });

    const attempt = await Attempt.create({ problem: problemId, user: req.userId });
    res.status(201).json(attempt);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// A user's full attempt history for a problem - oldest to newest so
// improvement across attempts is easy to read top-to-bottom.
export async function listAttemptsForProblem(req, res) {
  try {
    const attempts = await Attempt.find({
      user: req.userId,
      problem: req.params.problemId,
    })
      .sort({ createdAt: 1 })
      .populate({
        path: "submission",
        populate: { path: "evaluation" },
      })
      .lean();
    res.json(attempts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// All of a user's attempts across every problem - the top-level history view.
export async function listMyAttempts(req, res) {
  try {
    const attempts = await Attempt.find({ user: req.userId })
      .sort({ createdAt: -1 })
      .populate("problem", "title slug difficulty")
      .populate({ path: "submission", populate: { path: "evaluation" } })
      .lean();
    res.json(attempts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function getAttempt(req, res) {
  try {
    const attempt = await Attempt.findOne({ _id: req.params.id, user: req.userId })
      .populate("problem")
      .populate({ path: "submission", populate: { path: "evaluation" } });
    if (!attempt) return res.status(404).json({ error: "Attempt not found" });
    res.json(attempt);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
