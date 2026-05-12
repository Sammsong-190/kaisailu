import { DEFAULT_STUDENTS, enrichStudents } from "./riskEngine.js";

function seedTimeline() {
  const now = Date.now();
  const pts = [];
  for (let i = 11; i >= 0; i--) {
    const t = new Date(now - i * 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    pts.push({
      t,
      highCount: Math.max(0, 2 + ((i + 3) % 4) - Math.floor(i / 5)),
      mediumPlus: Math.max(2, 4 + ((i + 5) % 5)),
      avgStress: Number((3.1 + (((i % 5) - 2) * 0.35)).toFixed(2)),
      openCases: Math.max(0, (i % 4) + 1),
      interventionRate: Math.min(0.92, Number((0.45 + ((12 - i) / 44)).toFixed(2))),
    });
  }
  return pts;
}

function computeMetricPoint(view, casesOpen) {
  const consented = view.filter((s) => s.consent);
  const highs = view.filter((s) => s.risk.level === "High").length;
  const mediumPlus = view.filter((s) => s.risk.level === "High" || s.risk.level === "Medium").length;
  let avgStress = 0;
  if (consented.length)
    avgStress =
      consented.reduce((a, s) => a + (Number.isFinite(s.stress) ? s.stress : 0), 0) /
      Math.max(1, consented.length);
  const open = casesOpen.filter((c) => !c.archived);
  const withTier = open.filter((c) => ["Level 1", "Level 2", "Level 3"].includes(c.decision));
  const improved = open.filter(
    (c) => Array.isArray(c.followUps) && c.followUps.length >= 1 && c.followUps.some((f) => f.effectiveness === "improving"),
  ).length;
  const denom = Math.max(1, withTier.length);
  return {
    t: new Date().toISOString().slice(0, 10),
    highCount: highs,
    mediumPlus,
    avgStress: Number(avgStress.toFixed(2)),
    openCases: open.length,
    interventionRate: Number(Math.min(0.96, improved / denom + withTier.length * 0.04).toFixed(2)),
  };
}

function pushMetrics(state) {
  const view = enrichStudents(state);
  const pt = computeMetricPoint(view, state.cases);
  const last = state.metrics.timeline[state.metrics.timeline.length - 1];
  if (!last || last.t !== pt.t) state.metrics.timeline.push(pt);
  else state.metrics.timeline[state.metrics.timeline.length - 1] = pt;
  state.metrics.timeline = state.metrics.timeline.slice(-52);
}

function blankState() {
  return {
    schemaVersion: 6,
    students: JSON.parse(JSON.stringify(DEFAULT_STUDENTS)),
    cases: [],
    caseArchive: [],
    metrics: { timeline: seedTimeline() },
    selectedId: DEFAULT_STUDENTS[0].id,
    logs: ["Server started", "Consent filter active", "Human-in-the-loop mode enabled"],
    settings: { high: 80, medium: 55, retentionDays: 365 },
    session: { studentId: null },
    checkins: {},
    staff: [
      { id: "C01", name: "Dr. Rivera", role: "Counselor", active: true },
      { id: "C02", name: "Dr. Okonkwo", role: "Lead counselor", active: true },
    ],
  };
}

let state = blankState();

function logLine(message) {
  const t = new Date().toISOString().slice(11, 19);
  state.logs.unshift(`${t} — ${message}`);
  state.logs = state.logs.slice(0, 120);
}

function archiveRemovedCases(previousCases, nextStudentIds) {
  const nextIds = new Set(nextStudentIds);
  previousCases.forEach((c) => {
    if (!nextIds.has(c.studentId) && !c.archived && c.caseId)
      state.caseArchive.unshift({
        ...JSON.parse(JSON.stringify(c)),
        closedAt: Date.now(),
        closedReason: "Cleared — not flagged in latest detection run",
      });
  });
  state.caseArchive = state.caseArchive.slice(0, 80);
}

/** Merge counselor workflow when refreshed signals return */
function mergedCase(enrichedStudent, prev) {
  const s = enrichedStudent;
  const base = {
    caseId: `CASE-${s.id}`,
    studentId: s.id,
    name: s.name,
    score: s.risk.score,
    level: s.risk.level,
    reasons: s.risk.reasons,
    openedAt: prev?.openedAt ?? Date.now(),
    counselorNotes: prev?.counselorNotes ? [...prev.counselorNotes] : [],
    followUps: prev?.followUps ? [...prev.followUps] : [],
    archived: false,
    archivedAt: null,
  };

  const hadActiveCare =
    prev &&
    prev.reviewStatus === "approved" &&
    ["Level 1", "Level 2", "Level 3"].includes(prev.decision);

  if (hadActiveCare) {
    return {
      ...base,
      reviewStatus: "approved",
      decision: prev.decision,
      intervention: prev.intervention,
      followUpLabel: prev.followUpLabel || "Follow-up in progress",
    };
  }

  if (prev && prev.reviewStatus === "dismissed") {
    return {
      ...base,
      reviewStatus: "pending",
      decision: "Pending",
      intervention: "New signal — requires counselor confirmation (previous dismissal not binding)",
      followUpLabel: "Not started",
    };
  }

  if (prev && prev.reviewStatus === "approved" && prev.decision === "Pending") {
    return {
      ...base,
      reviewStatus: "approved",
      decision: "Pending",
      intervention: "Risk confirmed — choose intervention tier",
      followUpLabel: prev.followUpLabel || "Tier selection pending",
    };
  }

  if (prev && prev.reviewStatus === "approved" && prev.decision === "Monitor Only") {
    return {
      ...base,
      reviewStatus: "approved",
      decision: "Monitor Only",
      intervention: prev.intervention || "Monitor only",
      followUpLabel: prev.followUpLabel || "Monitoring",
    };
  }

  return {
    ...base,
    reviewStatus: "pending",
    decision: "Pending",
    intervention: "Awaiting counselor confirmation of signal",
    followUpLabel: "Not started",
  };
}

function runDetection() {
  const previous = [...state.cases];
  const preserved = new Map(previous.map((c) => [c.studentId, JSON.parse(JSON.stringify(c))]));
  const view = enrichStudents(state);
  const flagged = view.filter((s) => s.risk.score !== null && s.risk.score >= state.settings.medium);

  archiveRemovedCases(
    previous,
    flagged.map((s) => s.id),
  );

  state.cases = flagged.map((s) => mergedCase(s, preserved.get(s.id)));
  logLine(`${state.cases.length} AI signal(s). No automated intervention.`);
  pushMetrics(state);
}

export const store = {
  snapshot(opts = {}) {
    pushMetrics(state);
    const session =
      opts.sessionOverride && opts.sessionOverride.studentId !== undefined
        ? { studentId: opts.sessionOverride.studentId }
        : { ...state.session };
    return {
      students: enrichStudents(state),
      rawStudents: state.students,
      cases: JSON.parse(JSON.stringify(state.cases)),
      caseArchive: JSON.parse(JSON.stringify(state.caseArchive)),
      metrics: JSON.parse(JSON.stringify(state.metrics)),
      settings: { ...state.settings },
      logs: [...state.logs],
      session,
      selectedId: state.selectedId,
      staff: [...state.staff],
      checkins: JSON.parse(JSON.stringify(state.checkins)),
    };
  },

  studentIds() {
    return state.students.map((s) => s.id);
  },

  hasStudentId(id) {
    return state.students.some((s) => s.id === id);
  },

  setStudentSession(studentId) {
    state.session.studentId = studentId;
    if (studentId) state.selectedId = studentId;
    logLine(`Student session → ${studentId || "logged out"}`);
    pushMetrics(state);
  },

  reset() {
    state = blankState();
    logLine("Demo database reset");
  },

  toggleConsent(studentId) {
    const sid = studentId || state.session.studentId || state.selectedId;
    let was = false;
    state.students = state.students.map((x) => {
      if (x.id !== sid) return x;
      was = !!x.consent;
      return { ...x, consent: !x.consent };
    });
    logLine(`${sid} ${was ? "withdrew" : "granted"} consent`);
    pushMetrics(state);
  },

  updateStudent(studentId, patch) {
    state.students = state.students.map((x) => (x.id === studentId ? { ...x, ...patch } : x));
    pushMetrics(state);
  },

  pushCheckin(studentId, { stress, sleep, mood, study }) {
    if (!state.checkins[studentId]) state.checkins[studentId] = [];
    state.checkins[studentId].unshift({
      t: Date.now(),
      stress,
      sleep,
      mood,
      study: study != null ? study : "",
    });
    state.checkins[studentId] = state.checkins[studentId].slice(0, 24);
    logLine(`${studentId} check-in: mood=${mood}, stress=${stress}, sleep=${sleep}`);
    pushMetrics(state);
  },

  runDetection,

  approveCase(caseId) {
    state.cases = state.cases.map((c) =>
      c.caseId === caseId && c.reviewStatus === "pending"
        ? {
            ...c,
            reviewStatus: "approved",
            intervention: "Risk confirmed — choose intervention tier",
          }
        : c,
    );
    logLine(`Counselor confirmed risk on ${caseId}`);
    pushMetrics(state);
  },

  dismissCase(caseId) {
    state.cases = state.cases.map((c) =>
      c.caseId === caseId
        ? {
            ...c,
            reviewStatus: "dismissed",
            decision: "Dismissed",
            intervention: "None",
            followUpLabel: "Closed",
          }
        : c,
    );
    logLine(`Dismissed alert ${caseId}`);
    pushMetrics(state);
  },

  decideTier(caseId, tier) {
    const cur = state.cases.find((c) => c.caseId === caseId);
    if (!cur || cur.reviewStatus !== "approved") {
      throw new Error("Risk must be confirmed before choosing a tier.");
    }
    state.cases = state.cases.map((c) =>
      c.caseId === caseId
        ? {
            ...c,
            decision: tier,
            intervention:
              tier === "Level 1"
                ? "Self-help resource pushed"
                : tier === "Level 2"
                  ? "Warm reminder and appointment suggestion"
                  : tier === "Level 3"
                    ? "Active counselor outreach scheduled"
                    : "Monitor only",
            followUpLabel: "Week-by-week observation recommended",
          }
        : c,
    );
    logLine(`Intervention tier for ${caseId}: ${tier}`);
    pushMetrics(state);
  },

  addCaseNote(caseId, text) {
    const line = String(text || "").trim();
    if (!line) return;
    state.cases = state.cases.map((c) =>
      c.caseId === caseId
        ? {
            ...c,
            counselorNotes: [{ at: Date.now(), text: line }, ...(c.counselorNotes || [])].slice(0, 40),
          }
        : c,
    );
    logLine(`Case note · ${caseId}`);
    pushMetrics(state);
  },

  addFollowUp(caseId, payload) {
    const { effectiveness, notes, weekLabel } = payload || {};
    const fc = state.cases.find((x) => x.caseId === caseId);
    const wi = ((fc?.followUps?.length) || 0) + 1;
    const entry = {
      weekLabel: weekLabel || `Week ${wi}`,
      recordedAt: Date.now(),
      effectiveness: effectiveness || "steady",
      notes: String(notes || "").trim(),
    };
    state.cases = state.cases.map((c) =>
      c.caseId !== caseId
        ? c
        : {
            ...c,
            followUps: [entry, ...(c.followUps || [])].slice(0, 14),
            followUpLabel: `${entry.weekLabel} · ${entry.effectiveness}`,
          },
    );
    logLine(`Follow-up · ${caseId}`);
    pushMetrics(state);
  },

  archiveCase(caseId) {
    const c = state.cases.find((x) => x.caseId === caseId);
    if (!c) return;
    state.cases = state.cases.filter((x) => x.caseId !== caseId);
    state.caseArchive.unshift(JSON.parse(JSON.stringify({ ...c, archived: true, archivedAt: Date.now() })));
    state.caseArchive = state.caseArchive.slice(0, 80);
    logLine(`Archived case ${caseId}`);
    pushMetrics(state);
  },

  setSettings(patch) {
    state.settings = { ...state.settings, ...patch };
    logLine(`Settings updated`);
    pushMetrics(state);
  },

  importStudents(rows) {
    state.students = rows;
    state.cases = [];
    state.caseArchive = [];
    state.selectedId = rows[0]?.id || state.selectedId;
    logLine(`${rows.length} student rows imported`);
    pushMetrics(state);
  },

  addStaffPlaceholder() {
    state.staff.push({
      id: `C${300 + state.staff.length}`,
      name: `Counselor ${state.staff.length + 1}`,
      role: "Counselor",
      active: true,
    });
    logLine("Staff placeholder added");
  },

  bookingDemo() {
    logLine("Appointment request captured (demo only)");
  },
};
