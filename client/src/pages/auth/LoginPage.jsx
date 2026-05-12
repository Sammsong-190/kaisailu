import { Link, Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useState } from "react";
import { useApi } from "../../ApiProvider.jsx";
import EntryLayout from "../../layouts/EntryLayout.jsx";

/** @param {string} role */
function homePathForRole(role) {
  if (role === "STUDENT") return "/app/student/home";
  if (role === "COUNSELOR") return "/app/counselor/desk";
  if (role === "ADMIN") return "/app/admin/dashboard";
  return "/";
}

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { api, user, token } = useApi();
  const counselorHint = searchParams.get("kind") === "counselor";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  const rawFrom = location.state?.from;

  const fromAllowed =
    typeof rawFrom === "string" &&
    (rawFrom.startsWith("/app/student") || rawFrom.startsWith("/app/counselor") || rawFrom.startsWith("/app/admin"));

  if (token && !user)
    return (
      <EntryLayout>
        <div className="auth-page entry-auth-page">
          <p className="muted">Restoring session…</p>
        </div>
      </EntryLayout>
    );

  if (token && user) return <Navigate to={fromAllowed ? rawFrom : homePathForRole(user.role)} replace />;

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    try {
      const data = await api.login(email, password);
      const r = data.user.role;
      const dest =
        fromAllowed &&
        ((r === "STUDENT" && rawFrom.startsWith("/app/student")) ||
          (r === "COUNSELOR" && rawFrom.startsWith("/app/counselor")) ||
          (r === "ADMIN" && rawFrom.startsWith("/app/admin")))
          ? rawFrom
          : homePathForRole(r);
      navigate(dest, { replace: true });
    } catch (er) {
      setMsg(String(er.message || "Sign-in failed"));
    }
  };

  return (
    <EntryLayout>
      <div className="auth-page entry-auth-page">
        <div className="auth-card spa-card auth-card-entry">
        <Link className="auth-back muted" to="/">
          ← Back to registration
        </Link>
        <h2>Sign in to SCWIS</h2>
        <p className="muted">
          {counselorHint
            ? "Counselors can sign in with their work email. New accounts: use counselor registration first."
            : "Enter your registered email and password."}
        </p>
        {msg ? <div className="banner-err inline-banner">{msg}</div> : null}

        <form className="auth-form" onSubmit={onSubmit}>
          <label className="field">
            Email
            <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label className="field">
            Password
            <input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </label>
          <button type="submit" className="btn primary full">
            Sign in
          </button>
        </form>

        <div className="auth-footer muted">
          No account? <Link to="/">Student registration</Link>
          {" · "}
          <Link to="/register/counselor">Counselor registration</Link>
        </div>
        <p className="muted tiny-help admin-demo-login-hint">
          Admin demo (Prisma seed): <code>admin@demo.edu</code> / <code>Admin123!</code>
        </p>
        </div>
      </div>
    </EntryLayout>
  );
}
