const BASE = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : "/api";

function authHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handle(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export const api = {
  register: (body) =>
    fetch(`${BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(handle),

  login: (body) =>
    fetch(`${BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(handle),

  listProblems: () => fetch(`${BASE}/problems`, { headers: authHeaders() }).then(handle),

  getProblem: (slug) => fetch(`${BASE}/problems/${slug}`, { headers: authHeaders() }).then(handle),

  startAttempt: (problemId) =>
    fetch(`${BASE}/attempts`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ problemId }),
    }).then(handle),

  getAttempt: (id) => fetch(`${BASE}/attempts/${id}`, { headers: authHeaders() }).then(handle),

  listMyAttempts: () => fetch(`${BASE}/attempts`, { headers: authHeaders() }).then(handle),

  listAttemptsForProblem: (problemId) =>
    fetch(`${BASE}/attempts/problem/${problemId}`, { headers: authHeaders() }).then(handle),

  submit: (attemptId, content, evaluatorType = "llm") =>
    fetch(`${BASE}/submissions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ attemptId, content, evaluatorType }),
    }).then(handle),

  getSubmission: (id) => fetch(`${BASE}/submissions/${id}`, { headers: authHeaders() }).then(handle),

  retrySubmission: (id) =>
    fetch(`${BASE}/submissions/${id}/retry`, { method: "POST", headers: authHeaders() }).then(handle),
};
