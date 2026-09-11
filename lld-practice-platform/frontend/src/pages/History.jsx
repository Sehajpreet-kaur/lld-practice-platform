import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";

export default function History() {
  const [attempts, setAttempts] = useState([]);

  useEffect(() => {
    api.listMyAttempts().then(setAttempts);
  }, []);

  return (
    <div>
      <h2>Your attempt history</h2>
      {attempts.length === 0 && <p className="muted">No attempts yet — go pick a problem.</p>}
      <div className="history-list">
        {attempts.map((a) => (
          <Link to={`/attempts/${a._id}`} key={a._id} className="card attempt-row">
            <div>
              <strong>{a.problem?.title}</strong>
              <div className="muted small">{new Date(a.createdAt).toLocaleString()}</div>
            </div>
            <div className="history-right">
              <span className={`status status-${(a.submission?.status || "InProgress").toLowerCase()}`}>
                {a.submission?.status || "In progress"}
              </span>
              {a.submission?.evaluation && (
                <span className="avg-score">
                  avg{" "}
                  {(
                    a.submission.evaluation.criteria.reduce((s, c) => s + c.score, 0) /
                    a.submission.evaluation.criteria.length
                  ).toFixed(1)}
                  /5
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
