import { Link, Navigate } from "react-router-dom";
import { useApi } from "../../ApiProvider.jsx";
import EntryLayout from "../../layouts/EntryLayout.jsx";
import SchoolBrandingPanel from "../../components/SchoolBrandingPanel.jsx";
import StudentRegisterForm from "../../components/StudentRegisterForm.jsx";

/** @param {string} role */
function homePathForRole(role) {
  if (role === "STUDENT") return "/app/student/home";
  if (role === "COUNSELOR") return "/app/counselor/desk";
  if (role === "ADMIN") return "/app/admin/dashboard";
  return "/";
}

export default function RegisterPage() {
  const { token, user } = useApi();

  if (token && !user)
    return (
      <EntryLayout>
        <div className="auth-page entry-auth-page">
          <p className="muted">Restoring session…</p>
        </div>
      </EntryLayout>
    );

  if (token && user) return <Navigate to={homePathForRole(user.role)} replace />;

  return (
    <EntryLayout>
      <div className="auth-page entry-auth-page auth-register-flow">
        <SchoolBrandingPanel />
        <Link className="auth-back muted" to="/">
          ← Back to home
        </Link>
        <StudentRegisterForm />
        <div className="auth-footer muted">
          Already have an account? <Link to="/login">Sign in</Link>
          {" · "}
          Counselor? <Link to="/register/counselor">Register here</Link>
        </div>
      </div>
    </EntryLayout>
  );
}
