import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

/** @param {{ timeline?: Array<{ t: string } & Record<string, number>>; compact?: boolean }} props */
export default function CampusMetricsCharts({ timeline, compact }) {
  const raw = timeline && timeline.length ? timeline : [{ t: "—", highCount: 0, mediumPlus: 0, avgStress: 0, interventionRate: 0, openCases: 0 }];
  const data = raw.map((d) => ({
    ...d,
    interventionPct: Math.round((d.interventionRate ?? 0) * 100),
  }));
  const h = compact ? 220 : 300;

  return (
    <div className={`spa-card ${compact ? "chart-card-compact" : ""}`}>
      <h4>Campus signal metrics · weekly-ish points</h4>
      <p className="muted tiny-help">Derived from enriched student profiles, open cases, and follow-up indicators.</p>
      <ResponsiveContainer width="100%" height={h}>
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="t" tick={{ fontSize: 11 }} />
          <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
          <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} domain={[0, 100]} />
          <Tooltip
            contentStyle={{ borderRadius: 10, border: "1px solid #e2e8f0" }}
            formatter={(value, name) => (name === "Intervention proxy %" ? [`${value}%`, name] : [value, name])}
          />
          <Legend />
          <Line yAxisId="left" type="monotone" dataKey="highCount" name="High risk count" stroke="#dc2626" strokeWidth={2} dot={false} />
          <Line yAxisId="left" type="monotone" dataKey="mediumPlus" name="≥ Medium" stroke="#d97706" strokeWidth={2} dot={false} />
          <Line yAxisId="left" type="monotone" dataKey="avgStress" name="Avg stress (1–5)" stroke="#0891b2" strokeWidth={2} dot={false} />
          <Line yAxisId="left" type="monotone" dataKey="openCases" name="Open cases" stroke="#4f46e5" strokeWidth={2} dot={false} />
          <Line yAxisId="right" type="monotone" dataKey="interventionPct" name="Intervention proxy %" stroke="#059669" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
