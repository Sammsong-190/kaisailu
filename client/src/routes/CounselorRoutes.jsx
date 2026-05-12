import { Routes, Route, Navigate, useParams, Link } from "react-router-dom";
import { useApi } from "../ApiProvider.jsx";
import CaseCard from "../components/CaseCard.jsx";
import CampusMetricsCharts from "../components/CampusMetricsCharts.jsx";
import { RequirePortalRole } from "../components/RequirePortalRole.jsx";

function reviewHref(c) {
  return `/app/counselor/review/${encodeURIComponent(c.caseId)}`;
}

function interventionHref(c) {
  return `/app/counselor/intervention/${encodeURIComponent(c.caseId)}`;
}

function Desk() {
  const { snapshot, api } = useApi();
  if (!snapshot) return <p className="muted">Loading workspace…</p>;
  const pending = snapshot.cases.filter((c) => c.reviewStatus === "pending").length;
  const byLevel = (lv) => snapshot.cases.filter((c) => c.level === lv);

  return (
    <>
      <div className="spa-stats">
        <div className="spa-stat">
          <b>{pending}</b>
          <span>Pending confirmation</span>
        </div>
        <div className="spa-stat">
          <b>{snapshot.cases.filter((c) => ["Level 1", "Level 2", "Level 3"].includes(c.decision)).length}</b>
          <span>Interventions started</span>
        </div>
        <div className="spa-stat">
          <b>{snapshot.caseArchive?.length ?? 0}</b>
          <span>Archived cases</span>
        </div>
      </div>
      <div className="flex-between spa-row">
        <h3>Alert desk · by signal level</h3>
        <button type="button" className="btn-sm accent" onClick={() => api.runDetection()}>
          Run detection
        </button>
      </div>
      <div className="risk-pools">
        {["High", "Medium", "Low"].map((lv) => (
          <div key={lv} className="risk-pool spa-card">
            <h4>{lv}</h4>
            <div className="case-grid case-grid-tight">
              {byLevel(lv).length === 0 ? (
                <div className="empty empty-inline">
                  <span className="muted">No open cases</span>
                </div>
              ) : (
                byLevel(lv).map((c) => (
                  <CaseCard
                    key={c.caseId}
                    c={c}
                    reviewPath={reviewHref(c)}
                    interventionPath={interventionHref(c)}
                    onApprove={() => api.approveCase(c.caseId)}
                    onDismiss={() => api.dismissCase(c.caseId)}
                    onTier={(tier) => api.setTier(c.caseId, tier).catch((e) => alert(e.message))}
                  />
                ))
              )}
            </div>
          </div>
        ))}
      </div>
      {snapshot.cases.some((c) => !["High", "Medium", "Low"].includes(c.level)) && (
        <div className="spa-card">
          <h4>Other levels</h4>
          <div className="case-grid">
            {snapshot.cases
              .filter((c) => !["High", "Medium", "Low"].includes(c.level))
              .map((c) => (
                <CaseCard
                  key={c.caseId}
                  c={c}
                  reviewPath={reviewHref(c)}
                  interventionPath={interventionHref(c)}
                  onApprove={() => api.approveCase(c.caseId)}
                  onDismiss={() => api.dismissCase(c.caseId)}
                  onTier={(tier) => api.setTier(c.caseId, tier).catch((e) => alert(e.message))}
                />
              ))}
          </div>
        </div>
      )}
    </>
  );
}

function formatTs(ts) {
  if (!ts) return "—";
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return String(ts);
  }
}

