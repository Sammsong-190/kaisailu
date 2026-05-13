import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  compositeWellnessScore,
  dailyWellnessTrend,
  moodEmoji,
  profileBaselineWellnessRow,
  resolveSleepFive,
} from "../checkinUtils.js";

/**
 * Aggregated 0–100 trend from stress, sleep quality, workload, mood, movement & connection (six 1–5 faces daily average).
 *
 * @param {{ student: Record<string, unknown>; checkins: Array<Record<string, unknown>> }} props
 */
export default function StudentOverviewWellnessTrend({ student, checkins }) {
  const raw = Array.isArray(checkins) ? checkins : [];
  let series = dailyWellnessTrend(raw, student);

  if (series.length === 0) {
    const synth = profileBaselineWellnessRow(student);
    series = [
      {
        day: "baseline",
        composite: compositeWellnessScore(synth, student),
        count: 0,
        labelShort: "Baseline",
        isSynthetic: true,
      },
    ];
  }

  const timelineSlice = [...raw]
    .filter((row) => row.t != null)
    .sort((a, b) => Number(b.t) - Number(a.t))
    .slice(0, 8);

  return (
    <section className="spa-card wellness-history-card">
      <div className="wellness-history-head">
        <div>
          <h4 className="wellness-history-title">
            <span className="wellness-history-clock" aria-hidden>
              ◷
            </span>{" "}
            Daily wellness summary
          </h4>
          <p className="muted tiny-help">
            One index (0–100) per day merges your six sliders: calm vs stress · sleep quality · workload · mood · movement · social
            connection (stress & heavy workload inverted so “better” climbs the chart).
          </p>
        </div>
        <div className="wellness-history-actions">
          <button type="button" className="btn secondary wellness-history-btn-download" onClick={onExportWellnessBundle}>
            ↓ Download my data
          </button>
          <button type="button" className="btn secondary wellness-history-btn-delete" onClick={onDeleteOptionalNarratives}>
            Delete optional data
          </button>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={276}>
        <AreaChart data={series} margin={{ top: 8, right: 12, left: -8, bottom: 4 }}>
          <defs>
            <linearGradient id="wellnessAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563eb" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#2563eb" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="labelShort" tick={{ fontSize: 11 }} stroke="#64748b" />
          <YAxis
            domain={[0, 100]}
            ticks={[20, 40, 60, 80, 100]}
            tick={{ fontSize: 11 }}
            stroke="#64748b"
            label={{ value: "Daily index", angle: -90, position: "insideLeft", offset: 8, fill: "#94a3b8", fontSize: 11 }}
          />
          <Tooltip
            formatter={(value) => [`${value} / 100`, "Wellness index"]}
            labelFormatter={(v, payloadItems) =>
              payloadItems?.[0]?.payload?.day && payloadItems[0].payload.day !== "baseline"
                ? String(payloadItems[0].payload.day)
                : "Profile-derived estimate"
            }
            contentStyle={{ borderRadius: 10, border: "1px solid #e2e8f0" }}
          />
          <Area
            type="monotone"
            dataKey="composite"
            name="Wellness index"
            stroke="#1d4ed8"
            strokeWidth={2.5}
            fill="url(#wellnessAreaGradient)"
            dot={{ r: 3, fill: "#1d4ed8", stroke: "#fff", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
      <p className="muted tiny-help wellness-legend-caption">Legend · fused line averages every submission on that calendar day.</p>

      <h5 className="wellness-timeline-heading">Recent check-ins · breakdown</h5>
      <ul className="wellness-timeline">
        {timelineSlice.length === 0 ? (
          <li className="muted tiny-help">No submissions yet · your first scores populate this ledger.</li>
        ) : (
          timelineSlice.map((row, i) => (
            <li key={`${String(row.t)}-${i}`} className="wellness-timeline-item">
              <span className="wellness-timeline-dot" aria-hidden />
              <div className="wellness-timeline-body">
                <div className="wellness-timeline-row">
                  <time className="wellness-timeline-time">{new Date(Number(row.t)).toLocaleString()}</time>
                  <span className={`wellness-timeline-score ${scoreToneClass(compositeWellnessScore(row, student))}`}>
                    {compositeWellnessScore(row, student)}/100
                  </span>
                </div>
                <p className="wellness-timeline-detail muted tiny-help">
                  <span aria-hidden>{moodEmoji(typeof row.moodKey === "string" ? row.moodKey : "ok")}</span> Mood · Stress{" "}
                  {row.stress ?? "—"}
                  · Sleep {resolveSleepFive(row, student)}
                  · Study {typeof row.study === "number" ? row.study : "—"} · Movement {row.physicalActivity ?? "—"} · Connection{" "}
                  {row.socialLonely ?? "—"} <span className="muted">(all 1–5)</span>
                </p>
              </div>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}

/** @param {number} score */
function scoreToneClass(score) {
  if (score >= 70) return "wellness-tone-good";
  if (score >= 50) return "wellness-tone-mid";
  return "wellness-tone-low";
}

function onExportWellnessBundle() {
  window.alert(
    "Exports combine consented institutional signals and voluntary check-ins. Your campus IT or wellbeing office can enable full download.",
  );
}

function onDeleteOptionalNarratives() {
  window.alert(
    "Removing optional narratives may limit what counsellors see; statutory audit logs typically remain under policy retention.",
  );
}
