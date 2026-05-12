import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useApi } from "../../ApiProvider.jsx";
import EntryLayout from "../../layouts/EntryLayout.jsx";

export default function CounselorRegisterPage() {
  const navigate = useNavigate();
  const { api } = useApi();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [msg, setMsg] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    try {
      await api.registerCounselor({ email, password, displayName: displayName || email.split("@")[0] });
      navigate("/app/counselor/desk", { replace: true });
    } catch (er) {
      setMsg(String(er.message || "Registration failed"));
    }
  };

  return (
    <EntryLayout>
      <div className="auth-page entry-auth-page">
        <div className="auth-card spa-card auth-card-entry">
        <Link className="auth-back muted" to="/login?kind=counselor">
          ← Back to sign in
        </Link>
        <h2>Counselor registration</h2>
        <p className="muted">Counselor accounts access the alert desk and case follow-up. No automated intervention.</p>
        <p className="muted tiny-help">
          Students should use <Link to="/">student registration</Link> instead.
        </p>
        {msg ? <div className="banner-err inline-banner">{msg}</div> : null}

        <form className="auth-form" onSubmit={onSubmit}>
          <label className="field">
            Name
            <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          </label>
          <label className="field">
            Work email
            <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label className="field">
            Password (min 6 characters)
            <input type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          </label>
          <button type="submit" className="btn primary full">
            Register and open counselor portal
          </button>
        </form>

        <div className="auth-footer muted">
          Are you a student?
          <Link to="/"> Student registration</Link>
          {" · "}
          <Link to="/login?kind=counselor">Sign in</Link>
        </div>
        </div>
      </div>
    </EntryLayout>
  );
}