function TrackingPage() {
  const { snapshot } = useApi();
  if (!snapshot) return <p className="muted">Loading…</p>;
  const arch = snapshot.caseArchive || [];

  return (
    <>
      <h3>Case tracking sheet</h3>
      <p className="muted">Open cases from the latest detection plus workflow state, notes, and follow-ups.</p>
      <div className="case-table-wrap spa-card">
        <table className="case-table">
          <thead>
            <tr>
              <th>Case</th>
              <th>Student</th>
              <th>Level</th>
              <th>Review</th>
              <th>Decision</th>
              <th>Follow-up tag</th>
              <th>Notes / F/U</th>
              <th>Links</th>
            </tr>
          </thead>
          <tbody>
            {snapshot.cases.length === 0 ? (
              <tr>
                <td colSpan={8}>
                  <span className="muted">No open cases · run detection from the desk.</span>
                </td>
              </tr>
            ) : (
              snapshot.cases.map((c) => (
                <tr key={c.caseId}>
                  <td>
                    <code>{c.caseId}</code>
                  </td>
                  <td>{c.name}</td>
                  <td>{c.level}</td>
                  <td>{c.reviewStatus}</td>
                  <td>{c.decision}</td>
                  <td>{c.followUpLabel || "—"}</td>
                  <td>
                    {(c.counselorNotes || []).length} / {(c.followUps || []).length}
                  </td>
                  <td>
                    <Link className="link-subtle" to={reviewHref(c)}>
                      Review
                    </Link>
                    {" · "}
                    <Link className="link-subtle" to={interventionHref(c)}>
                      Intervention
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <h3 className="spa-row">Archive</h3>
      <p className="muted">Students cleared from detection or archived by counselors (demo).</p>
      <div className="case-table-wrap spa-card">
        <table className="case-table">
          <thead>
            <tr>
              <th>Case</th>
              <th>Student</th>
              <th>Closed</th>
              <th>Last decision</th>
              <th>Notes / F/U</th>
            </tr>
          </thead>
          <tbody>
            {arch.length === 0 ? (
              <tr>
                <td colSpan={5}>
                  <span className="muted">No archived cases yet.</span>
                </td>
              </tr>
            ) : (
              arch.map((c) => (
                <tr key={`${c.caseId}-${c.archivedAt}`}>
                  <td>
                    <code>{c.caseId}</code>
                  </td>
                  <td>{c.name}</td>
                  <td>{formatTs(c.archivedAt || c.closedAt)}</td>
                  <td>{c.decision}</td>
                  <td>
                    {(c.counselorNotes || []).length} / {(c.followUps || []).length}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

function TrendsPage() {
  const { snapshot, trend } = useApi();
  if (!snapshot) return <p className="muted">Loading…</p>;
  const timeline = snapshot.metrics?.timeline;

  return (
    <>
      <CampusMetricsCharts timeline={timeline} compact />
      <div className="spa-card">
        <h4>Stress vs wellbeing (illustrative)</h4>
        <div className="trend-chart">
          {(trend || []).map((d) => (
            <div key={d.w} className="trendCol">
              <div className="trendBars">
                <div className="trendBar stress" style={{ height: d.s * 1.55 }} />
                <div className="trendBar well" style={{ height: d.b * 1.55 }} />
              </div>
              <span>{d.w}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="spa-card">
        <h4>Current risk scores (enriched)</h4>
        <div className="bar-chart">
          {snapshot.students.map((s) => {
            const v = s.risk.score || 0;
            const hue =
              s.risk.level === "High"
                ? "red"
                : s.risk.level === "Medium"
                  ? "amber"
                  : s.risk.level === "Low"
                    ? "cyan"
                    : s.risk.level === "Blocked"
                      ? "gray"
                      : "greenB";
            return (
              <div key={s.id} className="barItem">
                <div className="barTrack">
                  <div className={`barFill ${hue}`} style={{ height: `${v}%` }} />
                </div>
                <span>{s.id.replace("S", "")}</span>
                <b>{v}</b>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

function StudentProfile() {
  const { id } = useParams();
  const { snapshot } = useApi();
  if (!snapshot) return null;
  const s = snapshot.students.find((x) => x.id === id);
  if (!s)
    return (
      <p className="muted">
        Student <code>{id}</code> not found.
      </p>
    );
  const openCases = snapshot.cases.filter((c) => c.studentId === id);
  const archCases = (snapshot.caseArchive || []).filter((c) => c.studentId === id);
  const checkins = snapshot.checkins?.[id] || [];

  return (
    <div className="spa-card">
      <h3>{s.name}</h3>
      <p className="muted">
        {s.id} · consent {s.consent ? "yes" : "no"}
      </p>
      <span className={`pill ${s.risk.tone}`}>
        {s.risk.level}
        {s.risk.score != null ? ` · ${s.risk.score}` : ""}
      </span>
      <h4>Behavioral inputs (demo)</h4>
      <div className="signal-grid">
        {[
          ["LMS activity", s.lms],
          ["Library visits", s.library],
          ["Dining", s.dining],
          ["Gym", s.gym],
          ["Stress (1–5)", s.stress],
          ["Sleep (h)", s.sleep],
          ["Social (1–10)", s.social],
        ].map(([k, v]) => (
          <div key={k} className="signal-chip">
            <b>{k}</b>
            {v}
          </div>
        ))}
      </div>
      <h4>Rule engine reasons</h4>
      <ul className="spa-list">
        {s.risk.reasons.map((r, i) => (
          <li key={i}>• {r}</li>
        ))}
      </ul>
      <h4>Open cases</h4>
      {openCases.length === 0 ? (
        <p className="muted">No open case for this student.</p>
      ) : (
        <ul className="spa-list">
          {openCases.map((c) => (
            <li key={c.caseId}>
              <Link className="link-subtle" to={reviewHref(c)}>
                {c.caseId}
              </Link>
              {" · "}
              {c.level} · {c.reviewStatus}
            </li>
          ))}
        </ul>
      )}
      <h4>Archived cases</h4>
      {archCases.length === 0 ? (
        <p className="muted">None.</p>
      ) : (
        <ul className="spa-list">
          {archCases.map((c) => (
            <li key={`${c.caseId}-a`}>
              {c.caseId} · {c.decision} · closed {formatTs(c.archivedAt || c.closedAt)}
            </li>
          ))}
        </ul>
      )}
      <h4>Recent check-ins</h4>
      {checkins.length === 0 ? (
        <p className="muted">No self-reports yet.</p>
      ) : (
        <ul className="checkin-list">
          {checkins.map((row, i) => (
            <li key={i}>
              <strong>{formatTs(row.t)}</strong> — stress {row.stress}, sleep {row.sleep}, mood {row.mood}
              {row.study ? ` · study: ${row.study}` : ""}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CaseReviewPage() {
  const { caseId } = useParams();
  const { snapshot, api } = useApi();
  if (!snapshot) return null;
  const cid = decodeURIComponent(caseId || "");
  const c = snapshot.cases.find((x) => x.caseId === cid);
  if (!c) return <p className="muted">Case not found (may be archived).</p>;

  return (
    <div className="spa-card">
      <h3>Review &amp; human confirmation</h3>
      <p className="muted">
        Confirm that the surfaced pattern merits a response path, or dismiss as a false positive. Tier selection lives in the intervention workspace so
        confirmation stays lightweight.
      </p>
      <div className="case-grid">
        <CaseCard
          c={c}
          interventionPath={interventionHref(c)}
          onApprove={() => api.approveCase(c.caseId)}
          onDismiss={() => api.dismissCase(c.caseId)}
          onTier={(tier) => api.setTier(c.caseId, tier).catch((e) => alert(e.message))}
          showTierSelection={false}
        />
      </div>
    </div>
  );
}

function InterventionPage() {
  const { caseId } = useParams();
  const { snapshot, api } = useApi();
  const cid = decodeURIComponent(caseId || "");
  if (!snapshot) return null;
  const c = snapshot.cases.find((x) => x.caseId === cid);
  if (!c)
    return (
      <p className="muted">
        Case not found or archived. See <Link to="/app/counselor/tracking">tracking</Link>.
      </p>
    );

  const nextWeek = ((c.followUps || []).length || 0) + 1;

  return (
    <div className="spa-card">
      <h3>Intervention &amp; follow-up</h3>
      <p className="muted">Choose tier after risk confirmation, log notes, record week-by-week effectiveness, archive when closed.</p>

      <div className="case-grid">
        <CaseCard
          c={c}
          reviewPath={reviewHref(c)}
          onApprove={() => api.approveCase(c.caseId)}
          onDismiss={() => api.dismissCase(c.caseId)}
          onTier={(tier) => api.setTier(c.caseId, tier).catch((e) => alert(e.message))}
        />
      </div>

      <div className="intervention-forms">
        <div className="field-row">
          <label className="field">
            Case note
            <textarea id="caseNoteBody" rows={3} placeholder="Visible to care team (demo store)" />
          </label>
          <button
            type="button"
            className="btn secondary"
            onClick={() => {
              const el = document.getElementById("caseNoteBody");
              const text = el?.value || "";
              api.addCaseNote(c.caseId, text).then(() => {
                if (el) el.value = "";
              });
            }}
          >
            Save note
          </button>
        </div>

        <h4>Counselor notes</h4>
        <ul className="spa-list">
          {(c.counselorNotes || []).length === 0 ? (
            <li className="muted">None yet.</li>
          ) : (
            (c.counselorNotes || []).map((n, i) => (
              <li key={i}>
                <strong>{formatTs(n.at)}</strong> — {n.text}
              </li>
            ))
          )}
        </ul>

        <h4>Log follow-up</h4>
        <div className="field-row">
          <label className="field">
            Week label
            <input type="text" id="fuWeek" defaultValue={`Week ${nextWeek}`} />
          </label>
          <label className="field">
            Effectiveness
            <select id="fuEff" defaultValue="steady">
              <option value="improving">Improving</option>
              <option value="steady">Steady</option>
              <option value="worsening">Worsening</option>
            </select>
          </label>
        </div>
        <label className="field">
          Notes
          <textarea id="fuNotes" rows={2} placeholder="Session summary, safeguards, guardian contact …" />
        </label>
        <button
          type="button"
          className="btn primary"
          onClick={() => {
            const week = document.getElementById("fuWeek")?.value || `Week ${nextWeek}`;
            const effectiveness = document.getElementById("fuEff")?.value || "steady";
            const notes = document.getElementById("fuNotes")?.value || "";
            api.addFollowUp(c.caseId, { weekLabel: week, effectiveness, notes }).then(() => {
              const n = document.getElementById("fuNotes");
              if (n) n.value = "";
            });
          }}
        >
          Record follow-up
        </button>

        <h4>Follow-up timeline</h4>
        <ul className="spa-list">
          {(c.followUps || []).length === 0 ? (
            <li className="muted">No entries yet.</li>
          ) : (
            (c.followUps || []).map((f, i) => (
              <li key={i}>
                <strong>{f.weekLabel}</strong> · {f.effectiveness} · {formatTs(f.recordedAt)}
                {f.notes ? <span> — {f.notes}</span> : null}
              </li>
            ))
          )}
        </ul>

        <button
          type="button"
          className="btn dismiss full"
          onClick={() => {
            if (window.confirm(`Archive ${c.caseId}? It moves to the tracking archive list.`)) api.archiveCase(c.caseId);
          }}
        >
          Archive case
        </button>
      </div>
    </div>
  );
}

export default function CounselorRoutes() {
  return (
    <Routes>
      <Route path="login" element={<Navigate to="/login?kind=counselor" replace />} />
      <Route element={<RequirePortalRole roles={["COUNSELOR"]} />}>
        <Route index element={<Navigate to="desk" replace />} />
        <Route path="desk" element={<Desk />} />
        <Route path="home" element={<Navigate to="../desk" replace />} />
        <Route path="tracking" element={<TrackingPage />} />
        <Route path="cases" element={<Navigate to="../tracking" replace />} />
        <Route path="trends" element={<TrendsPage />} />
        <Route path="student/:id" element={<StudentProfile />} />
        <Route path="review/:caseId" element={<CaseReviewPage />} />
        <Route path="intervention/:caseId" element={<InterventionPage />} />
        <Route path="*" element={<Navigate to="desk" replace />} />
      </Route>
    </Routes>
  );
}
