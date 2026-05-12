import { Navigate } from "react-router-dom";

/** Home is the single student registration entry; keep URL alias. */
export default function RegisterPage() {
  return <Navigate to="/" replace />;
}
