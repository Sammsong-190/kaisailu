import { useMemo } from "react";
import { APPOINTMENT_DAYS, buildAppointmentTimetableRows } from "../appointmentTimetableDemo.js";

/**
 * Weekly appointment grid (illustrative) — counselor “Appointment table” screen.
 *
 * @param {{ caseDisplayIds: string[] }} props
 */
export default function AppointmentTableSection({ caseDisplayIds }) {
  const rows = useMemo(() => buildAppointmentTimetableRows(Array.isArray(caseDisplayIds) ? caseDisplayIds : []), [caseDisplayIds]);

  return (
    <>
      <h3 className="spa-row appointment-table-section-title">Appointment table</h3>
      <p className="muted appointment-section-lead">
        Illustrative weekly grid — case-linked slots show roster case id and follow-up label; other booked blocks are marked as consultation hours.
      </p>
      <div className="appointment-table-card spa-card">
        <p className="appointment-table-caption">Timetable — 2025-2026 Semester 2 (illustrative)</p>
        <div className="appointment-table-scroll">
          <table className="appointment-timetable">
            <thead>
              <tr>
                <th scope="col" className="appointment-timetable-timecol">
                  Time
                </th>
                {APPOINTMENT_DAYS.map((d) => (
                  <th key={d} scope="col">
                    {d}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.time}>
                  <th scope="row" className="appointment-timetable-timecol">
                    {row.time}
                  </th>
                  {row.cells.map((cell, i) => {
                    const key = `${row.time}-${i}`;
                    if (cell.type === "empty") return <td key={key} className="appointment-cell appointment-cell-empty" />;

                    if (cell.type === "consultation")
                      return (
                        <td key={key} className="appointment-cell appointment-cell-consult">
                          <span className="appointment-consult-label">Consultation hour</span>
                        </td>
                      );

                    return (
                      <td key={key} className="appointment-cell appointment-cell-case">
                        <div className="appointment-case-block">
                          <div>
                            <span className="appointment-k">Case:</span> <code className="appointment-case-code">{cell.caseDisplay}</code>
                          </div>
                          <div>
                            <span className="appointment-k">Label:</span> <span className="appointment-label-text">{cell.label}</span>
                          </div>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
