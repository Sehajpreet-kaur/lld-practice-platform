import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "../api/client.js";

export default function ProblemDetail() {
  const { slug } = useParams();
  const [problem, setProblem] = useState(null);
  const [pastAttempts, setPastAttempts] = useState([]);
  const [error, setError] = useState("");
  const [starting, setStarting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.getProblem(slug).then(async (p) => {
      setProblem(p);
      const attempts = await api.listAttemptsForProblem(p._id).catch(() => []);
      setPastAttempts(attempts);
    });
  }, [slug]);

  async function start() {
    setStarting(true);
    setError("");
    try {
      const attempt = await api.startAttempt(problem._id);
      navigate(`/attempts/${attempt._id}`);
    } catch (e) {
      setError(e.message);
    } finally {
      setStarting(false);
    }
  }

  if (!problem) return <p>Loading...</p>;

  return (
    <div>
      <Link to="/" className="link-btn">
        ← Back to problems
      </Link>
      <h2>{problem.title}</h2>
      <p className="muted">{problem.description}</p>
      <h4>Requirements</h4>
      <ul>
        {problem.requirements.map((r, i) => (
          <li key={i}>{r}</li>
        ))}
      </ul>

      {error && <p className="error">{error}</p>}
      <button onClick={start} disabled={starting}>
        {starting ? "Starting..." : "Start attempt"}
      </button>

      {pastAttempts.length > 0 && (
        <div className="past-attempts">
          <h4>Your previous attempts on this problem</h4>
          {pastAttempts.map((a) => (
            <Link to={`/attempts/${a._id}`} key={a._id} className="card attempt-row">
              <span>{new Date(a.createdAt).toLocaleString()}</span>
              <span className={`status status-${(a.submission?.status || "InProgress").toLowerCase()}`}>
                {a.submission?.status || "In progress"}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
