import { Routes, Route, Navigate } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import { useApi } from "../ApiProvider.jsx";
import CampusMetricsCharts from "../components/CampusMetricsCharts.jsx";
import { RequirePortalRole } from "../components/RequirePortalRole.jsx";

function Dashboard() {
  const { snapshot, api } = useApi();
  const [csvPickLabel, setCsvPickLabel] = useState("No file selected.");
  const [resetNotice, setResetNotice] = useState("");

  if (!snapshot) return <p className="muted">Loading…</p>;
  const flagged = snapshot.students.filter((s) => s.risk.score != null && s.risk.score >= snapshot.settings.medium);
  return (
    <>
      <div className="spa-stats">
        <div className="spa-stat">
          <b>{snapshot.students.length}</b>
          <span>Records</span>
        </div>
        <div className="spa-stat">
          <b>{flagged.length}</b>
          <span>≥ medium threshold</span>
        </div>
        <div className="spa-stat">
          <b>{snapshot.cases.filter((c) => c.reviewStatus === "pending").length}</b>
          <span>Signals awaiting counselor</span>
        </div>
      </div>
      <CampusMetricsCharts timeline={snapshot.metrics?.timeline} />
      <div className="spa-card">
        <h4>CSV import · detection</h4>
        <div className="upload-zone">
          <p className="muted upload-zone-intro">
            Upload roster data as comma-separated CSV. Sent as multipart POST to <code>/api/import/csv</code>.
          </p>
          <div className="csv-file-row">
            <label className="btn secondary csv-browse-inline">
              Browse for CSV…
              <input
                type="file"
                accept=".csv,text/csv,text/comma-separated-values"
                className="csv-input-overlay"
                aria-label="Browse for CSV file"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  e.target.value = "";
                  if (!f) return;
                  setCsvPickLabel(`${f.name} · importing…`);
                  try {
                    await api.importCsv(f);
                    setCsvPickLabel(`${f.name} · imported`);
                  } catch (er) {
                    setCsvPickLabel(`${f.name} · failed`);
                    alert(String(er?.message || er));
                  }
                }}
              />
            </label>
            <span className="muted csv-pick-caption">{csvPickLabel}</span>
          </div>
        </div>
        <button type="button" className="btn full" onClick={() => api.downloadTemplate()}>
          Download CSV template
        </button>
        <button type="button" className="btn primary full" onClick={() => api.runDetection()}>
          Run AI detection
        </button>
        <button
          type="button"
          className="btn ghost full"
          onClick={async () => {
            try {
              setResetNotice("");
              await api.reset();
              setResetNotice("系统已恢复默认数据与初始配置。");
              window.scrollTo({ top: 0, behavior: "smooth" });
            } catch (er) {
              alert(String(er?.message || er));
            }
          }}
        >
          Restore default data
        </button>
        {resetNotice ? (
          <p className="admin-reset-done" role="status">
            {resetNotice}
          </p>
        ) : null}
      </div>
    </>
  );
}

