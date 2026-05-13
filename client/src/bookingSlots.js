/** Deterministic availability windows so students see consistent slots before a live calendar is connected. */

function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** @param {string} str */
export function seedFromString(str) {
  let s = 0;
  for (let i = 0; i < str.length; i++) s = Math.imul(31, s) + str.charCodeAt(i);
  return s >>> 0;
}

const SLOT_TEMPLATES = [
  ["09:00", "09:25"],
  ["10:00", "10:25"],
  ["11:15", "11:40"],
  ["13:30", "14:00"],
  ["14:45", "15:10"],
  ["15:30", "15:55"],
];

/**
 * @param {string} counselorId
 * @param {string} dateISO yyyy-mm-dd
 * @returns {Array<[string,string]>}
 */
export function slotsForCounselorOnDay(counselorId, dateISO) {
  const rnd = mulberry32(seedFromString(`${counselorId}|${dateISO}`));
  const n = 2 + Math.floor(rnd() * 3);
  const order = [...SLOT_TEMPLATES].sort(() => rnd() - 0.5);
  /** @type {Array<[string,string]>} */
  const picked = order.slice(0, n);
  picked.sort((a, b) => a[0].localeCompare(b[0]));
  return picked;
}

/** Calendar strip helpers (local noon anchor avoids DST edge cases). */
export function buildNextDays(count) {
  return buildDaysWindow(0, count);
}

/**
 * @param {number} startDayOffset Days from today's calendar date (may be negative to view earlier dates).
 * @param {number} count
 */
export function buildDaysWindow(startDayOffset = 0, count = 14) {
  const anchor = new Date();
  anchor.setHours(12, 0, 0, 0);
  anchor.setDate(anchor.getDate() + startDayOffset);
  const out = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(anchor);
    d.setDate(anchor.getDate() + i);
    out.push(d);
  }
  return out;
}

/** @param {Date} d */
export function toYyyyMmDd(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * @param {string} dateISO
 * @param {Array<Record<string, unknown>>} staff
 */
export function totalOpenSlotsOnDay(dateISO, staff) {
  const list = Array.isArray(staff) ? staff.filter((s) => s.active !== false) : [];
  let n = 0;
  for (const c of list) {
    if (typeof c.id === "string") n += slotsForCounselorOnDay(c.id, dateISO).length;
  }
  return n;
}
