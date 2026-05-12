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
      <div className="scwis-flow-layer" aria-hidden>
        <span className="scwis-flow-orb scwis-flow-orb-a" />
        <span className="scwis-flow-orb scwis-flow-orb-b" />
        <span className="scwis-flow-orb scwis-flow-orb-c" />
      </div>

      <nav className="topnav landing-topnav">
        <Link className="logo" to="/">
          <span className="logo-mark">◇</span>SCWIS
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
              <Link className="btn nav-pill dark" to="/login">
                Admin sign in
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
          <span className="eyebrow">React + Express demo</span>
          <h1>
            Behavioral signals → <span className="grad">counselor review</span> → tiered care
          </h1>
          <p className="lead">
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

      <section id="roles" className="section-pad role-cards-grid">
        <div className="section-head-inline">
          <span className="eyebrow darkbg">Three portals</span>
          <h2>Powered by REST</h2>
        </div>
        <div className="role-cards">
          <article className="role-card card-glass">
            <div className="role-icon emerald">S</div>
            <h3>Student</h3>
            <p>Consent, check-ins, non-diagnostic report, booking placeholder.</p>
            {!authenticated ? (
              <Link className="btn primary full" to="/register">
                Register
              </Link>
            ) : user.role === "STUDENT" ? (
              <Link className="btn primary full" to="/app/student/home">
                Open student portal
              </Link>
            ) : (
              <p className="muted tiny-help">Switch account to register or use the student portal as a student.</p>
            )}
          </article>
          <article className="role-card card-glass featured">
            <div className="role-icon amber">C</div>
            <h3>Counselor</h3>
            <p>Confirm or dismiss alerts, then choose Level 1–3.</p>
            {!authenticated ? (
              <Link className="btn primary full" to="/register/counselor">
                Counselor registration
              </Link>
            ) : user.role === "COUNSELOR" ? (
              <Link className="btn primary full" to="/app/counselor/desk">
                Open counselor desk
              </Link>
            ) : (
              <p className="muted tiny-help">Counselors: sign out above to register another role or open the counselor sign-in screen.</p>
            )}
          </article>
          <article className="role-card card-glass">
            <div className="role-icon violet">A</div>
            <h3>Admin</h3>
            <p>Thresholds, CSV import, audit log excerpt.</p>
            {!authenticated ? (
              <Link className="btn secondary full" to="/login">
                Admin sign in
              </Link>
            ) : user.role === "ADMIN" ? (
              <Link className="btn primary full" to="/app/admin/dashboard">
                Open admin console
              </Link>
            ) : (
              <p className="muted tiny-help">Admins sign in with a seeded admin account.</p>
            )}
          </article>
        </div>
      </section>

      <footer className="site-footer">
        <p>React (Vite) · Express · CORS proxy in dev (`/api` → `:8788`)</p>
      </footer>
    </div>
  );
}
