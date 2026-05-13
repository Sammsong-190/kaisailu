/**
 * Express API origin without trailing slash. Empty → same-origin requests (local Vite `/api` proxy).
 * Deployed static sites must set `VITE_API_BASE_URL` at build time (e.g. Vercel env vars).
 *
 * Example: https://your-app.onrender.com
 *
 * @param {string} path Absolute path beginning with "/", e.g. "/api/state"
 */
export function apiUrl(path) {
  const p = path.startsWith("/") ? path : `/${path}`;
  const base = String(import.meta.env.VITE_API_BASE_URL || "").trim().replace(/\/+$/, "");
  return base === "" ? p : `${base}${p}`;
}
