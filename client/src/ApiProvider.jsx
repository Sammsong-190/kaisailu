import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { apiUrl } from "./apiUrl.js";

const STORAGE_KEY = "scwis_token";

const ApiCtx = createContext(null);

export function ApiProvider({ children }) {
  const [token, setTokenState] = useState(() => localStorage.getItem(STORAGE_KEY));
  const [user, setUser] = useState(null);
  const [snapshot, setSnapshot] = useState(null);
  const [trend, setTrend] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  const authHeaders = useMemo(
    () => (token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" }),
    [token],
  );

  const bareAuthHeaders = useMemo(() => (token ? { Authorization: `Bearer ${token}` } : {}), [token]);

  const setToken = useCallback((t) => {
    setTokenState(t);
    if (t) localStorage.setItem(STORAGE_KEY, t);
    else localStorage.removeItem(STORAGE_KEY);
  }, []);

  const refresh = useCallback(async () => {
    try {
      setErr(null);
      const headers = {};
      if (token) headers.Authorization = `Bearer ${token}`;
      const r = await fetch(apiUrl("/api/state"), { headers });
      const text = await r.text();
      if (!r.ok) throw new Error(text || r.statusText);
      const head = text.trimStart();
      if (head.startsWith("<")) {
        throw new Error(
          "Backend returned HTML, not JSON. Local: repo root `npm run dev`. Static host (e.g. Vercel): set `VITE_API_BASE_URL` to your deployed Express HTTPS origin (no trailing slash), then redeploy. See README.",
        );
      }
      setSnapshot(JSON.parse(text));
    } catch (e) {
      setErr(String(e.message));
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    refresh();
    fetch(apiUrl("/api/trend"))
      .then((r) => r.json())
      .then(setTrend)
      .catch(() => {});
  }, [refresh]);

  useEffect(() => {
    if (!token) {
      setUser(null);
      return;
    }
    let cancelled = false;
    fetch(apiUrl("/api/auth/me"), { headers: { Authorization: `Bearer ${token}` } })
      .then(async (r) => {
        if (!r.ok) throw new Error("session expired");
        return r.json();
      })
      .then((body) => {
        if (!cancelled) setUser(body.user);
      })
      .catch(() => {
        if (!cancelled) {
          setToken(null);
          setUser(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [token, setToken]);

  const applyAuthPayload = useCallback(
    /** @param {{ token: string, user?: object, snapshot?: object }} d */
    (d) => {
      setErr(null);
      if (d.token) setToken(d.token);
      if (d.user) setUser(d.user);
      if (d.snapshot) setSnapshot(d.snapshot);
      setLoading(false);
    },
    [setToken],
  );

  const mutate = useCallback(
    /** @returns {Promise<any>} */
    async (url, opts = {}) => {
      const { headers: extra = {}, ...rest } = opts;
      const isFormData = rest.body instanceof FormData;
      const headers = { ...(isFormData ? bareAuthHeaders : authHeaders), ...extra };
      if (isFormData) delete headers["Content-Type"];

      const r = await fetch(apiUrl(url), { ...rest, headers });
      const raw = await r.text();
      /** @type {Record<string, unknown>} */
      let data = {};
      try {
        if (raw) data = JSON.parse(raw);
      } catch {
        data = {};
        if (raw.trimStart().startsWith("<")) {
          throw new Error(
            "Backend returned HTML, not JSON. Set `VITE_API_BASE_URL` on the front-end build host, wait for APIs to wake up if serverless sleeps, see README.",
          );
        }
      }
      if (!r.ok) {
        const msgFromJson = typeof data.error === "string" ? data.error : "";
        if (r.status === 404)
          throw new Error(
            msgFromJson ||
              "404: No backend on this origin. Use `npm run dev` locally, or set VITE_API_BASE_URL to your deployed API and rebuild.",
          );
        throw new Error(msgFromJson || raw.trim().slice(0, 280) || r.statusText);
      }
      return data;
    },
    [authHeaders, bareAuthHeaders],
  );

  /** @typedef {{ id: string; email: string; displayName: string; role: string; studentProfileId: string | null }} PublicUser */

  const api = useMemo(
    () => ({
      token,
      user,
      setToken,
      applyAuthPayload,
      refresh,
      login: async (email, password) => {
        const data = await mutate("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
        applyAuthPayload(data);
        return data;
      },
      registerStudent: async (body) => {
        const data = await mutate("/api/auth/register", {
          method: "POST",
          body: JSON.stringify({ ...body, role: "STUDENT" }),
        });
        applyAuthPayload(data);
        return data;
      },
      registerCounselor: async (body) => {
        const data = await mutate("/api/auth/register", {
          method: "POST",
          body: JSON.stringify({ ...body, role: "COUNSELOR" }),
        });
        applyAuthPayload(data);
        return data;
      },
      logout: async () => {
        if (!token) {
          try {
            await fetch(apiUrl("/api/session/student"), {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ studentId: null }),
            });
          } catch {}
        }
        setToken(null);
        setUser(null);
      },
      setStudentSession: (studentId) =>
        mutate("/api/session/student", { method: "POST", body: JSON.stringify({ studentId }) }).then(setSnapshot),
      toggleConsent: (id) => mutate(`/api/consent/${id}/toggle`, { method: "POST" }).then(setSnapshot),
      patchMeDataSharing: (patch) => mutate("/api/me/data-sharing", { method: "PATCH", body: JSON.stringify(patch) }).then(setSnapshot),
      updateStudent: (id, patch) => mutate(`/api/students/${id}`, { method: "PATCH", body: JSON.stringify(patch) }).then(setSnapshot),
      checkin: (body) => mutate("/api/checkins", { method: "POST", body: JSON.stringify(body) }).then(setSnapshot),
      runDetection: () => mutate("/api/detection/run", { method: "POST" }).then(setSnapshot),
      approveCase: (caseId) => mutate(`/api/cases/${encodeURIComponent(caseId)}/approve`, { method: "POST" }).then(setSnapshot),
      dismissCase: (caseId) => mutate(`/api/cases/${encodeURIComponent(caseId)}/dismiss`, { method: "POST" }).then(setSnapshot),
      setTier: (caseId, tier) =>
        mutate(`/api/cases/${encodeURIComponent(caseId)}/tier`, { method: "POST", body: JSON.stringify({ tier }) }).then(setSnapshot),
      addCaseNote: (caseId, text) =>
        mutate(`/api/cases/${encodeURIComponent(caseId)}/notes`, { method: "POST", body: JSON.stringify({ text }) }).then(setSnapshot),
      addFollowUp: (caseId, payload) =>
        mutate(`/api/cases/${encodeURIComponent(caseId)}/follow-up`, { method: "POST", body: JSON.stringify(payload || {}) }).then(setSnapshot),
      archiveCase: (caseId) =>
        mutate(`/api/cases/${encodeURIComponent(caseId)}/archive`, { method: "POST" }).then(setSnapshot),
      patchSettings: (patch) => mutate("/api/settings", { method: "PATCH", body: JSON.stringify(patch) }).then(setSnapshot),
      reset: () => mutate("/api/reset", { method: "POST" }).then(setSnapshot),
      addStaff: () => mutate("/api/staff/placeholder", { method: "POST" }).then(setSnapshot),
      submitBooking: (body) =>
        mutate("/api/bookings", { method: "POST", body: JSON.stringify(body || {}) }).then(setSnapshot),
      sendCampusChat: (payload) =>
        mutate("/api/chat/send", { method: "POST", body: JSON.stringify(payload || {}) }).then(setSnapshot),
      listUsers: async () => {
        const r = await fetch(apiUrl("/api/admin/users"), { headers: { ...bareAuthHeaders } });
        const data = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(data.error || r.statusText);
        return data.users;
      },
      patchUser: async (id, patch) => {
        const r = await fetch(apiUrl(`/api/admin/users/${encodeURIComponent(id)}`), {
          method: "PATCH",
          headers: { ...authHeaders },
          body: JSON.stringify(patch),
        });
        const data = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(data.error || r.statusText);
        return /** @type {PublicUser} */ (data.user);
      },
      importCsv: async (file) => {
        const fd = new FormData();
        fd.append("file", file);
        const r = await fetch(apiUrl("/api/import/csv"), {
          method: "POST",
          headers: bareAuthHeaders,
          body: fd,
        });
        const data = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(data.error || "Import failed");
        setSnapshot(data);
      },
      downloadTemplate: () => {
        const row =
          "student_id,name,consent,lms_activity,library_visits,dining_count,gym_visits,self_report_stress,sleep_hours,social_activity\n" +
          "S2001,Jamie Lin,true,86,5,12,3,2,7.1,7\n";
        const b = new Blob([row], { type: "text/csv" });
        const u = URL.createObjectURL(b);
        const a = Object.assign(document.createElement("a"), { href: u, download: "scwis_template.csv" });
        a.click();
        URL.revokeObjectURL(u);
      },
    }),
    [token, user, mutate, refresh, bareAuthHeaders, authHeaders, setToken, applyAuthPayload],
  );

  return <ApiCtx.Provider value={{ snapshot, trend, loading, err, api, token, user }}>{children}</ApiCtx.Provider>;
}

export function useApi() {
  const v = useContext(ApiCtx);
  if (!v) throw new Error("useApi outside provider");
  return v;
}
