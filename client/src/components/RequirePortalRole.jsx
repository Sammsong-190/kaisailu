import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useApi } from "../ApiProvider.jsx";

/** @param {{ roles: string[] }} props */
export function RequirePortalRole({ roles }) {
  const location = useLocation();
  const { token, user } = useApi();

  if (!token) return <Navigate to="/login" replace state={{ from: location.pathname }} />;

  /* Token exists but `/api/auth/me` not yet hydrated (e.g. hard refresh). */
  if (!user && token) return <p className="muted">Restoring session…</p>;

  if (!roles.includes(user.role)) return <Navigate to="/login" replace state={{ from: location.pathname, wrongRole: true }} />;

  return <Outlet />;
}
