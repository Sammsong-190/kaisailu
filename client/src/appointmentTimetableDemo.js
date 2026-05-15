/** Follow-up labels used in case tracking — reused in timetable cells. */
export const APPOINTMENT_LABEL_TAGS = [
  "Academic stress",
  "Social isolation",
  "Psychological concern",
  "Physical constitution",
  "Sleep disruption",
];

export const APPOINTMENT_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

/** Time labels (50-minute blocks, start each hour as in sample timetable). */
export const APPOINTMENT_SLOT_TIMES = [
  "8:00 – 8:50",
  "9:00 – 9:50",
  "10:00 – 10:50",
  "11:00 – 11:50",
  "12:00 – 12:50",
  "13:00 – 13:50",
  "14:00 – 14:50",
  "15:00 – 15:50",
  "16:00 – 16:50",
  "17:00 – 17:50",
  "18:00 – 18:50",
];

/**
 * Matrix rows × (Mon–Fri). Cell encodings:
 * - "" empty
 * - "consult" consultation hour
 * - "case:slot:tagIdx" mapped through `resolveCaseIds` + APPOINTMENT_LABEL_TAGS
 *
 * @param {string[]} resolveCaseIds
 * @returns {Array<{time: string; cells: ({type:'empty'}|{type:'consultation'}|{type:'case'; caseDisplay: string; label: string})[]}>}
 */
export function buildAppointmentTimetableRows(resolveCaseIds) {
  const ids =
    resolveCaseIds.length >= 5
      ? resolveCaseIds.slice(0, 12)
      : [...resolveCaseIds, "Case-1847", "Case-2631", "Case-3402", "Case-4195", "Case-5823"];

  /** @type {string[][]} */
  const raw = [
    ["", "case:0:0", "consult", "", "consult"],
    ["consult", "", "case:1:1", "", ""],
    ["", "consult", "", "case:2:2", "consult"],
    ["case:3:3", "", "consult", "consult", ""],
    ["", "", "", "", "consult"],
    ["consult", "case:4:4", "", "", "consult"],
    ["case:0:2", "", "consult", "", "case:1:3"],
    ["", "consult", "consult", "", "consult"],
    ["consult", "", "case:3:1", "consult", ""],
    ["", "", "", "", "consult"],
    ["consult", "consult", "", "case:4:0", ""],
  ];

  /** @param {string} token */
  const parse = (token) => {
    const t = String(token || "").trim();
    if (!t) return { type: /** @type {const} */ ("empty") };
    if (t === "consult") return { type: /** @type {const} */ ("consultation") };
    const m = /^case:(\d+):(\d+)$/.exec(t);
    if (m) {
      const slot = Number(m[1]);
      const tagIdx = Number(m[2]);
      const caseDisplay = ids[slot % ids.length] || `Case-${1000 + slot}`;
      const label = APPOINTMENT_LABEL_TAGS[((tagIdx % APPOINTMENT_LABEL_TAGS.length) + APPOINTMENT_LABEL_TAGS.length) % APPOINTMENT_LABEL_TAGS.length];
      return { type: /** @type {const} */ ("case"), caseDisplay, label };
    }
    return { type: /** @type {const} */ ("empty") };
  };

  return APPOINTMENT_SLOT_TIMES.map((time, i) => ({
    time,
    cells: (raw[i] || ["", "", "", "", ""]).map(parse),
  }));
}
