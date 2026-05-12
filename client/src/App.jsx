import { Routes, Route, Navigate } from "react-router-dom";
import Landing from "./pages/Landing.jsx";
import LoginPage from "./pages/auth/LoginPage.jsx";
import RegisterPage from "./pages/auth/RegisterPage.jsx";
import CounselorRegisterPage from "./pages/auth/CounselorRegisterPage.jsx";
import AppChrome from "./pages/AppChrome.jsx";
import StudentRoutes from "./routes/StudentRoutes.jsx";
import CounselorRoutes from "./routes/CounselorRoutes.jsx";
import AdminRoutes from "./routes/AdminRoutes.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/register/counselor" element={<CounselorRegisterPage />} />
      <Route path="/app" element={<AppChrome />}>
        <Route path="student/*" element={<StudentRoutes />} />
        <Route path="counselor/*" element={<CounselorRoutes />} />
        <Route path="admin/*" element={<AdminRoutes />} />
        <Route index element={<Navigate to="/login" replace />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
