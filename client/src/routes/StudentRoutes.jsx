import { Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";
import { useApi } from "../ApiProvider.jsx";
import { RequirePortalRole } from "../components/RequirePortalRole.jsx";
import StudentWellnessCharts from "../components/StudentWellnessCharts.jsx";
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
      <StudentWellnessCharts student={s} checkins={checkinEntries} trend={trend} showCampusTrend />
    </>
  );
}

function Checkin() {
  const { snapshot, api } = useApi();
  if (!snapshot) return null;
  const sid = snapshot.session.studentId;
  const s = snapshot.students.find((x) => x.id === sid);
  const [stress, setStress] = useState(Number(s?.stress ?? 3));
  const [sleep, setSleep] = useState(s?.sleep ?? 7);
  const [mood, setMood] = useState("Calm");
  const [study, setStudy] = useState("OK");

  if (!s) return null;

  return (
    <>
      <div className="spa-card">
        <h3>Check-in</h3>
        <label className="field">
          Stress (1–5)
          <input type="range" min={1} max={5} value={stress} onChange={(e) => setStress(+e.target.value)} />
        </label>
        <label className="field">
          Sleep (hrs)
          <input type="number" step={0.1} value={sleep} onChange={(e) => setSleep(+e.target.value)} />
        </label>
        <label className="field">
          Study focus
          <select value={study} onChange={(e) => setStudy(e.target.value)}>
            <option>Strong</option>
            <option>OK</option>
            <option>Struggling</option>
          </select>
        </label>
        <label className="field">
          Mood
          <select value={mood} onChange={(e) => setMood(e.target.value)}>
            <option>Calm</option>
            <option>Anxious</option>
            <option>Low</option>
            <option>Energized</option>
          </select>
        </label>
        <button type="button" className="btn primary full" onClick={() => api.checkin({ studentId: sid, stress, sleep, mood, study })}>
          Submit
        </button>
      </div>
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
      {entries.slice(0, 6).map((x, i) => (
        <li key={i}>
          <time>{new Date(x.t).toLocaleString()}</time> · mood {x.mood} · stress {x.stress}
        </li>
      ))}
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
    <div className="spa-card">
      <h3>Consent</h3>
      <p>Fused LMS · gate · library · dining indicators participate only when you opt in.</p>
      <button type="button" className={`btn full ${s.consent ? "danger" : "safe"}`} onClick={() => api.toggleConsent(sid)}>
        {s.consent ? "Withdraw behavioral consent" : "Grant consent"}
      </button>
    </div>
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
  return (
    <div className="spa-cards-row">
      <article className="spa-card">
        <h4>Breathing</h4>
        <p>5-minute grounding cadence.</p>
      </article>
      <article className="spa-card">
        <h4>Time blocks</h4>
        <p>Structured study pacing.</p>
      </article>
    </div>
  );
}

function Booking() {
  const { api } = useApi();
  return (
    <div className="spa-card">
      <h3>Appointment request</h3>
      <label className="field">
        Preferred day<input type="date" />
      </label>
      <label className="field">
        Note<textarea rows={3} />
      </label>
      <button type="button" className="btn primary" onClick={() => api.bookingDemo()}>
        Submit (demo)
      </button>
    </div>
  );
}

function MessagesPage() {
  return (
    <div className="spa-card">
      <h3>Message</h3>
      <p className="muted">
        Secure counselling messages will appear here when your institution enables messaging. Below is for layout preview only — nothing is stored or sent yet.
      </p>
      <label className="field">
        To (demo)
        <input type="text" placeholder="Campus counselling desk" disabled />
      </label>
      <label className="field">
        Your message
        <textarea rows={5} placeholder="Write your message…" />
      </label>
      <button type="button" className="btn primary" disabled title="Messaging not connected in this demo">
        Send (preview)
      </button>
    </div>
  );
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
