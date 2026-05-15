/** Shared risk scoring (Consent filter + rule engine) */
/** @typedef {'lms'|'library'|'dining'|'campus'|'wellness'} DataSharingChannel */

/** @readonly */
export const DATA_SHARING_CHANNELS = ["lms", "library", "dining", "campus", "wellness"];

function fullSharingFromConsent(consented) {
  const on = !!consented;
  return { lms: on, library: on, dining: on, campus: on, wellness: on };
}

/**
 * Resolved flags for each stream (partial `student.dataSharing` falls back stream-by-stream to legacy `student.consent`).
 * @returns {Record<DataSharingChannel, boolean>}
 */
export function readDataSharing(student) {
  const fallback = !!student.consent;
  const d = student.dataSharing;
  /** @type {Record<DataSharingChannel, boolean>} */
  const out = /** @type {Record<DataSharingChannel, boolean>} */ ({});
  if (!d || typeof d !== "object") return fullSharingFromConsent(fallback);
  for (const k of DATA_SHARING_CHANNELS) {
    out[k] = typeof d[k] === "boolean" ? d[k] : fallback;
  }
  return out;
}

export function participatesInRiskSharing(student) {
  const ds = readDataSharing(student);
  return DATA_SHARING_CHANNELS.some((k) => ds[k]);
}

export const DEFAULT_STUDENTS = [
  {
    id: "S1001",
    name: "Alex Chen",
    consent: true,
    dataSharing: fullSharingFromConsent(true),
    lms: 92,
    library: 6,
    dining: 14,
    gym: 5,
    stress: 2,
    sleep: 7.4,
    social: 8,
  },
  {
    id: "S1002",
    name: "Maya Lee",
    consent: true,
    dataSharing: fullSharingFromConsent(true),
    lms: 43,
    library: 0,
    dining: 4,
    gym: 0,
    stress: 4,
    sleep: 4.2,
    social: 2,
  },
  {
    id: "S1003",
    name: "Daniel Wong",
    consent: false,
    dataSharing: fullSharingFromConsent(false),
    lms: 76,
    library: 3,
    dining: 9,
    gym: 2,
    stress: 3,
    sleep: 6.1,
    social: 5,
  },
  {
    id: "S1004",
    name: "Sara Patel",
    consent: true,
    dataSharing: fullSharingFromConsent(true),
    lms: 38,
    library: 1,
    dining: 5,
    gym: 1,
    stress: 5,
    sleep: 3.8,
    social: 1,
  },
  {
    id: "S1005",
    name: "Ryan Smith",
    consent: true,
    dataSharing: fullSharingFromConsent(true),
    lms: 81,
    library: 4,
    dining: 10,
    gym: 3,
    stress: 2,
    sleep: 6.9,
    social: 6,
  },
  {
    id: "S1006",
    name: "Olivia Brown",
    consent: true,
    dataSharing: fullSharingFromConsent(true),
    lms: 67,
    library: 2,
    dining: 8,
    gym: 1,
    stress: 3,
    sleep: 5.8,
    social: 4,
  },
  {
    id: "S1007",
    name: "Jordan Kim",
    consent: true,
    dataSharing: fullSharingFromConsent(true),
    lms: 34,
    library: 0,
    dining: 4,
    gym: 0,
    stress: 5,
    sleep: 4.2,
    social: 1,
  },
  {
    id: "S1008",
    name: "Priya Nair",
    consent: true,
    dataSharing: fullSharingFromConsent(true),
    lms: 41,
    library: 1,
    dining: 5,
    gym: 0,
    stress: 5,
    sleep: 5.1,
    social: 2,
  },
  {
    id: "S1009",
    name: "Marcus Johnson",
    consent: true,
    dataSharing: fullSharingFromConsent(true),
    lms: 70,
    library: 1,
    dining: 5,
    gym: 0,
    stress: 4,
    sleep: 7,
    social: 5,
  },
  {
    id: "S1010",
    name: "Hannah Müller",
    consent: true,
    dataSharing: fullSharingFromConsent(true),
    lms: 78,
    library: 1,
    dining: 12,
    gym: 2,
    stress: 4,
    sleep: 7,
    social: 6,
  },
  {
    id: "S1011",
    name: "Diego Alvarez",
    consent: true,
    dataSharing: fullSharingFromConsent(true),
    lms: 52,
    library: 2,
    dining: 8,
    gym: 0,
    stress: 4,
    sleep: 6.5,
    social: 5,
  },
  {
    id: "S1012",
    name: "Yuki Tanaka",
    consent: true,
    dataSharing: fullSharingFromConsent(true),
    lms: 48,
    library: 2,
    dining: 6,
    gym: 0,
    stress: 4,
    sleep: 6.8,
    social: 4,
  },
  {
    id: "S1013",
    name: "Fatima El-Sayed",
    consent: true,
    dataSharing: fullSharingFromConsent(true),
    lms: 44,
    library: 2,
    dining: 5,
    gym: 0,
    stress: 4,
    sleep: 6.2,
    social: 3,
  },
  {
    id: "S1014",
    name: "Noah Williams",
    consent: true,
    dataSharing: fullSharingFromConsent(true),
    lms: 30,
    library: 0,
    dining: 4,
    gym: 0,
    stress: 5,
    sleep: 4.5,
    social: 1,
  },
  {
    id: "S1015",
    name: "Emma Okafor",
    consent: true,
    dataSharing: fullSharingFromConsent(true),
    lms: 58,
    library: 1,
    dining: 5,
    gym: 4,
    stress: 4,
    sleep: 6.9,
    social: 4,
  },
  {
    id: "S1016",
    name: "Liam Novak",
    consent: true,
    dataSharing: fullSharingFromConsent(true),
    lms: 85,
    library: 1,
    dining: 13,
    gym: 6,
    stress: 4,
    sleep: 8,
    social: 5,
  },
];

