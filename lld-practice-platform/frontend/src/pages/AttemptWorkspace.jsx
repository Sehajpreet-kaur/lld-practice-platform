import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../api/client.js";

export default function AttemptWorkspace() {
  const { id } = useParams();
  const [attempt, setAttempt] = useState(null);
  const [content, setContent] = useState("");
  const [submission, setSubmission] = useState(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const pollRef = useRef(null);

  useEffect(() => {
    api.getAttempt(id).then((a) => {
      setAttempt(a);
      if (a.submission) setSubmission(a.submission);
    });
    return () => clearInterval(pollRef.current);
  }, [id]);

  function pollSubmission(submissionId) {
    pollRef.current = setInterval(async () => {
      const s = await api.getSubmission(submissionId);
      setSubmission(s);
      if (s.status === "Completed" || s.status === "Failed") {
        clearInterval(pollRef.current);
      }
    }, 1500);
  }

  async function handleSubmit() {
    if (!content.trim()) {
      setError("Write your design before submitting.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const { submission: created } = await api.submit(id, content, "llm");
      setSubmission(created);
      pollSubmission(created._id);
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRetry() {
    setError("");
    try {
      const updated = await api.retrySubmission(submission._id);
      setSubmission(updated);
      if (updated.status === "Evaluating") pollSubmission(updated._id);
    } catch (e) {
      setError(e.message);
    }
  }

  if (!attempt) return <p>Loading...</p>;

  const locked = attempt.status === "Submitted";

  return (
    <div>
      <Link to={`/problems/${attempt.problem.slug}`} className="link-btn">
        ←  {attempt.problem.title}
      </Link>

      {!locked && (
        <>
          <h3>Write your design</h3>
          <p className="muted">
            Text is enough — describe the classes, responsibilities, relationships, and key trade-offs. You don't
            need real code.
          </p>
          <textarea
            rows={16}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="e.g. ParkingLot has multiple Floors. Each Floor holds Spots typed by VehicleType..."
          />
          {error && <p className="error">{error}</p>}
          <button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Submitting..." : "Submit for feedback"}
          </button>
        </>
      )}

      {submission && <FeedbackPanel submission={submission} onRetry={handleRetry} error={error} />}
    </div>
  );
}

function FeedbackPanel({ submission, onRetry, error }) {
  return (
    <div className="feedback-panel">
      <h3>Feedback</h3>
      <p className={`status status-${submission.status.toLowerCase()}`}>{submission.status}</p>

      {(submission.status === "Submitted" || submission.status === "Evaluating") && (
        <p className="muted">Evaluating your design — this usually takes a few seconds...</p>
      )}

      {submission.status === "Failed" && (
        <div>
          <p className="error">Evaluation failed: {submission.failureReason}</p>
          <button onClick={onRetry}>Retry evaluation</button>
        </div>
      )}
      {error && <p className="error">{error}</p>}

      {submission.status === "Completed" && submission.evaluation && (
        <div>
          <p className="summary">{submission.evaluation.overallSummary}</p>
          {submission.evaluation.criteria.map((c) => (
            <div key={c.name} className="criterion card">
              <div className="criterion-head">
                <strong>{c.name}</strong>
                <span className="score">{c.score}/5</span>
              </div>
              <p className="muted">
                <b>Evidence:</b> {c.evidence}
              </p>
              <p>
                <b>Suggestion:</b> {c.suggestion}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
