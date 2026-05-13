/** Client-side helpers for student check-ins (ratings 1–5 + mood keys). */

export const MOOD_OPTIONS = [
  { key: "great", label: "Fantastic", emoji: "😄" },
  { key: "good", label: "Good", emoji: "🙂" },
  { key: "ok", label: "OK", emoji: "😐" },
  { key: "low", label: "Low", emoji: "😟" },
  { key: "rough", label: "Rough", emoji: "😢" },
];

/** @param {number} hours */
export function sleepHoursToQuality(hours) {
  const h = Number(hours);
  if (!Number.isFinite(h)) return 3;
  if (h <= 4.5) return 1;
  if (h <= 5.5) return 2;
  if (h <= 6.5) return 3;
  if (h <= 7.5) return 4;
  return 5;
}

/** @param {string} moodKey */
export function moodKeyToScore(moodKey) {
  const scores = { great: 5, good: 4, ok: 3, low: 2, rough: 1 };
  return scores[moodKey] ?? 3;
}

/** @param {string} moodKey */
export function moodEmoji(moodKey) {
  return MOOD_OPTIONS.find((m) => m.key === moodKey)?.emoji ?? "😐";
}

/**
 * @param {Record<string, unknown>} row
 * @param {{ sleep?: number }} studentFallback profile hours when row has nothing
 */
export function resolveSleepFive(row, studentFallback) {
  if (row.sleepQ != null && Number(row.sleepQ) >= 1 && Number(row.sleepQ) <= 5) return Number(row.sleepQ);
  const s = Number(row.sleep);
  if (!Number.isFinite(s)) return sleepHoursToQuality(studentFallback?.sleep ?? 7);
  /* Legacy rows stored sleep as hours */
  return sleepHoursToQuality(s);
}

/** @param {Record<string, unknown>} row */
export function resolveMoodFive(row) {
  const k = row.moodKey;
  if (typeof k === "string") return moodKeyToScore(k);
  const legacyMap = {
    Energized: 5,
    Calm: 3,
    Anxious: 2,
    Low: 2,
    Strong: 4,
    OK: 3,
    Struggling: 2,
  };
  const mood = typeof row.mood === "string" ? row.mood : "";
  if (legacyMap[mood] != null) return legacyMap[mood];
  return 3;
}

/** @param {unknown} x */
export function clampRating(x, fallback = 3) {
  const n = Math.round(Number(x));
  if (!Number.isFinite(n)) return clampRating(fallback, 3);
  return Math.min(5, Math.max(1, n));
}

/** Rating 1–5 from legacy verbal study strings */
/** @param {Record<string, unknown>} row */
export function resolveStudyFive(row) {
  const num = Number(row.study);
  if (Number.isFinite(num) && num >= 1 && num <= 5) return Math.round(num);
  const s = typeof row.study === "string" ? row.study : "";
  if (s === "Strong") return 4;
  if (s === "Struggling") return 2;
  if (s === "OK") return 3;
  return 3;
}

/** @param {Record<string, unknown>} row */
export function resolvePhysicalFive(row, student) {
  const n = Number(row.physicalActivity);
  if (Number.isFinite(n) && n >= 1 && n <= 5) return Math.round(n);
  const g = Number(student?.gym);
  if (!Number.isFinite(g)) return 3;
  if (g >= 5) return 5;
  if (g >= 3) return 4;
  if (g >= 1) return 3;
  return 2;
}

/** @param {Record<string, unknown>} row */
export function resolveSocialFive(row, student) {
  const n = Number(row.socialLonely);
  if (Number.isFinite(n) && n >= 1 && n <= 5) return Math.round(n);
  const soc = Number(student?.social);
  if (!Number.isFinite(soc)) return 3;
  return Math.min(5, Math.max(1, Math.round(soc / 2)));
}

/** @returns {number} 0–100 */
export function quintileToWellnessPct(score1to5) {
  const v = clampRating(score1to5, 3);
  return ((v - 1) / 4) * 100;
}

/**
 * Composites stress, sleep quality, workload, mood, physical activity & social-connection (all 1–5).
 * Stress and workload overload are inverted so higher wellness index = resting calmer rhythms.
 * @param {Record<string, unknown>} row
 * @param {Record<string, unknown>} student
 * @returns {number} rounded 0–100
 */
export function compositeWellnessScore(row, student) {
  const stress = clampRating(Number(row.stress), 3);
  const workload = clampRating(resolveStudyFive(row), 3);
  const calm = quintileToWellnessPct(6 - stress);
  const pacing = quintileToWellnessPct(6 - workload);
  const sleep = quintileToWellnessPct(resolveSleepFive(row, student));
  const mood = quintileToWellnessPct(resolveMoodFive(row));
  const physical = quintileToWellnessPct(resolvePhysicalFive(row, student));
  const social = quintileToWellnessPct(resolveSocialFive(row, student));
  const sum = calm + pacing + sleep + mood + physical + social;
  return Math.round(sum / 6);
}

/** ISO-like local yyyy-mm-dd */
export function localDateKey(timestamp) {
  const d = new Date(Number(timestamp));
  if (Number.isNaN(d.getTime())) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * One point per calendar day — averages multiple submissions on the same day.
 * @param {Array<Record<string, unknown>>} entries Chronological any order (uses `row.t`).
 * @param {Record<string, unknown>} student roster profile fallback
 */
export function dailyWellnessTrend(entries, student) {
  /** @type {Map<string, { sum: number; count: number }>} */
  const map = new Map();
  const list = Array.isArray(entries) ? entries : [];
  for (const row of list) {
    const t = row.t;
    if (t == null) continue;
    const key = localDateKey(t);
    if (!key) continue;
    const prev = map.get(key) || { sum: 0, count: 0 };
    prev.sum += compositeWellnessScore(row, student);
    prev.count += 1;
    map.set(key, prev);
  }
  return [...map.entries()]
    .map(([day, cell]) => ({
      day,
      composite: Math.round(cell.sum / cell.count),
      count: cell.count,
      labelShort: `${day.slice(5, 7)}-${day.slice(8, 10)}`,
    }))
    .sort((a, b) => a.day.localeCompare(b.day))
    .slice(-40);
}

/**
 * For UI when there is no check-in yet.
 * @param {Record<string, unknown>} student
 */
export function profileBaselineWellnessRow(student) {
  const lms = Number(student.lms ?? 60);
  const study = lms < 52 ? 2 : lms > 82 ? 4 : 3;
  return {
    stress: student.stress ?? 3,
    sleep: student.sleep ?? 7,
    moodKey: "ok",
    study,
    physicalActivity: resolvePhysicalFive({}, student),
    socialLonely: resolveSocialFive({}, student),
  };
}