export const TREND = [
  { w: "W1", s: 44, b: 78 },
  { w: "W2", s: 49, b: 74 },
  { w: "W3", s: 55, b: 69 },
  { w: "W4", s: 52, b: 71 },
  { w: "W5", s: 46, b: 76 },
  { w: "W6", s: 39, b: 80 },
];

const ALL_STREAMS_ON = /** @type {Record<DataSharingChannel, boolean>} */ ({
  lms: true,
  library: true,
  dining: true,
  campus: true,
  wellness: true,
});

/**
 * Rule-engine signals: points (0–100) plus matched reasons.
 * @param {Record<string, unknown>} student
 * @param {Record<DataSharingChannel, boolean>} ds
 */
function evaluateRiskSignals(student, ds) {
  const reasons = [];
  let score = 0;
  if (ds.lms && Number(student.lms) < 50) {
    score += 22;
    reasons.push("LMS activity decline");
  }
  if (ds.dining && Number(student.dining) < 6) {
    score += 18;
    reasons.push("Irregular dining pattern");
  }
  if (ds.campus && Number(student.gym) === 0) {
    score += 8;
    reasons.push("No physical activity record");
  }
  if (ds.library && Number(student.library) <= 1) {
    score += 10;
    reasons.push("Library engagement decreased");
  }
  if (ds.wellness && Number(student.stress) >= 4) {
    score += 22;
    reasons.push("High self-reported stress");
  }
  if (ds.wellness && Number(student.sleep) < 5) {
    score += 18;
    reasons.push("Sleep below healthy range");
  }
  if (ds.wellness && Number(student.social) <= 2) {
    score += 15;
    reasons.push("Possible social isolation");
  }
  score = Math.min(100, score);
  return { score, reasons };
}

/** @param {{ high: number; medium: number }} settings */
function classifyCompositeScore(score, reasons, settings) {
  const { high, medium } = settings;
  if (score >= high) return { score, level: "High", tone: "high", reasons };
  if (score >= medium) return { score, level: "Medium", tone: "medium", reasons };
  if (score >= 30) return { score, level: "Low", tone: "low", reasons };
  return {
    score,
    level: "Balanced",
    tone: "balanced",
    reasons: reasons.length ? reasons : ["No major risk pattern detected"],
  };
}

export function computeRisk(student, settings) {
  const ds = readDataSharing(student);
  const hypo = evaluateRiskSignals(student, ALL_STREAMS_ON);
  const hypotheticalScore = hypo.score;

  if (!DATA_SHARING_CHANNELS.some((k) => ds[k]))
    return {
      score: null,
      hypotheticalScore,
      level: "Blocked",
      tone: "blocked",
      reasons: ["No data streams enabled for analysis — toggle categories under Consent & data privacy."],
    };

  const { score, reasons } = evaluateRiskSignals(student, ds);
  return { hypotheticalScore, ...classifyCompositeScore(score, reasons, settings) };
}

export function enrichStudents(state) {
  return state.students.map((s) => ({ ...s, risk: computeRisk(s, state.settings) }));
}

function csvBool(cell, fallback) {
  if (cell == null || String(cell).trim() === "") return fallback;
  const t = String(cell).trim().toLowerCase();
  if (["true", "yes", "1"].includes(t)) return true;
  if (["false", "no", "0"].includes(t)) return false;
  return fallback;
}

export function parseCSV(text) {
  const rows = text.trim().split(/\r?\n/).filter(Boolean);
  if (rows.length < 2) return [];
  const h = rows[0].split(",").map((x) => x.trim());
  return rows.slice(1).map((row) => {
    const v = row.split(",").map((x) => x.trim());
    const o = {};
    h.forEach((x, i) => (o[x] = v[i]));
    const consentMaster = csvBool(o.consent, false);

    /** Any explicit per-stream column overrides the homogeneous `consent` default */
    const shareColumnHints = ["share_lms", "share_lms_data", "share_library", "share_library_data", "share_dining", "share_diet", "share_campus", "share_campus_activity", "share_wellness", "share_wellness_checkins"];
    const hasShareCol = shareColumnHints.some((c) => Object.prototype.hasOwnProperty.call(o, c) && String(o[c] ?? "").trim() !== "");

    /** @type {Record<DataSharingChannel, boolean>} */
    const share = {
      lms: csvBool(o.share_lms ?? o.share_lms_data, consentMaster),
      library: csvBool(o.share_library ?? o.share_library_data, consentMaster),
      dining: csvBool(o.share_dining ?? o.share_diet, consentMaster),
      campus: csvBool(o.share_campus ?? o.share_campus_activity, consentMaster),
      wellness: csvBool(o.share_wellness ?? o.share_wellness_checkins, consentMaster),
    };

    const anyShare = Object.values(share).some(Boolean);
    const consent = hasShareCol ? anyShare : consentMaster;

    return {
      id: o.student_id || o.id || "Unknown",
      name: o.name || "Unnamed Student",
      consent,
      dataSharing: share,
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
