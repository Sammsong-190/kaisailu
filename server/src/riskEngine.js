/** Shared risk scoring (Consent filter + rule engine) */
export const DEFAULT_STUDENTS = [
  { id: "S1001", name: "Alex Chen", consent: true, lms: 92, library: 6, dining: 14, gym: 5, stress: 2, sleep: 7.4, social: 8 },
  { id: "S1002", name: "Maya Lee", consent: true, lms: 43, library: 0, dining: 4, gym: 0, stress: 4, sleep: 4.2, social: 2 },
  { id: "S1003", name: "Daniel Wong", consent: false, lms: 76, library: 3, dining: 9, gym: 2, stress: 3, sleep: 6.1, social: 5 },
  { id: "S1004", name: "Sara Patel", consent: true, lms: 38, library: 1, dining: 5, gym: 1, stress: 5, sleep: 3.8, social: 1 },
  { id: "S1005", name: "Ryan Smith", consent: true, lms: 81, library: 4, dining: 10, gym: 3, stress: 2, sleep: 6.9, social: 6 },
  { id: "S1006", name: "Olivia Brown", consent: true, lms: 67, library: 2, dining: 8, gym: 1, stress: 3, sleep: 5.8, social: 4 },
];

export const TREND = [
  { w: "W1", s: 44, b: 78 },
  { w: "W2", s: 49, b: 74 },
  { w: "W3", s: 55, b: 69 },
  { w: "W4", s: 52, b: 71 },
  { w: "W5", s: 46, b: 76 },
  { w: "W6", s: 39, b: 80 },
];

export function computeRisk(student, settings) {
  if (!student.consent)
    return {
      score: null,
      level: "Blocked",
      tone: "blocked",
      reasons: ["No consent: behavioral data excluded before analysis."],
    };
  let score = 0;
  const reasons = [];
  const { high, medium } = settings;
  if (student.lms < 50) {
    score += 22;
    reasons.push("LMS activity decline");
  }
  if (student.dining < 6) {
    score += 18;
    reasons.push("Irregular dining pattern");
  }
  if (student.gym === 0) {
    score += 8;
    reasons.push("No physical activity record");
  }
  if (student.library <= 1) {
    score += 10;
    reasons.push("Library engagement decreased");
  }
  if (student.stress >= 4) {
    score += 22;
    reasons.push("High self-reported stress");
  }
  if (student.sleep < 5) {
    score += 18;
    reasons.push("Sleep below healthy range");
  }
  if (student.social <= 2) {
    score += 15;
    reasons.push("Possible social isolation");
  }
  score = Math.min(100, score);
  if (score >= high) return { score, level: "High", tone: "high", reasons };
  if (score >= medium) return { score, level: "Medium", tone: "medium", reasons };
  if (score >= 30) return { score, level: "Low", tone: "low", reasons };
  return { score, level: "Balanced", tone: "balanced", reasons: ["No major risk pattern detected"] };
}

export function enrichStudents(state) {
  return state.students.map((s) => ({ ...s, risk: computeRisk(s, state.settings) }));
}

export function parseCSV(text) {
  const rows = text.trim().split(/\r?\n/).filter(Boolean);
  if (rows.length < 2) return [];
  const h = rows[0].split(",").map((x) => x.trim());
  return rows.slice(1).map((row) => {
    const v = row.split(",").map((x) => x.trim());
    const o = {};
    h.forEach((x, i) => (o[x] = v[i]));
    return {
      id: o.student_id || o.id || "Unknown",
      name: o.name || "Unnamed Student",
      consent: ["true", "yes", "1"].includes(String(o.consent).toLowerCase()),
      lms: Number(o.lms_activity || o.lms || 0),
      library: Number(o.library_visits || o.library || 0),
      dining: Number(o.dining_count || o.dining || 0),
      gym: Number(o.gym_visits || o.gym || 0),
      stress: Number(o.self_report_stress || o.stress || 0),
      sleep: Number(o.sleep_hours || o.sleep || 0),
      social: Number(o.social_activity || o.social || 0),
    };
  });
}
