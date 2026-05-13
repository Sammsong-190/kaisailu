import { useMemo, useState } from "react";
import {
  buildDaysWindow,
  slotsForCounselorOnDay,
  toYyyyMmDd,
  totalOpenSlotsOnDay,
} from "../bookingSlots.js";

/** Booking calendar labels stay English regardless of browser locale. */
const CALENDAR_LOCALE = "en-US";

const WINDOW_DAYS = 14;
const WINDOW_STEP = 7;

/**
 * @param {{
 *   staff: Array<Record<string, unknown>>;
 *   submitBooking: (body?: Record<string, unknown>) => Promise<unknown>;
 * }} props
 */
export default function StudentBookingConsole({ staff, submitBooking }) {
  const [rangeOffset, setRangeOffset] = useState(0);
  const [pickDayIdx, setPickDayIdx] = useState(0);
  const [filterTxt, setFilterTxt] = useState("");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState("");

  const days = useMemo(() => buildDaysWindow(rangeOffset, WINDOW_DAYS), [rangeOffset]);

  const dateISO = useMemo(() => toYyyyMmDd(days[pickDayIdx] ?? days[0]), [days, pickDayIdx]);
  const counselors = useMemo(() => (Array.isArray(staff) ? staff.filter((s) => s.active !== false) : []), [staff]);

  const offers = useMemo(() => {
    const q = filterTxt.trim().toLowerCase();
    /** @type {Array<{ slotLabel: string; start: string; end: string; counselor: Record<string, unknown> }>} */
    const rows = [];
    for (const c of counselors) {
      const cid = typeof c.id === "string" ? c.id : "";
      const hay =
        `${c.name ?? ""} ${c.role ?? ""} ${c.title ?? ""} ${c.department ?? ""} ${c.bio ?? ""}`.toLowerCase();
      if (q && !hay.includes(q)) continue;
      const slots = slotsForCounselorOnDay(cid, dateISO);
      for (const [start, end] of slots) {
        rows.push({
          counselor: c,
          start,
          end,
          slotLabel: `${start} – ${end}`,
        });
      }
    }
    rows.sort((a, b) => a.start.localeCompare(b.start) || String(a.counselor.name).localeCompare(String(b.counselor.name)));
    return rows;
  }, [counselors, dateISO, filterTxt]);

  const shiftWindow = (delta) => {
    setRangeOffset((o) => Math.max(0, o + delta));
    setPickDayIdx(0);
    setStatus("");
  };

  const book = async (row) => {
    const noteTrim = note.trim().slice(0, 600);
    setStatus("Submitting…");
    try {
      await submitBooking({
        counselorId: row.counselor.id,
        counselorName: row.counselor.name,
        date: dateISO,
        slotStart: row.start,
        slotEnd: row.end,
        note: noteTrim || undefined,
      });
      const noteHint = noteTrim ? " · Briefing note recorded with slot hold." : "";
      setStatus(`Held ${row.slotLabel} with ${row.counselor.name}.${noteHint}`);
    } catch {
      setStatus("Could not reach server — retry after checking your session.");
    }
  };

  return (
    <div className="spa-card booking-console">
      <div className="booking-console-head">
        <div>
          <h3>Book counselling</h3>
          <p className="muted tiny-help">
            Browse two-week windows · review clinician bios · slots are matched to clinician availability for each calendar day.
          </p>
        </div>
        <button type="button" className="btn secondary booking-filter-reset" onClick={() => setFilterTxt("")}>
          Clear filter
        </button>
      </div>

      <label className="field booking-filter-field">
        <span className="booking-filter-caption">Focus for your counselor (optional)</span>
        <textarea
          className="booking-note-area"
          rows={2}
          maxLength={600}
          placeholder="e.g. panic before stats midterm · grief after family call · roommate noise…"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </label>

      <label className="field booking-filter-field">
        <span className="booking-filter-caption">Filter counselors</span>
        <input
          type="search"
          placeholder="Name, speciality, department…"
          value={filterTxt}
          onChange={(e) => setFilterTxt(e.target.value)}
          className="booking-filter-input"
        />
      </label>

      <div className="booking-console-split">
        <aside className="booking-date-rail">
          <div className="booking-cal-shell" role="group" aria-label="Calendar window">
            <button
              type="button"
              className="booking-cal-step"
              aria-label="Show the previous seven days"
              disabled={rangeOffset <= 0}
              onClick={() => shiftWindow(-WINDOW_STEP)}
            >
              <BookingChevron dir="left" />
            </button>
            <div className="booking-cal-body">
              <span className="booking-cal-eyebrow">Approx. two-week view</span>
              <strong className="booking-cal-month">{calendarPrimaryLabel(days)}</strong>
              <span className="booking-cal-range muted tiny-help">{calendarRangeSubtitle(days)}</span>
            </div>
            <button
              type="button"
              className="booking-cal-step"
              aria-label="Show the next seven days"
              onClick={() => shiftWindow(WINDOW_STEP)}
            >
              <BookingChevron dir="right" />
            </button>
          </div>
          <p className="muted tiny-help booking-date-sub">
            Arrows gently slide the fake roster one week · each row is one local day ({WINDOW_DAYS} days in this pane).
          </p>

          <ul className="booking-date-list">
            {days.map((d, idx) => {
              const iso = toYyyyMmDd(d);
              const n = totalOpenSlotsOnDay(iso, counselors);
              const active = idx === pickDayIdx;
              return (
                <li key={`${iso}-${rangeOffset}-${idx}`}>
                  <button
                    type="button"
                    className={`booking-date-pill ${active ? "booking-date-pill-active" : ""}`}
                    onClick={() => {
                      setPickDayIdx(idx);
                      setStatus("");
                    }}
                  >
                    <span className="booking-date-num">{String(d.getDate()).padStart(2, "0")}</span>
                    <span className="booking-date-meta">
                      <span className="booking-date-dow">{d.toLocaleDateString(CALENDAR_LOCALE, { weekday: "short" })}</span>
                      <span className="booking-date-month">{d.toLocaleDateString(CALENDAR_LOCALE, { month: "short" })}</span>
                      <span className="muted tiny-help booking-slot-line">{n} openings</span>
                    </span>
                    <span className="booking-date-avatars" aria-hidden>
                      {counselors.slice(0, 4).map((c) => (
                        <span key={String(c.id)} className="booking-face-chip">
                          {initials(String(c.name ?? "?"))}
                        </span>
                      ))}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        <div className="booking-offers-pane">
          <div className="booking-offers-summary">
            <strong>{longDateLabel(days[pickDayIdx])}</strong>
            <span className="muted tiny-help booking-offers-subhead-inline">
              {dateISO} · {offers.length} slot{slotPluralSuffix(offers.length)} after filter
            </span>
          </div>
          {status ? <p className="booking-status">{status}</p> : null}

          <ul className="booking-slot-cards">
            {offers.map((row) => (
              <li key={`${String(row.counselor.id)}-${row.slotLabel}-${dateISO}`} className="booking-slot-card">
                <span className="booking-avatar" aria-hidden>
                  {initials(String(row.counselor.name ?? "?"))}
                </span>
                <div className="booking-bio-col">
                  <div className="booking-name-row">
                    <strong className="booking-counselor-name">{String(row.counselor.name)}</strong>
                    <span className="muted tiny-help booking-role-chip">{String(row.counselor.role ?? "Counselor")}</span>
                  </div>
                  <div className="muted tiny-help booking-title-line">{String(row.counselor.title ?? "")}</div>
                  <div className="muted tiny-help booking-dept-line">{String(row.counselor.department ?? "")}</div>
                  <p className="booking-bio-text">{String(row.counselor.bio ?? "Bio pending — connect your HR feed in production.")}</p>
                  <button type="button" className="btn primary booking-choose-btn" onClick={() => book(row)}>
                    <span aria-hidden className="booking-clock-label">
                      🕒
                    </span>{" "}
                    Reserve {row.slotLabel}
                  </button>
                </div>
              </li>
            ))}
          </ul>

          {offers.length === 0 ? (
            <p className="muted">No counselors match your filter today — widen the keywords, flip the calendar window, or pick another day.</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/** @param {Date[]} dayList */
function calendarPrimaryLabel(dayList) {
  if (!dayList.length) return "Calendar";
  const a = dayList[0];
  const b = dayList[dayList.length - 1];
  const y = a.getFullYear();
  if (a.getMonth() === b.getMonth() && y === b.getFullYear())
    return a.toLocaleDateString(CALENDAR_LOCALE, { month: "long", year: "numeric" });
  return `${y} · ${a.toLocaleDateString(CALENDAR_LOCALE, { month: "short" })} – ${b.toLocaleDateString(CALENDAR_LOCALE, { month: "short" })}`;
}

/** @param {Date[]} dayList */
function calendarRangeSubtitle(dayList) {
  if (!dayList.length) return "";
  const a = dayList[0];
  const b = dayList[dayList.length - 1];
  const start = a.toLocaleDateString(CALENDAR_LOCALE, { weekday: "short", month: "short", day: "numeric" });
  const end = b.toLocaleDateString(CALENDAR_LOCALE, {
    weekday: "short",
    month: "short",
    day: "numeric",
    ...(a.getFullYear() !== b.getFullYear() ? { year: "numeric" } : {}),
  });
  return `${start} — ${end}`;
}

/** @param {{ dir: "left" | "right" }} props */
function BookingChevron({ dir }) {
  const isL = dir === "left";
  return (
    <svg className="booking-cal-chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d={isL ? "M14 6l-6 6 6 6" : "M10 6l6 6-6 6"}
        stroke="currentColor"
        strokeWidth="1.85"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** @param {Date | undefined} d */
function longDateLabel(d) {
  if (!d || Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(CALENDAR_LOCALE, { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

function slotPluralSuffix(n) {
  return n === 1 ? "" : "s";
}

/** @param {string} name */
function initials(name) {
  const bits = name.trim().split(/\s+/).filter(Boolean);
  if (!bits.length) return "?";
  if (bits.length === 1) return bits[0].slice(0, 2).toUpperCase();
  return (bits[0][0] + bits[bits.length - 1][0]).toUpperCase();
}
