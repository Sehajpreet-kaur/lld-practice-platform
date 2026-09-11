import Attempt from "../models/Attempt.js";
import Submission from "../models/Submission.js";
import { submitAndEvaluate, retryEvaluation } from "../services/evaluationService.js";

// Create + submit in one call: simplest path for the MVP submission form.
export async function createSubmission(req, res) {
  try {
    const { attemptId, content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ error: "content is required" });
    }

    const attempt = await Attempt.findOne({ _id: attemptId, user: req.userId });
    if (!attempt) return res.status(404).json({ error: "Attempt not found" });

    // Guards against duplicate/accidental resubmission on the same attempt -
    // the practical answer to "avoid duplicate processing on retry".
    if (attempt.status === "Submitted") {
      return res.status(409).json({ error: "This attempt has already been submitted" });
    }

    const submission = await Submission.create({
      attempt: attempt._id,
      format: "text",
      content,
      status: "Submitted",
    });

    attempt.submission = submission._id;
    attempt.status = "Submitted";
    attempt.submittedAt = new Date();
    await attempt.save();

    // Fire-and-forget: caller gets a fast response, evaluation runs in background.
    await submitAndEvaluate({
      attemptId: attempt._id,
      problemId: attempt.problem,
      evaluatorType: req.body.evaluatorType || "llm",
    });

    res.status(202).json({ submission, attempt });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Polling endpoint - the frontend calls this while status is "Evaluating".
export async function getSubmission(req, res) {
  try {
    const submission = await Submission.findById(req.params.id).populate("evaluation");
    if (!submission) return res.status(404).json({ error: "Submission not found" });
    res.json(submission);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function retrySubmission(req, res) {
  try {
    const submission = await Submission.findById(req.params.id).populate("attempt");
    if (!submission) return res.status(404).json({ error: "Submission not found" });
    if (submission.attempt.user.toString() !== req.userId) {
      return res.status(403).json({ error: "Not your submission" });
    }

    await retryEvaluation(submission._id, submission.attempt.problem, req.body.evaluatorType || "llm");
    const updated = await Submission.findById(submission._id).populate("evaluation");
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}
