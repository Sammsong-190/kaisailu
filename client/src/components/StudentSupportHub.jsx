import { useState } from "react";
import {
  ACTIVITY_TYPE_LABEL,
  PEER_SUPPORT_GROUPS,
  STRESS_MANAGEMENT_ACTIVITIES,
} from "../supportResourcesData.js";

export default function StudentSupportHub() {
  const [joinedGroupId, setJoinedGroupId] = useState(() => "");

  const joinGroup = (id) => {
    setJoinedGroupId(id);
    const g = PEER_SUPPORT_GROUPS.find((x) => x.id === id);
    window.alert(`${g?.label ?? "Group"} — a facilitator will follow up with scheduling details.`);
  };

  const openActivity = (id, title, type) => {
    window.alert(`Opening ${ACTIVITY_TYPE_LABEL[type] ?? type}: "${title}". Link this tile to your LMS or media library when ready.`);
  };

  return (
    <div className="support-hub">
      <header className="support-hub-intro spa-card">
        <h3>Support resources</h3>
        <p className="muted">
          Access peer circles, clinician-backed materials, and brief regulating activities. Coordinators use your selections to plan groups and outreach.
        </p>
      </header>

      <section className="spa-card peer-support-panel">
        <div className="support-section-head">
          <h4>Join peer support group</h4>
          <p className="muted tiny-help">Choose the cohort that fits you; moderators consolidate interest lists on a regular schedule.</p>
        </div>
        <div className="peer-group-grid" role="radiogroup" aria-label="Peer support cohort choice">
          {PEER_SUPPORT_GROUPS.map((g) => {
            const active = joinedGroupId === g.id;
            return (
              <article key={g.id} className={`peer-group-card ${active ? "peer-group-card-active" : ""}`}>
                <div className="peer-group-chip">{g.label}</div>
                <p className="peer-group-sub muted tiny-help">{g.subtitle}</p>
                <p className="peer-group-detail">{g.details}</p>
                <button
                  type="button"
                  role="radio"
                  aria-checked={active}
                  className={`btn full ${active ? "secondary" : "primary"}`}
                  onClick={() => joinGroup(g.id)}
                >
                  {active ? `Joined · ${g.label}` : `Join · ${g.label}`}
                </button>
              </article>
            );
          })}
        </div>
      </section>

      <section className="spa-card stress-toolbox-panel">
        <div className="support-section-head">
          <h4>Stress management activities</h4>
          <p className="muted tiny-help">Short video, audio, and printable resources similar to common LMS wellness libraries.</p>
        </div>
        <div className="stress-activity-grid">
          {STRESS_MANAGEMENT_ACTIVITIES.map((act) => (
            <article key={act.id} className="stress-activity-card">
              <span className={`stress-activity-tag stress-activity-tag-${act.type}`}>{ACTIVITY_TYPE_LABEL[act.type]}</span>
              <h5>{act.title}</h5>
              <p className="muted tiny-help stress-activity-duration">{act.duration}</p>
              <p className="stress-activity-blurb">{act.blurb}</p>
              <button type="button" className="btn secondary full" onClick={() => openActivity(act.id, act.title, act.type)}>
                Launch
              </button>
            </article>
          ))}
        </div>
      </section>

      <footer className="spa-card muted tiny-help">
        Still overwhelmed? Use <strong>Book counselling</strong> to reach a clinician — profiles and availability update on a rolling calendar.
      </footer>
    </div>
  );
}
