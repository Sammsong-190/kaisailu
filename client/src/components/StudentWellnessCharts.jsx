import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  resolveSleepFive,
  resolveMoodFive,
  resolveStudyFive,
  resolvePhysicalFive,
  resolveSocialFive,
  sleepHoursToQuality,
} from "../checkinUtils.js";

/**
 * @param {{
 *   student: Record<string, unknown>;
 *   checkins: Array<Record<string, unknown>>;
 *   trend?: Array<{ w: string; s: number; b: number }> | null;
 *   showCampusTrend?: boolean;
 * }} props
 */
export default function StudentWellnessCharts({ student, checkins, trend, showCampusTrend = true }) {
  const raw = Array.isArray(checkins) ? checkins : [];
  let series = [...raw]
    .reverse()
    .slice(-14)
    .map((c, i) => ({
      order: i,
      label:
        raw.length > 1
          ? new Date(c.t).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
          : `Check-in ${i + 1}`,
      Stress: Number(c.stress),
      Sleep: resolveSleepFive(c, student),
      Study: resolveStudyFive(c),
      Mood: resolveMoodFive(c),
      Physical: resolvePhysicalFive(c, student),
      Social: resolveSocialFive(c, student),
    }));

  if (series.length === 0) {
    series = [
      {
        order: 0,
        label: "Profile baseline",
        Stress: Number(student.stress ?? 3),
        Sleep: sleepHoursToQuality(Number(student.sleep ?? 7)),
        Study: clampStudyBaseline(student.lms ?? 60),
        Mood: 3,
        Physical: resolvePhysicalFive({}, student),
        Social: resolveSocialFive({}, student),
      },
    ];
  }

  const activityData = [
    { name: "LMS", value: student.lms ?? 0, fill: "#4f46e5" },
    { name: "Library", value: student.library ?? 0, fill: "#0891b2" },
    { name: "Dining", value: student.dining ?? 0, fill: "#059669" },
    { name: "Gym", value: student.gym ?? 0, fill: "#d97706" },
  ];

  const campusBars = (trend && trend.length ? trend : [{ w: "—", s: 0, b: 0 }]).map((d) => ({
    week: d.w,
    "Campus stress index": d.s,
    "Wellbeing index": d.b,
  }));

  return (
    <div className="student-wellness-charts">
      <div className="spa-card chart-card-compact student-chart-span-2">
        <h4>Your check-ins · wellness (all scales 1–5)</h4>
        <p className="muted tiny-help">
          {raw.length < 2
            ? "More check-ins thicken the trends. Until then, baseline uses your roster profile signals."
            : "Most recent points appear on the right."}
          {" "}Sleep reflects self-rated sleep quality, not clock hours.
        </p>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="label" tick={{ fontSize: 9 }} interval="preserveStartEnd" />
            <YAxis domain={[0.5, 5.5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #e2e8f0", maxWidth: 280 }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="Stress" stroke="#dc2626" strokeWidth={2} dot={{ r: 2 }} />
            <Line type="monotone" dataKey="Sleep" stroke="#2563eb" strokeWidth={2} dot={{ r: 2 }} />
            <Line type="monotone" dataKey="Study" stroke="#059669" strokeWidth={2} dot={{ r: 2 }} />
            <Line type="monotone" dataKey="Mood" stroke="#9333ea" strokeWidth={2} dot={{ r: 2 }} />
            <Line type="monotone" dataKey="Physical" stroke="#ea580c" strokeWidth={2} dot={{ r: 2 }} />
            <Line type="monotone" dataKey="Social" stroke="#0891b2" strokeWidth={2} dot={{ r: 2 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="spa-card chart-card-compact">
        <h4>Campus signal mix (your record)</h4>
        <p className="muted tiny-help">LMS activity index and visit counts used in the demo risk model (educational only).</p>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={activityData} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="name" width={72} tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #e2e8f0" }} />
            <Bar dataKey="value" name="Count / index" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {showCampusTrend ? (
        <div className="spa-card chart-card-compact student-chart-span-2">
          <h4>Campus-wide trend (illustrative · anonymized)</h4>
          <p className="muted tiny-help">Same cohort stress vs wellbeing story used on the counselor dashboard — shown so you see context, not comparisons to individuals.</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={campusBars} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="week" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #e2e8f0" }} />
              <Legend />
              <Bar dataKey="Campus stress index" fill="#f97316" radius={[6, 6, 0, 0]} />
              <Bar dataKey="Wellbeing index" fill="#22c55e" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : null}
    </div>
  );
}

/** @param {number} lms */
function clampStudyBaseline(lms) {
  const x = Number(lms);
  if (!Number.isFinite(x)) return 3;
  if (x < 52) return 2;
  if (x > 82) return 4;
  return 3;
}