function UsersPage() {
  const { snapshot, api, user: me } = useApi();
  const [users, setUsers] = useState([]);
  const [err, setErr] = useState("");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ displayName: "", email: "", role: "STUDENT", studentProfileId: "", password: "" });

  const load = useCallback(() => {
    setErr("");
    return api.listUsers().then(setUsers).catch((e) => setErr(e.message || "Failed to load users"));
  }, [api]);

  useEffect(() => {
    load();
  }, [load]);

  const campusIds = snapshot?.students?.map((s) => s.id) ?? [];

  const beginEdit = (u) => {
    setEditing(u.id);
    setForm({
      displayName: u.displayName || "",
      email: u.email || "",
      role: u.role || "STUDENT",
      studentProfileId: u.studentProfileId || "",
      password: "",
    });
  };

  const save = async () => {
    try {
      setErr("");
      const patch = {
        displayName: form.displayName,
        email: form.email,
        role: form.role,
        studentProfileId: form.role === "STUDENT" ? form.studentProfileId : "",
        ...(form.password ? { password: form.password } : {}),
      };
      await api.patchUser(editing, patch);
      await load();
      setEditing(null);
    } catch (e) {
      setErr(String(e.message || "Save failed"));
    }
  };

  if (!snapshot) return null;

  return (
    <>
      <div className="spa-card">
        <h3>Registered users (Prisma)</h3>
        <p className="muted">Edit email, display name, role, linked student ID, and optionally reset password.</p>
        {me ? (
          <p className="tiny-help muted">
            Signed in as <strong>{me.email}</strong> ({me.role})
          </p>
        ) : null}
        {err ? <div className="banner-err inline-banner">{err}</div> : null}

        <div className="case-table-wrap">
          <table className="case-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Name</th>
                <th>Role</th>
                <th>Student ID</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.email}</td>
                  <td>{u.displayName}</td>
                  <td>{u.role}</td>
                  <td>{u.studentProfileId || "—"}</td>
                  <td>
                    <button type="button" className="btn-sm accent" onClick={() => beginEdit(u)}>
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {editing ? (
          <div className="spa-card edit-user-panel">
            <h4>Edit user</h4>
            <div className="settings-form">
              <label className="field">
                Display name
                <input type="text" value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} />
              </label>
              <label className="field">
                Email
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </label>
              <label className="field">
                Role
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                  <option value="STUDENT">STUDENT</option>
                  <option value="COUNSELOR">COUNSELOR</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </label>
              {form.role === "STUDENT" ? (
                <label className="field">
                  Linked student ID
                  <select value={form.studentProfileId} onChange={(e) => setForm({ ...form, studentProfileId: e.target.value })}>
                    <option value="">Select…</option>
                    {campusIds.map((id) => (
                      <option key={id} value={id}>
                        {id}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
              <label className="field">
                New password (leave blank to keep current)
                <input type="password" autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              </label>
              <div className="flex-between">
                <button type="button" className="btn primary" onClick={save}>
                  Save
                </button>
                <button type="button" className="btn ghost" onClick={() => setEditing(null)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <div className="spa-card">
        <h3>Counselor roster</h3>
        <ul className="spa-list">
          {snapshot.staff.map((u) => (
            <li key={u.id}>
              <strong>{u.name}</strong> — {u.role}
              {u.title ? <span className="muted tiny-help"> · {u.title}</span> : null}
              {u.department ? (
                <>
                  <br />
                  <span className="muted tiny-help">{u.department}</span>
                </>
              ) : null}
            </li>
          ))}
        </ul>
        <button type="button" className="btn secondary" onClick={() => api.addStaff()}>
          Add placeholder staff
        </button>
      </div>
    </>
  );
}

function SettingsPage() {
  const { snapshot, api } = useApi();
  if (!snapshot) return null;
  return (
    <div className="spa-card settings-form">
      <h3>Thresholds · retention</h3>
      <label className="field">
        High threshold
        <input type="number" id="adHi" defaultValue={snapshot.settings.high} />
      </label>
      <label className="field">
        Medium threshold
        <input type="number" id="adMd" defaultValue={snapshot.settings.medium} />
      </label>
      <label className="field">
        Retention (days)
        <input type="number" id="adRet" defaultValue={snapshot.settings.retentionDays} />
      </label>
      <button
        type="button"
        className="btn primary"
        onClick={() => {
          const hi = document.getElementById("adHi");
          const md = document.getElementById("adMd");
          const ret = document.getElementById("adRet");
          api.patchSettings({
            high: Number(hi?.value || 80),
            medium: Number(md?.value || 55),
            retentionDays: Number(ret?.value || 365),
          });
        }}
      >
        Save
      </button>
    </div>
  );
}

function AuditPage() {
  const { snapshot } = useApi();
  if (!snapshot) return null;
  return (
    <div className="spa-card audit-card-dark">
      <div className="full-log">{snapshot.logs.map((l, i) => wrapLog(l, i))}</div>
    </div>
  );
}

function wrapLog(line, key) {
  return (
    <div key={key} className="log-line">
      {line}
    </div>
  );
}

function TrustPage() {
  return (
    <div className="spa-card">
      <h3>Trust center</h3>
      <ul className="spa-list">
        <li>Express API has no unattended intervention pathway.</li>
        <li>Consent gated rules live in shared `riskEngine` module.</li>
        <li>Counselor confirm required before tiers.</li>
      </ul>
    </div>
  );
}

export default function AdminRoutes() {
  return (
    <Routes>
      <Route element={<RequirePortalRole roles={["ADMIN"]} />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="audit" element={<AuditPage />} />
        <Route path="trust" element={<TrustPage />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Route>
    </Routes>
  );
}
