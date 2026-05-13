import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useApi } from "../ApiProvider.jsx";

/**
 * Student registration (`/register`). When `bare`, renders only inner content — wrap with `auth-card` on the parent (same shell as Login).
 *
 * @param {{ bare?: boolean }} props
 */
export default function StudentRegisterForm({ bare = false }) {
  const navigate = useNavigate();
  const { api, snapshot, loading } = useApi();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [studentProfileId, setStudentProfileId] = useState("");
  const [msg, setMsg] = useState("");

  const students = snapshot?.students ?? [];

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    try {
      await api.registerStudent({ email, password, displayName: displayName || email.split("@")[0], studentProfileId });
      navigate("/app/student/home", { replace: true });
    } catch (er) {
      setMsg(String(er.message || "Registration failed"));
    }
  };

  const body = (
    <>
      <h2>Student registration</h2>
      <p className="muted">Link your account to a campus student record ID for the dashboard and check-ins (demo roster).</p>

      <div className="counselor-hint-banner counselor-hint-prominent">
        <p className="counselor-hint-title">Are you a campus counselor?</p>
        <p className="counselor-hint-body">
          Do not use this form. <Link to="/register/counselor">Open counselor registration</Link> to create a desk account.
        </p>
      </div>

      {msg ? <div className="banner-err inline-banner">{msg}</div> : null}

      {!loading && !students.length ? <p className="muted">No student list — start the API server first.</p> : null}

      <form className="auth-form" onSubmit={onSubmit}>
        <label className="field">
          Display name (optional)
          <input type="text" autoComplete="name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
        </label>
        <label className="field">
          Student record ID
          <select value={studentProfileId} onChange={(e) => setStudentProfileId(e.target.value)} required>
            <option value="">Select…</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.id} · {s.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          Email
          <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label className="field">
          Password (min 6 characters)
          <input type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
        </label>
        <button type="submit" className="btn primary full" disabled={loading}>
          Register and open student portal
        </button>
      </form>
    </>
  );

  if (bare) return body;

  return (
    <div className="auth-card spa-card auth-card-entry">
      {body}
      <div className="auth-footer muted">
        Already have an account? <Link to="/login">Sign in</Link>
      </div>
    </div>
  );
}
