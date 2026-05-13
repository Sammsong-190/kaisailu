import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useApi } from "../ApiProvider.jsx";
import StudentPresencePicker from "../components/StudentPresencePicker.jsx";
import {
  IconOverview,
  IconCheckIn,
  IconConsent,
  IconWellnessReport,
  IconSupport,
  IconCalendar,
  IconEnvelope,
  IconEmergency,
} from "../components/StudentNavIcons.jsx";

const STUDENT_OVERVIEW_LINK = { path: "home", label: "Overview", Icon: IconOverview };

const STUDENT_WELLNESS_BLOCK = [
  { path: "checkin", label: "Check-in", Icon: IconCheckIn },
  { path: "consent", label: "Consent & data privacy", Icon: IconConsent },
  { path: "report", label: "My wellness report", Icon: IconWellnessReport },
  { path: "resources", label: "Support resources", Icon: IconSupport },
  { path: "booking", label: "Book counselling", Icon: IconCalendar },
  { path: "message", label: "Message", Icon: IconEnvelope },
  { path: "emergency", label: "Emergency", Icon: IconEmergency },
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

function StudentSidebarNav({ base }) {
  const { path: ovPath, label: ovLabel, Icon: OvIcon } = STUDENT_OVERVIEW_LINK;
  return (
    <>
      <NavLink key={ovPath} className={({ isActive }) => `spa-nav spa-nav-has-icon ${isActive ? "spa-nav-active" : ""}`} to={`${base}/${ovPath}`}>
        <span className="spa-nav-icon" aria-hidden>
          <OvIcon />
        </span>
        <span className="spa-nav-label">{ovLabel}</span>
      </NavLink>
      <div className="spa-nav-section" role="presentation">
        <span className="spa-nav-section-title">Wellness & support</span>
      </div>
      {STUDENT_WELLNESS_BLOCK.map(({ path, label, Icon }) => (
        <NavLink key={path} className={({ isActive }) => `spa-nav spa-nav-has-icon ${isActive ? "spa-nav-active" : ""}`} to={`${base}/${path}`}>
          <span className="spa-nav-icon" aria-hidden>
            <Icon />
          </span>
          <span className="spa-nav-label">{label}</span>
        </NavLink>
      ))}
    </>
  );
}

export default function AppChrome() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { snapshot, api, user, token } = useApi();
  const portal = pathname.split("/")[2] || "student";
  let title = "Student";
  let showStudentPresence = portal === "student";
  let navContent;

  if (portal === "counselor") {
    title = "Counselor";
    showStudentPresence = false;
    const base = `/app/${portal}`;
    navContent = COUNSELOR_LINKS.map((item) => (
      <NavLink key={item.path} className={({ isActive }) => `spa-nav ${isActive ? "spa-nav-active" : ""}`} to={`${base}/${item.path}`}>
        {item.label}
      </NavLink>
    ));
  } else if (portal === "admin") {
    title = "Admin";
    showStudentPresence = false;
    const base = `/app/${portal}`;
    navContent = ADMIN_LINKS.map((pair) => {
      const slug = pair[0];
      const label = pair[1];
      return (
        <NavLink key={slug} className={({ isActive }) => `spa-nav ${isActive ? "spa-nav-active" : ""}`} to={`${base}/${slug}`}>
          {label}
        </NavLink>
      );
    });
  } else {
    const base = `/app/student`;
    navContent = <StudentSidebarNav base={base} />;
  }

  return (
    <div className="app-root">
      <aside className="sidebar">
        <div className="spa-brand">
          <img src="/branding/bnbu-emblem.png" alt="" className="spa-brand-emblem" width={28} height={28} decoding="async" aria-hidden />
          SCWIS
        </div>
        <nav className="spa-side-nav">{navContent}</nav>
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
          <div className="app-header-actions">
            {showStudentPresence ? <StudentPresencePicker /> : null}
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
          </div>
        </header>
        <main className="app-stage">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
