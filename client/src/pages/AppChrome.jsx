import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useApi } from "../ApiProvider.jsx";

const STUDENT_LINKS = [
  ["home", "Overview"],
  ["checkin", "Check-in"],
  ["consent", "Consent"],
  ["report", "My report"],
  ["resources", "Resources"],
  ["booking", "Book counseling"],
  ["emergency", "Emergency"],
];

const COUNSELOR_LINKS = [
  { path: "desk", label: "Alert desk" },
  { path: "tracking", label: "Case tracking" },
  { path: "trends", label: "Campus trends" },
  { path: "student/S1002", label: "Student profile (demo)" },
];

const ADMIN_LINKS = [
  ["dashboard", "Dashboard"],
  ["users", "Users"],
  ["settings", "Settings"],
  ["audit", "Audit log"],
  ["trust", "Trust center"],
];

export default function AppChrome() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { snapshot, api, user, token } = useApi();
  const portal = pathname.split("/")[2] || "student";
  let links = STUDENT_LINKS;
  let title = "Student";
  if (portal === "counselor") {
    links = COUNSELOR_LINKS;
    title = "Counselor";
  }
  if (portal === "admin") {
    links = ADMIN_LINKS;
    title = "Admin";
  }

  const base = `/app/${portal}`;

  return (
    <div className="app-root">
      <aside className="sidebar">
        <div className="spa-brand">
          <span>◇</span> SCWIS
        </div>
        <nav className="spa-side-nav">
          {links.map((item) => {
            const slug = Array.isArray(item) ? item[0] : item.path;
            const label = Array.isArray(item) ? item[1] : item.label;
            return (
              <NavLink key={slug} className={({ isActive }) => `spa-nav ${isActive ? "spa-nav-active" : ""}`} to={`${base}/${slug}`}>
                {label}
              </NavLink>
            );
          })}
        </nav>
        <div className="spa-side-foot">
          <NavLink className="spa-nav ghost" to="/">
            ← Home
          </NavLink>
        </div>
      </aside>
      <div className="app-main">
        <header className="app-header app-header-row">
          <div>
            <h1>{title} portal</h1>
            <p className="muted">
              Privacy-first · human-in-the-loop · no automated intervention
              {user ? (
                <>
                  {" "}
                  · <span className="auth-user-chip">{user.displayName || user.email}</span> ({user.role})
                </>
              ) : null}
              {!user && snapshot?.session?.studentId ? (
                <>
                  {" "}
                  · <span className="muted">Guest profile {snapshot.session.studentId}</span>
                </>
              ) : null}
            </p>
          </div>
          {(token || (!token && snapshot?.session?.studentId)) && (
            <button
              type="button"
              className="btn ghost btn-sm-spa"
              onClick={async () => {
                await api.logout();
                navigate("/");
              }}
            >
              Sign out
            </button>
          )}
        </header>
        <main className="app-stage">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
