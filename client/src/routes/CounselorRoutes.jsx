import { Routes, Route, Navigate, useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useApi } from "../ApiProvider.jsx";
import CaseCard from "../components/CaseCard.jsx";
import AlertDeskCaseCard from "../components/AlertDeskCaseCard.jsx";
import HumanReviewPanel, { displayLevel } from "../components/HumanReviewPanel.jsx";
import AppointmentTableSection from "../components/AppointmentTableSection.jsx";
import CampusMetricsCharts from "../components/CampusMetricsCharts.jsx";
import { RequirePortalRole } from "../components/RequirePortalRole.jsx";
import CampusChatHub from "../components/CampusChatHub.jsx";
import { moodEmoji } from "../checkinUtils.js";
import { activeSharingHuman } from "../consentChannels.js";

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
            <div className="risk-pool-body">
              <div className="case-grid case-grid-tight">
                {byLevel(lv).length === 0 ? (
                  <div className="empty empty-inline">
                    <span className="muted">No open cases</span>
                  </div>
                ) : (
                  byLevel(lv).map((c) => (
                    <AlertDeskCaseCard
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
                <AlertDeskCaseCard
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

function AppointmentsPage() {
  const { snapshot } = useApi();
  if (!snapshot) return <p className="muted">Loading…</p>;
  const caseDisplayIds = snapshot.cases
    .map((c) => (typeof c.trackingCaseDisplayId === "string" ? c.trackingCaseDisplayId : ""))
    .filter(Boolean);
  return <AppointmentTableSection caseDisplayIds={caseDisplayIds} />;
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
  const { snapshot, api } = useApi();
  const [selectedCaseId, setSelectedCaseId] = useState(/** @type {string | null} */ (null));

  useEffect(() => {
    if (selectedCaseId && !snapshot?.cases?.some((x) => x.caseId === selectedCaseId)) setSelectedCaseId(null);
  }, [snapshot?.cases, selectedCaseId]);

  if (!snapshot) return <p className="muted">Loading…</p>;
  const arch = snapshot.caseArchive || [];
  const selected = snapshot.cases.find((x) => x.caseId === selectedCaseId) ?? null;

  return (
    <>
      <h3>Case tracking sheet</h3>
      <p className="muted">Open cases from detection — select a row to review the AI verdict and route next steps.</p>
      <div className="tracking-sheet-layout">
        <div className="case-table-wrap spa-card tracking-table-card">
          <div className="tracking-table-scroll">
            <table className="case-table tracking-case-table">
              <thead>
                <tr>
                  <th>Case</th>
                  <th>Level</th>
                  <th className="tracking-col-review">Review</th>
                  <th>Follow-up tag</th>
                </tr>
              </thead>
              <tbody>
                {snapshot.cases.length === 0 ? (
                  <tr>
                    <td colSpan={4}>
                      <span className="muted">No open cases · run detection from the desk.</span>
                    </td>
                  </tr>
                ) : (
                  snapshot.cases.map((c) => {
                    const id = typeof c.caseId === "string" ? c.caseId : "";
                    const label = typeof c.trackingCaseDisplayId === "string" ? c.trackingCaseDisplayId : id;
                    const brief = typeof c.aiReviewBrief === "string" ? c.aiReviewBrief : "—";
                    const tag = typeof c.riskCategory === "string" ? c.riskCategory : "—";
                    const active = selectedCaseId === id;
                    return (
                      <tr
                        key={id}
                        className={`case-tracking-row ${active ? "case-tracking-row-active" : ""}`}
                        onClick={() => setSelectedCaseId(id)}
                        onKeyDown={(ev) => {
                          if (ev.key === "Enter" || ev.key === " ") {
                            ev.preventDefault();
                            setSelectedCaseId(id);
                          }
                        }}
                        tabIndex={0}
                        role="button"
                        aria-pressed={active}
                        aria-label={`Open case ${label}`}
                      >
                        <td>
                          <code>{label}</code>
                        </td>
                        <td>
                          <span className={`tracking-level tracking-level-${String(c.level || "").toLowerCase()}`}>{displayLevel(c.level)}</span>
                        </td>
                        <td className="tracking-col-review">
                          <span className="tracking-review-snippet">{brief}</span>
                        </td>
                        <td>{tag}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <HumanReviewPanel c={selected} api={api} interventionPath={selected ? interventionHref(selected) : "#"} />
      </div>

      <h3 className="spa-row">Archive</h3>
      <p className="muted">Historical closures from your workflow.</p>
      <div className="case-table-wrap spa-card">
        <table className="case-table">
          <thead>
            <tr>
              <th>Case</th>
              <th>Closed</th>
              <th>Decision status</th>
            </tr>
          </thead>
          <tbody>
            {arch.length === 0 ? (
              <tr>
                <td colSpan={3}>
                  <span className="muted">No archived cases yet.</span>
                </td>
              </tr>
            ) : (
              arch.map((c) => (
                <tr key={`${c.caseId}-${c.archivedAt || c.closedAt || ""}`}>
                  <td>
                    <code>{typeof c.trackingCaseDisplayId === "string" ? c.trackingCaseDisplayId : c.caseId}</code>
                  </td>
                  <td>{formatTs(c.archivedAt || c.closedAt)}</td>
                  <td>{typeof c.decisionStatus === "string" ? c.decisionStatus : "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

/** @param {Record<string, unknown> | undefined} risk */
function parseNumericRiskField(risk, key) {
  const raw = risk?.[key];
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  if (typeof raw === "string" && raw.trim() !== "") {
    const n = Number(raw);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

/** interpolate bar color along 0–100: blue → red */
function counselorRiskScoreColor(score) {
  let t = Number(score);
  if (!Number.isFinite(t)) t = 0;
  t = Math.max(0, Math.min(1, t / 100));
  const r0 = 30;
  const g0 = 64;
  const b0 = 175;
  const r1 = 185;
  const g1 = 28;
  const b1 = 28;
  const r = Math.round(r0 + (r1 - r0) * t);
  const g = Math.round(g0 + (g1 - g0) * t);
  const bl = Math.round(b0 + (b1 - b0) * t);
  return `#${((1 << 24) + (r << 16) + (g << 8) + bl).toString(16).slice(1)}`;
}

/** Renders risk bar; widens almost-zero-width bars for score 0 so rows stay visible. */
function CounselorRiskBarShape(entry) {
  const { x = 0, y = 0, width = 0, height = 0, payload } = entry;
  const px = Number(x);
  const py = Number(y);
  const h = Number(height);
  const bw = Math.max(0, Number(width));
  const sc = Number(payload?.score);

  let w = bw;
  if (Number.isFinite(sc)) {
    if (sc <= 0) w = Math.max(w, 10);
    else if (w > 0 && w < 4) w = 4;
  }

  const fill = Number.isFinite(sc) ? counselorRiskScoreColor(sc) : "#94a3b8";
  return <rect x={px} y={py} width={w} height={h} rx={2} ry={2} fill={fill} />;
}

function TrendsPage() {
  const { snapshot, trend } = useApi();
  if (!snapshot) return <p className="muted">Loading…</p>;
  const timeline = snapshot.metrics?.timeline;

  const stressWellSeries = (Array.isArray(trend) && trend.length ? trend : [{ w: "—", s: 0, b: 0 }]).map((d) => ({
    week: d.w,
    stress: d.s,
    wellbeing: d.b,
  }));

  const riskRows = snapshot.students.map((s) => {
    const recorded = parseNumericRiskField(s.risk, "score");
    const hypothetical = parseNumericRiskField(s.risk, "hypotheticalScore");

    /** @type {"recorded" | "hypothetical" | "none"} */
    let scoreDisplaySource = "none";
    let score = 0;
    if (recorded !== null) {
      scoreDisplaySource = "recorded";
      score = recorded;
    } else if (hypothetical !== null) {
      scoreDisplaySource = "hypothetical";
      score = hypothetical;
    }

    return {
      id: s.id,
      studentLabel: s.id,
      score,
      scoreDisplaySource,
      level: typeof s.risk?.level === "string" ? s.risk.level : "—",
    };
  });

  const axisTick = { fontSize: 11, fill: "#64748b" };
  const axisLineStyle = { stroke: "#cbd5e1" };

  return (
    <>
      <CampusMetricsCharts timeline={timeline} compact />
      <div className="spa-card chart-card-compact counselor-trends-chart-card">
        <h4>Stress vs wellbeing (illustrative)</h4>
        <p className="muted tiny-help">Campus-wide indices on a shared 0–100 scale — week-over-week directional context only.</p>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={stressWellSeries} margin={{ top: 8, right: 12, left: 4, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="week" tick={axisTick} tickLine={{ stroke: "#cbd5e1" }} axisLine={axisLineStyle} />
            <YAxis domain={[0, 100]} tick={axisTick} tickLine={{ stroke: "#cbd5e1" }} axisLine={axisLineStyle} width={40} />
            <Tooltip
              formatter={(value, name) => [value, name === "stress" ? "Stress index" : "Wellbeing index"]}
              labelFormatter={(w) => `Week ${w}`}
              contentStyle={{ borderRadius: 6, border: "1px solid #e2e8f0", fontSize: 12 }}
            />
            <Legend
              formatter={(value) => (value === "stress" ? "Stress index" : "Wellbeing index")}
              wrapperStyle={{ fontSize: 12, paddingTop: 4 }}
            />
            <Bar dataKey="stress" name="stress" fill="#b45309" radius={[2, 2, 0, 0]} maxBarSize={32} />
            <Bar dataKey="wellbeing" name="wellbeing" fill="#1e5938" radius={[2, 2, 0, 0]} maxBarSize={32} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="spa-card chart-card-compact counselor-trends-chart-card">
        <h4>Current risk scores (enriched)</h4>
        <p className="muted tiny-help">
          Composite 0–100 with a blue→red ramp. Values come from recorded signals when streams are shared; otherwise the bar shows a hypothetical score (same rules, all streams on) so every student stays comparable—see tooltip.
        </p>
        {riskRows.length === 0 ? (
          <p className="muted">No roster students to chart.</p>
        ) : (
          <div className="counselor-risk-chart-wrap">
            <ResponsiveContainer width="100%" height={Math.min(560, Math.max(260, riskRows.length * 34))}>
              <BarChart layout="vertical" data={riskRows} margin={{ top: 8, right: 16, left: 4, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tick={axisTick} tickLine={{ stroke: "#cbd5e1" }} axisLine={axisLineStyle} />
                <YAxis type="category" dataKey="studentLabel" tick={axisTick} tickLine={false} axisLine={axisLineStyle} width={76} />
                <Tooltip
                  formatter={(_value, _name, props) => {
                    const p = props?.payload;
                    if (!p) return ["—", "Score"];
                    if (p.scoreDisplaySource === "hypothetical")
                      return [`${p.score} (hypothetical — no streams shared)`, "Counselor estimate"];
                    if (p.scoreDisplaySource === "none") return [`${p.score}`, "Score unavailable"];
                    return [`${p.score} (${p.level ?? "—"})`, "Score"];
                  }}
                  contentStyle={{ borderRadius: 6, border: "1px solid #e2e8f0", fontSize: 12 }}
                />
                <Bar dataKey="score" name="Risk score" barSize={14} shape={CounselorRiskBarShape} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
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
        {s.id} · streams: {activeSharingHuman(s)}
      </p>
      <span className={`pill ${s.risk.tone}`}>
        {s.risk.level}
        {s.risk.score != null ? ` · ${s.risk.score}` : ""}
      </span>
      <h4>Behavioral inputs</h4>
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
              <strong>{formatTs(row.t)}</strong> — <span aria-hidden>{moodEmoji(row.moodKey || "ok")}</span> {row.mood || row.moodKey} · stress{" "}
              {row.stress}, sleep {row.sleepQ != null ? `${row.sleepQ}/5` : `${row.sleep ?? "—"} h`},{" "}
              study {typeof row.study === "number" ? `${row.study}/5` : row.study ?? "—"}, move {row.physicalActivity ?? "—"}, social {row.socialLonely ?? "—"}
              {row.notes?.trim() ? ` · note: "${String(row.notes).trim().slice(0, 120)}${String(row.notes).length > 120 ? "…" : ""}"` : ""}
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
            <textarea id="caseNoteBody" rows={3} placeholder="Visible to care team" />
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
        <Route path="appointments" element={<AppointmentsPage />} />
        <Route path="cases" element={<Navigate to="../tracking" replace />} />
        <Route path="trends" element={<TrendsPage />} />
        <Route path="messages" element={<CampusChatHub mode="counselor" />} />
        <Route path="student/:id" element={<StudentProfile />} />
        <Route path="review/:caseId" element={<CaseReviewPage />} />
        <Route path="intervention/:caseId" element={<InterventionPage />} />
        <Route path="*" element={<Navigate to="desk" replace />} />
      </Route>
    </Routes>
  );
}
