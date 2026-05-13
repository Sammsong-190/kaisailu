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
