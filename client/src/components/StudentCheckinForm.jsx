import { useState } from "react";
import { MOOD_OPTIONS, clampRating, sleepHoursToQuality } from "../checkinUtils.js";

function RatingSelect({ label, hint, value, onChange }) {
  return (
    <div className="checkin-metric-card">
      <div className="checkin-card-head">
        <span className="checkin-card-title">{label}</span>
        {hint ? <p className="muted tiny-help checkin-card-hint">{hint}</p> : null}
      </div>
      <div className="checkin-rating-row" role="group" aria-label={label}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            className={`checkin-chip ${value === n ? "checkin-chip-active" : ""}`}
            aria-pressed={value === n}
            onClick={() => onChange(n)}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function StudentCheckinForm({ studentId, student, api }) {
  const [stress, setStress] = useState(clampRating(student.stress ?? 3));
  const [sleepQ, setSleepQ] = useState(sleepHoursToQuality(Number(student.sleep ?? 7)));
  const [study, setStudy] = useState(3);
  const [moodKey, setMoodKey] = useState("ok");
  const [physicalActivity, setPhysicalActivity] = useState(3);
  const [socialLonely, setSocialLonely] = useState(3);
  const [notes, setNotes] = useState("");

  const submit = () => {
    api.checkin({
      studentId,
      stress,
      sleepQ,
      study,
      moodKey,
      physicalActivity,
      socialLonely,
      notes: notes.trim(),
    });
  };

  return (
    <div className="spa-card">
      <h3>Wellness check-in</h3>
      <p className="muted tiny-help">Everything is a 1–5 choice unless noted. Tap a number or a mood face.</p>

      <div className="checkin-dashboard">
        <div className="checkin-metric-card mood-card">
          <div className="checkin-card-head">
            <span className="checkin-card-title">Mood</span>
            <p className="muted tiny-help checkin-card-hint">How are you feeling right now?</p>
          </div>
          <div className="mood-grid">
            {MOOD_OPTIONS.map(({ key, emoji, label }) => (
              <button
                key={key}
                type="button"
                className={`mood-chip ${moodKey === key ? "mood-chip-active" : ""}`}
                aria-pressed={moodKey === key}
                onClick={() => setMoodKey(key)}
              >
                <span className="mood-chip-emoji" aria-hidden>
                  {emoji}
                </span>
                <span className="mood-chip-label">{label}</span>
              </button>
            ))}
          </div>
        </div>

        <RatingSelect label="Stress" hint="1 very calm · 5 very stressed" value={stress} onChange={setStress} />

        <RatingSelect label="Sleep quality" hint="1 very poor · 5 great rest" value={sleepQ} onChange={setSleepQ} />

        <RatingSelect label="Academic workload" hint="1 very light · 5 overloaded" value={study} onChange={setStudy} />

        <RatingSelect label="Physical activity level" hint="1 very sedentary · 5 very active" value={physicalActivity} onChange={setPhysicalActivity} />

        <RatingSelect label="Social connection & loneliness" hint="1 very isolated · 5 well connected" value={socialLonely} onChange={setSocialLonely} />

        <label className="field checkin-notes-field">
          Notes <span className="muted tiny-help">Optional context for counselors (max 800 characters)</span>
          <textarea rows={4} placeholder="e.g., recovering from illness, unusually busy week, something positive…" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={800} />
        </label>

        <button type="button" className="btn primary full checkin-submit" onClick={submit}>
          Submit check-in
        </button>
      </div>
    </div>
  );
}
