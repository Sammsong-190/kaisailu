import { Link, useNavigate } from "react-router-dom";
import { useApi } from "../ApiProvider.jsx";

/** @param {string} role */
function portalPathForRole(role) {
  if (role === "STUDENT") return "/app/student/home";
  if (role === "COUNSELOR") return "/app/counselor/desk";
  if (role === "ADMIN") return "/app/admin/dashboard";
  return "/app/student/home";
}

export default function Landing() {
  const navigate = useNavigate();
  const { snapshot, loading, err, user, token, api } = useApi();
  const authenticated = Boolean(token && user);

  const cons = snapshot ? snapshot.students.filter((s) => s.consent).length : "—";
  const total = snapshot?.students?.length ?? 6;
  const flagged = snapshot ? snapshot.students.filter((s) => s.risk.score != null && s.risk.score >= snapshot.settings.medium).length : "—";
  const reviewed = snapshot ? snapshot.cases.filter((c) => c.reviewStatus === "approved" || c.reviewStatus === "dismissed").length : "—";

  const portalPath = user ? portalPathForRole(user.role) : null;

  const signOut = async () => {
    await api.logout();
    navigate("/", { replace: true });
  };

  return (
    <div className="landing landing-home">
      <div className="scwis-flow-layer" aria-hidden />

      <nav className="topnav landing-topnav">
        <Link className="logo logo-with-emblem" to="/">
          <img src="/branding/bnbu-emblem.png" alt="" className="logo-emblem-img" decoding="async" loading="lazy" aria-hidden />
          SCWIS
        </Link>
        <div className="nav-cta">
          {authenticated ? (
            <>
              <span className="landing-nav-user muted">{user.displayName || user.email}</span>
              <Link className="btn nav-pill dark" to={portalPath}>
                Open portal
              </Link>
              <button type="button" className="btn ghost nav-signout-btn" onClick={signOut}>
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link className="ghost-link" to="/login">
                Sign in
              </Link>
              <Link className="ghost-link" to="/register">
                Student registration
              </Link>
              <Link className="ghost-link" to="/register/counselor">
                Counselor registration
              </Link>
            </>
          )}
        </div>
      </nav>

      {err ? (
        <div className="banner-err" role="alert">
          {err}
        </div>
      ) : null}

      <section id="overview" className="hero">
        <div className="hero-copy">
          <span className="eyebrow">Student wellness intelligence</span>
          <h1>
            Behavioral signals → <span className="grad">counselor review</span> → tiered care
          </h1>
          <p className="lead landing-lead-script">
            SCWIS surfaces explainable risk hints. Intervention tiers unlock only after a counselor confirms the signal — the API never executes care on its own.
          </p>
          <div className="actions-row">
            {authenticated ? (
              <>
                <Link className="btn primary" to={portalPath}>
                  Continue to your workspace
                </Link>
                <button type="button" className="btn secondary" onClick={signOut}>
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link className="btn primary" to="/register">
                  Student registration
                </Link>
                <Link className="btn secondary" to="/register/counselor">
                  Counselor registration
                </Link>
                <Link className="btn ghost nav-pill" to="/login">
                  Sign in
                </Link>
              </>
            )}
          </div>
          <div className="stats-row">
            <div className="stat-card">
              <h2>{loading ? "…" : `${cons}/${total}`}</h2>
              <p>Consented students</p>
            </div>
            <div className="stat-card">
              <h2>{loading ? "…" : flagged}</h2>
              <p>Risk tier ≥ medium</p>
            </div>
            <div className="stat-card">
              <h2>{loading ? "…" : reviewed}</h2>
              <p>Cases reviewed / dismissed</p>
            </div>
          </div>
        </div>
      </section>

      <section id="workflow" className="section-pad landing-flow-section">
        <div className="section-head-inline">
          <span className="eyebrow darkbg">Workflow</span>
          <h2>Signals assist — people decide</h2>
          <p className="muted section-lead-narrow">
            Campus-facing cues roll up into counselor-readable hints. Nothing escalates automatically; tiers unlock only after someone on staff takes action.
          </p>
        </div>
        <div className="landing-flow-grid">
          <article className="flow-stage card-glass">
            <span className="flow-num">1</span>
            <h3>Observe &amp; explain</h3>
            <p className="muted">Behavioral proxies feed a transparent scorecard so rationale stays inspectable.</p>
          </article>
          <article className="flow-stage card-glass">
            <span className="flow-num">2</span>
            <h3>Human review gate</h3>
            <p className="muted">Queues surface anomalies; counselors confirm or dismiss before any intervention path is suggested.</p>
          </article>
          <article className="flow-stage card-glass">
            <span className="flow-num">3</span>
            <h3>Tiered follow-up</h3>
            <p className="muted">Levels 1–3 reflect intensity — from tailored resources through direct outreach — under counselor direction.</p>
          </article>
        </div>
      </section>

      <footer className="site-footer">
        <p>React (Vite) · Express · CORS proxy in dev (`/api` → `:8788`)</p>
      </footer>
    </div>
  );
}
