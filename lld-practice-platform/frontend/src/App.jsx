import { Link, Outlet, useNavigate } from "react-router-dom";

export default function App() {
  const navigate = useNavigate();

  function logout() {
    localStorage.removeItem("token");
    navigate("/login");
  }

  return (
    <div className="shell">
      <header className="topbar">
        <Link to="/" className="brand">
          LLD Practice
        </Link>
        <nav>
          <Link to="/">Problems</Link>
          <Link to="/history">History</Link>
          <button onClick={logout} className="link-btn">
            Log out
          </button>
        </nav>
      </header>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
