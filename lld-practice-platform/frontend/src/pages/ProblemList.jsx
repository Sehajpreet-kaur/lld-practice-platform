import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";

export default function ProblemList() {
  const [problems, setProblems] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api.listProblems().then(setProblems).catch((e) => setError(e.message));
  }, []);

  return (
    <div>
      <h2>Choose a problem</h2>
      {error && <p className="error">{error}</p>}
      <div className="grid">
        {problems.map((p) => (
          <Link to={`/problems/${p.slug}`} key={p._id} className="card problem-card">
            <div className="badge">{p.difficulty}</div>
            <h3>{p.title}</h3>
            <div className="tags">
              {(p.tags || []).map((t) => (
                <span key={t} className="tag">
                  {t}
                </span>
              ))}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
