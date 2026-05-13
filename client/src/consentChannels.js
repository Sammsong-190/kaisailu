/** Keys must stay aligned with server `DATA_SHARING_CHANNELS`. */
/** @typedef {'lms'|'library'|'dining'|'campus'|'wellness'} DataSharingChannel */

/** @readonly */
export const CHANNEL_ORDER = /** @type {const} */ ([
  {
    key: "lms",
    title: "LMS engagement",
    datums: ["Login frequency · assignment completions · clicks on course resources"],
    why: "Helps counselors notice academic disengagement that often tracks with stress overload.",
  },
  {
    key: "library",
    title: "Library usage",
    datums: ["Visit counts · optional study-floor dwell (aggregated nightly)"],
    why: "Supports spotting withdrawal from structured study rhythms without reading titles of books.",
  },
  {
    key: "dining",
    title: "Dining & nutrition signals",
    datums: ["Meal-swipe rhythm · cafeteria presence windows (counts only)"],
    why: "Irregular meals can correlate with mood dips; counselors see patterns, not itemized receipts.",
  },
  {
    key: "campus",
    title: "Campus & movement activity",
    datums: ["Recreation-center check-ins · anonymized gym turnstiles · elective event attendance stubs"],
    why: "Very low movement can prompt gentle outreach before isolation deepens.",
  },
  {
    key: "wellness",
    title: "Self-report wellness & check-ins",
    datums: ["Voluntary sliders / 1–5 scales · emoji mood snapshots · counselor notes YOU save"],
    why: "Narratives you choose to share personalize care plans; withholding this disables stress/sleep/social cues in alerts.",
  },
]);

export const SHORT_LABEL = {
  lms: "LMS",
  library: "Library",
  dining: "Dining",
  campus: "Campus",
  wellness: "Wellness",
};

/**
 * Mirrors server-side `readDataSharing` semantics for rendering only.
 */
function channelFromStudent(student, ch) {
  const fb = !!student.consent;
  const d = student.dataSharing;
  if (!d || typeof d !== "object") return fb;
  return typeof d[ch] === "boolean" ? d[ch] : fb;
}

/** @returns {Record<DataSharingChannel, boolean>} */
export function readSharingRecord(student) {
  /** @type {Record<string, boolean>} */
  const out = {};
  for (const { key } of CHANNEL_ORDER) out[key] = channelFromStudent(student, key);
  return /** @type {Record<DataSharingChannel, boolean>} */ (out);
}

/**
 * @param {Record<string, unknown>} student
 */
export function formatLastAccess(student, channel) {
  const on = channelFromStudent(student, channel);
  if (!on) return "Last accessed · never (sharing off)";
  const raw = student.sharingAccessAt;
  const t =
    raw && typeof raw === "object" && typeof raw[channel] === "number" && Number.isFinite(raw[channel])
      ? raw[channel]
      : null;
  if (t === null)
    return "Last accessed · sync pending until you toggle this stream on";
  const d = new Date(t);
  return `Last accessed · ${d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}`;
}

/**
 * @param {Record<string, unknown>} student
 */
export function activeSharingHuman(student) {
  const bits = CHANNEL_ORDER.filter(({ key }) => channelFromStudent(student, key)).map(({ key }) => SHORT_LABEL[key]);
  return bits.length ? bits.join(" · ") : "None enabled";
}
