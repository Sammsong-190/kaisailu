import { Routes, Route, Navigate } from "react-router-dom";
import { useApi } from "../ApiProvider.jsx";
import { RequirePortalRole } from "../components/RequirePortalRole.jsx";
import StudentWellnessCharts from "../components/StudentWellnessCharts.jsx";
import StudentCheckinForm from "../components/StudentCheckinForm.jsx";
import { moodEmoji } from "../checkinUtils.js";
import StudentConsentPanel from "../components/StudentConsentPanel.jsx";
import StudentOverviewWellnessTrend from "../components/StudentOverviewWellnessTrend.jsx";
import StudentSupportHub from "../components/StudentSupportHub.jsx";
import StudentBookingConsole from "../components/StudentBookingConsole.jsx";
import CampusChatHub from "../components/CampusChatHub.jsx";

function Overview() {
  const { snapshot, trend } = useApi();
  if (!snapshot) return null;
  const sid = snapshot.session.studentId;
  const s = snapshot.students.find((x) => x.id === sid);
  if (!s) return <p className="muted">No linked student profile found.</p>;
  const checkinEntries = snapshot.checkins[sid] || [];
  return (
    <>
      <div className="student-overview-row">
        <div className="spa-card">
          <h2>Hi, {s.name}</h2>
          <span className={`pill ${s.risk.tone}`}>
            {!s.consent ? "Consent blocked" : `${s.risk.level}${s.risk.score != null ? ` · ${s.risk.score}` : ""}`}
          </span>
        </div>
        <div className="spa-card">
          <h4>Today</h4>
          <ul className="spa-list">
            <li>Check-in mood & stress</li>
            <li>Review consent settings</li>
            <li>Resources if overwhelmed</li>
          </ul>
        </div>
      </div>
      <div className="student-wellness-overview-stack">
        <StudentWellnessCharts student={s} checkins={checkinEntries} trend={trend} showCampusTrend />
        <StudentOverviewWellnessTrend student={s} checkins={checkinEntries} />
      </div>
    </>
  );
}

function Checkin() {
  const { snapshot, api } = useApi();
  if (!snapshot) return null;
  const sid = snapshot.session.studentId;
  const s = snapshot.students.find((x) => x.id === sid);
  if (!s) return null;

  return (
    <>
      <StudentCheckinForm studentId={sid} student={s} api={api} />
      <div className="spa-card">
        <h4>Recent</h4>
        <CheckinHistory entries={snapshot.checkins[sid] || []} />
      </div>
    </>
  );
}

function CheckinHistory({ entries }) {
  if (!entries.length) return <p className="muted">No entries.</p>;
  return (
    <ul className="spa-mini-log">
      {entries.slice(0, 10).map((x, i) => {
        const row = typeof x === "object" ? x : {};
        const mk = typeof row.moodKey === "string" ? row.moodKey : "ok";
        const em = moodEmoji(mk);
        const sleepPart =
          row.sleepQ != null ? `sleep · ${row.sleepQ}` : row.sleep != null ? `sleep (hrs) · ${row.sleep}` : "sleep · —";
        const noteSnippet =
          typeof row.notes === "string" && row.notes.trim().length > 0
            ? ` · note: "${row.notes.trim().slice(0, 80)}${row.notes.trim().length > 80 ? "…" : ""}"`
            : "";
        const phys = row.physicalActivity != null ? ` · activity ${row.physicalActivity}` : "";
        const soc = row.socialLonely != null ? ` · social ${row.socialLonely}` : "";
        const studyBit = typeof row.study === "number" ? `study ${row.study}` : "";
        return (
          <li key={`${String(row.t)}-${i}`}>
            <time>{new Date(row.t).toLocaleString()}</time>
            {" · "}
            <span aria-hidden>{em}</span> {typeof row.mood === "string" ? row.mood : mk}
            {" · "}
            stress {row.stress}
            {" · "}
            {sleepPart}
            {studyBit ? ` · ${studyBit}` : ""}
            {phys}
            {soc}
            {noteSnippet}
          </li>
        );
      })}
    </ul>
  );
}

function ConsentPage() {
  const { snapshot, api } = useApi();
  if (!snapshot) return null;
  const sid = snapshot.session.studentId;
  const s = snapshot.students.find((x) => x.id === sid);
  if (!s) return null;
  return (
    <>
      <StudentConsentPanel snapshot={snapshot} studentId={sid} api={api} />
      <div className="spa-card consent-legacy-strip">
        <h4>Bulk shortcut</h4>
        <p className="muted tiny-help">Prefer individual toggles above. This flips every stream together.</p>
        <button type="button" className={`btn full ${s.consent ? "danger" : "safe"}`} onClick={() => api.toggleConsent(sid)}>
          {s.consent ? "Turn off every data stream" : "Turn on every data stream"}
        </button>
      </div>
    </>
  );
}

function ReportPage() {
  const { snapshot, trend } = useApi();
  if (!snapshot) return null;
  const sid = snapshot.session.studentId;
  const s = snapshot.students.find((x) => x.id === sid);
  const entries = snapshot.checkins[sid] || [];
  const avg =
    entries.length === 0
      ? "—"
      : (entries.slice(0, 5).reduce((acc, x) => acc + Number(x.stress), 0) / Math.min(entries.length, 5)).toFixed(1);
  if (!s) return null;
  return (
    <>
      <div className="spa-card">
        <h3>Personal trends</h3>
        <p>Educational only — not a diagnosis.</p>
        <p className="muted">Recent stress avg (check-ins): {avg}</p>
      </div>
      <StudentWellnessCharts student={s} checkins={entries} trend={trend} showCampusTrend={false} />
      <div className="spa-card">
        <h4>Recorded signals</h4>
        <div className="data-grid spa-dgrid">
          {[
            ["LMS", s.lms],
            ["Library", s.library],
            ["Dining", s.dining],
            ["Gym", s.gym],
            ["Social", s.social],
          ].map(([k, v]) => (
            <div key={k}>
              <span>{k}</span>
              <b>{v}</b>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function Resources() {
  return <StudentSupportHub />;
}

function Booking() {
  const { snapshot, api } = useApi();
  if (!snapshot) return null;
  return (
    <div className="booking-page-shell">
      <StudentBookingConsole staff={snapshot.staff ?? []} submitBooking={(payload) => api.submitBooking(payload)} />
    </div>
  );
}

function MessagesPage() {
  return <CampusChatHub mode="student" />;
}

function Emergency() {
  return (
    <div className="spa-card warn-card">
      <h3>Crisis</h3>
      <p>For emergencies contact local emergency services.</p>
      <ul className="spa-list">
        <li>
          <strong>988</strong> crisis line
        </li>
        <li>(555) 010-HELP campus security</li>
      </ul>
    </div>
  );
}

export default function StudentRoutes() {
  return (
    <Routes>
      <Route path="login" element={<Navigate to="/login" replace />} />
      <Route element={<RequirePortalRole roles={["STUDENT"]} />}>
        <Route index element={<Navigate to="home" replace />} />
        <Route path="home" element={<Overview />} />
        <Route path="checkin" element={<Checkin />} />
        <Route path="consent" element={<ConsentPage />} />
        <Route path="report" element={<ReportPage />} />
        <Route path="resources" element={<Resources />} />
        <Route path="booking" element={<Booking />} />
        <Route path="message" element={<MessagesPage />} />
        <Route path="emergency" element={<Emergency />} />
        <Route path="*" element={<Navigate to="home" replace />} />
      </Route>
    </Routes>
  );
}
