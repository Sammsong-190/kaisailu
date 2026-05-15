import { DEFAULT_STUDENTS, enrichStudents, readDataSharing, participatesInRiskSharing, DATA_SHARING_CHANNELS } from "./riskEngine.js";
import { seedChatThreadsFromRoster } from "./chatSeed.js";
import { attachDeskPresentationToCases, enrichArchiveCaseRows, deriveArchivedDecisionStatus } from "./caseDeskEnrichment.js";

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

function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function clampR(lo, hi, x) {
  return Math.min(hi, Math.max(lo, Math.round(Number(x))));
}

function sleepHrToFive(h) {
  const x = Number(h);
  if (!Number.isFinite(x)) return 3;
  if (x <= 4.5) return 1;
  if (x <= 5.5) return 2;
  if (x <= 6.5) return 3;
  if (x <= 7.5) return 4;
  return 5;
}

const MOOD_VARIANTS = [
  { key: "great", mood: "Fantastic" },
  { key: "good", mood: "Good" },
  { key: "ok", mood: "OK" },
  { key: "low", mood: "Low" },
  { key: "rough", mood: "Rough" },
];

const CHECKIN_NOTE_SNIPPETS = [
  "Heavy exam week",
  "Slept badly — noisy hall",
  "Better after counselling",
  "Skipped gym — deadline crunch",
  "Family chat helped calm down",
];

function syntheticCheckinsForStudent(student) {
  let seed = 0;
  for (let i = 0; i < student.id.length; i++) seed = seed * 33 + student.id.charCodeAt(i);
  const rnd = mulberry32(seed >>> 0);
  const baseStress = clampR(1, 5, Number(student.stress) || 3);
  const baseSleepQ = sleepHrToFive(student.sleep);
  const soc = clampR(1, 5, Math.round(Number(student.social ?? 6) / 2));
  const phy = clampR(1, 5, Number(student.gym) >= 5 ? 5 : Number(student.gym) >= 3 ? 4 : Number(student.gym) >= 1 ? 3 : 2);
  const lms = Number(student.lms ?? 60);
  const baseStudy = clampR(1, 5, lms < 52 ? 2 : lms > 82 ? 4 : 3);

  const entries = [];
  for (let i = 0; i < 14; i++) {
    const jitterS = rnd() - 0.45;
    const stress = clampR(1, 5, baseStress + Math.round(jitterS * 2.5 + ((i % 4) - 1)));
    const sleepQ = clampR(1, 5, baseSleepQ + Math.round((rnd() - 0.4) * 2));
    const study = clampR(1, 5, baseStudy + Math.round((rnd() - 0.4) * 2));
    const physicalActivity = clampR(1, 5, phy + Math.round((rnd() - 0.43) * 2));
    const socialLonely = clampR(1, 5, soc + Math.round((rnd() - 0.42) * 2));

    const moodScore = clampR(2, 5, Math.round((sleepQ + socialLonely + (6 - stress)) / 3 + rnd() * 1.8 - 0.6));
    const moodIdx = clampR(0, MOOD_VARIANTS.length - 1, 5 - moodScore);
    const { key: moodKey, mood: moodLabel } = MOOD_VARIANTS[moodIdx];

    const dayHop = Math.floor(16 + rnd() * 62) + i * Math.floor(8 + rnd() * 44);
    const t = Date.now() - dayHop * 3600000;

    let notes = "";
    if (rnd() > 0.68) notes = CHECKIN_NOTE_SNIPPETS[Math.floor(rnd() * CHECKIN_NOTE_SNIPPETS.length)];

    entries.push({
      t,
      stress,
      sleepQ,
      moodKey,
      mood: moodLabel,
      study,
      physicalActivity,
      socialLonely,
      notes,
    });
  }
  entries.sort((a, b) => b.t - a.t);
  return entries.slice(0, 24);
}

function seedSyntheticCheckins(students) {
  const out = {};
  for (const s of students) {
    out[s.id] = syntheticCheckinsForStudent(s);
  }
  return out;
}

function computeMetricPoint(view, casesOpen) {
  const consented = view.filter((s) => participatesInRiskSharing(s));
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
  const students = JSON.parse(JSON.stringify(DEFAULT_STUDENTS));
  const staff = [
    {
      id: "C01",
      name: "Dr. Elena Rivera",
      role: "Counselor",
      active: true,
      title: "LPC · trauma-informed · short-term CBT loops",
      department: "Student Psychological Services",
      bio:
        "Anchors anxious perfectionists navigating STEM weed-outs; bilingual intake (EN/ES). Workshops on sleep procrastination guilt, boundary scripts with supervisors, and post-hospital-step-down warm handoffs.",
    },
    {
      id: "C02",
      name: "Dr. Amaka Okonkwo",
      role: "Lead counselor",
      active: true,
      title: "Clinical director · systemic family lens",
      department: "Care & Advocacy Office",
      bio:
        "Families-of-origin dynamics, grief ambushes mid-semester, and nuanced consent conversations with athletics. Liaises with Title IX education partners; prefers narrative therapy homework between sessions.",
    },
    {
      id: "C03",
      name: "Dr. Zhen Mei Chen",
      role: "Counselor educator",
      active: true,
      title: "Academic resilience & writing anxiety",
      department: "Centre for Teaching & Learning Wellness",
      bio:
        "Hybrid drop-ins for SAP panels, visa-stress buffering, thesis paralysis. Scripts for asking extensions without shame plus peer-reviewed breathing GIF libraries for laptop-bound researchers.",
    },
  ];
  return {
    schemaVersion: 8,
    students,
    cases: [],
    caseArchive: [],
    metrics: { timeline: seedTimeline() },
    selectedId: DEFAULT_STUDENTS[0].id,
    logs: ["Server started", "Consent filter active", "Human-in-the-loop mode enabled"],
    settings: { high: 80, medium: 55, detectionMinScore: 48, retentionDays: 365 },
    session: { studentId: null },
    checkins: seedSyntheticCheckins(students),
    staff,
    chatThreads: seedChatThreadsFromRoster(JSON.parse(JSON.stringify(students)), staff),
  };
}

let state = blankState();

function ensureChatThreads() {
  if (!Array.isArray(state.chatThreads) || state.chatThreads.length === 0)
    state.chatThreads = seedChatThreadsFromRoster(state.students, state.staff);
}

/** CSV / linkage edge case: roster student has no seeded thread memberships */
function ensureWelcomeChatForStudent(sid) {
  if (!sid) return false;
  if (!state.students.some((s) => s.id === sid)) return false;
  ensureChatThreads();
  const participates = state.chatThreads.some((t) => Array.isArray(t.studentIds) && t.studentIds.includes(sid));
  if (participates) return false;

  const st = state.students.find((s) => s.id === sid);
  const firstName = typeof st?.name === "string" ? st.name.split(" ")[0] : sid;
  const now = Date.now();
  state.chatThreads.push({
    id: `chat-welcome-${sid}`,
    kind: "peer",
    title: `${firstName} · welcome`,
    subtitle: "Welcome — initial conversation for this student record",
    studentIds: [sid],
    counselorId: null,
    counselorName: null,
    readAtByViewer: {},
    messages: [
      {
        id: `msg-w-${sid}-sys`,
        ts: now - 3600000,
        senderKind: "SYSTEM",
        body:
          "This thread was created automatically. Make sure the student account is linked to a roster student ID that exists in the roster; you can keep messaging here once that link is in place.",
      },
    ],
  });
  logLine(`Chat · auto welcome thread → ${sid}`);
  pushMetrics(state);
  return true;
}

/** @param {{ id?: string } | null | undefined} th */
function ensureThreadReadMap(th) {
  if (!th || typeof th !== "object") return;
  if (!th.readAtByViewer || typeof th.readAtByViewer !== "object") th.readAtByViewer = {};
}

/**
 * @param {{ messages?: { ts?: number }[]; readAtByViewer?: Record<string, number> } } th
 * @param {string} viewerKey `stu:…` | `usr:…`
 */
function unreadCountForThread(th, viewerKey) {
  const msgs = Array.isArray(th.messages) ? th.messages : [];
  const lastTs = msgs.length ? Math.max(...msgs.map((m) => Number(m.ts) || 0)) : Date.now();
  const map = th.readAtByViewer && typeof th.readAtByViewer === "object" ? th.readAtByViewer : {};

  /** @type {number} */
  let readTs;
  if (!viewerKey) readTs = lastTs;
  else if (viewerKey.startsWith("stu:")) {
    const stored = typeof map[viewerKey] === "number" ? map[viewerKey] : null;
    readTs = stored != null ? stored : lastTs;
  } else if (viewerKey.startsWith("usr:")) {
    const stored = typeof map[viewerKey] === "number" ? map[viewerKey] : null;
    const demo = typeof th.counselorUnreadWatermark === "number" ? th.counselorUnreadWatermark : null;
    if (stored != null) readTs = stored;
    else if (demo != null) readTs = demo;
    else readTs = lastTs;
  } else readTs = lastTs;

  return msgs.filter((m) => {
    const ts = Number(m.ts);
    if (!m || Number.isNaN(ts)) return false;
    if (ts <= readTs) return false;
    if (m.senderKind === "SYSTEM") return false;
    if (viewerKey.startsWith("stu:")) {
      const sid = viewerKey.slice(4);
      if (m.senderKind === "STUDENT") return m.senderStudentId !== sid;
      if (m.senderKind === "STAFF") return true;
      return false;
    }
    if (viewerKey.startsWith("usr:")) return m.senderKind === "STUDENT";
    return false;
  }).length;
}

/**
 * @param {Record<string, unknown>} raw cloned thread
 * @param {string | null} viewerKey
 */
function decorateChatThreadForViewer(raw, viewerKey) {
  ensureThreadReadMap(raw);
  const unreadCount = viewerKey ? unreadCountForThread(raw, viewerKey) : 0;
  delete raw.readAtByViewer;
  delete raw.counselorUnreadWatermark;
  raw.unreadCount = unreadCount;
  return raw;
}

function bumpSenderReadCursor(th, viewer) {
  ensureThreadReadMap(th);
  const msgs = Array.isArray(th.messages) ? th.messages : [];
  const last = msgs.length ? Math.max(...msgs.map((m) => Number(m.ts) || 0)) : Date.now();
  if (viewer.role === "STUDENT" && viewer.studentProfileId) {
    const k = `stu:${viewer.studentProfileId}`;
    th.readAtByViewer[k] = Math.max(th.readAtByViewer[k] ?? 0, last);
  }
  if (viewer.role === "COUNSELOR" && viewer.viewerUserId) {
    const k = `usr:${viewer.viewerUserId}`;
    th.readAtByViewer[k] = Math.max(th.readAtByViewer[k] ?? 0, last);
  }
}

/** Rosters imported without check-ins leave ids with no keys; fill charts with synthetic history where needed */
function ensureSyntheticCheckinsForRoster() {
  if (!state.checkins || typeof state.checkins !== "object") state.checkins = {};
  for (const s of state.students) {
    const cur = state.checkins[s.id];
    if (!Array.isArray(cur) || cur.length === 0) state.checkins[s.id] = syntheticCheckinsForStudent(s);
  }
}

function logLine(message) {
  const t = new Date().toISOString().slice(11, 19);
  state.logs.unshift(`${t} — ${message}`);
  state.logs = state.logs.slice(0, 120);
}

function archiveRemovedCases(previousCases, nextStudentIds) {
  const nextIds = new Set(nextStudentIds);
  previousCases.forEach((c) => {
    if (!nextIds.has(c.studentId) && !c.archived && c.caseId) {
      const stamp = Date.now();
      state.caseArchive.unshift({
        ...JSON.parse(JSON.stringify(c)),
        archived: true,
        archivedAt: stamp,
        closedAt: stamp,
        closedReason: "Cleared — not flagged in latest detection run",
        decisionStatus: deriveArchivedDecisionStatus({ ...c, archivedAt: stamp, closedAt: stamp }),
      });
    }
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
    counselorAiFeedback: prev?.counselorAiFeedback ?? null,
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
  const detMin = Number(state.settings.detectionMinScore);
  const detThreshold = Number.isFinite(detMin) && detMin >= 0 ? detMin : state.settings.medium;
  const flagged = view.filter((s) => s.risk.score !== null && s.risk.score >= detThreshold);

  archiveRemovedCases(
    previous,
    flagged.map((s) => s.id),
  );

  state.cases = flagged.map((s) => mergedCase(s, preserved.get(s.id)));
  logLine(`${state.cases.length} AI signal(s). No automated intervention.`);
  pushMetrics(state);
}

/** Populate open cases on cold start and mix workflow states for demos. */
function seedVirtualOpenCases() {
  runDetection();
  const n = state.cases.length;
  for (let i = 0; i < n; i++) {
    const c = state.cases[i];
    const m = i % 7;
    if (m === 0) continue;
    if (m === 1) {
      state.cases[i] = {
        ...c,
        reviewStatus: "approved",
        decision: "Level 2",
        intervention: "Warm reminder and appointment suggestion",
        followUpLabel: "Week-by-week observation recommended",
      };
    } else if (m === 2) {
      state.cases[i] = {
        ...c,
        reviewStatus: "approved",
        decision: "Level 1",
        intervention: "Self-help resource pushed",
        followUpLabel: "Week-by-week observation recommended",
      };
    } else if (m === 3) {
      state.cases[i] = {
        ...c,
        reviewStatus: "approved",
        decision: "Monitor Only",
        intervention: "Monitor only",
        followUpLabel: "Monitoring",
      };
    } else if (m === 4) {
      state.cases[i] = {
        ...c,
        reviewStatus: "approved",
        decision: "Pending",
        intervention: "Risk confirmed — choose intervention tier",
        followUpLabel: "Tier selection pending",
      };
    } else if (m === 5) {
      state.cases[i] = {
        ...c,
        reviewStatus: "dismissed",
        decision: "Dismissed",
        intervention: "None",
        followUpLabel: "Closed",
      };
    } else if (m === 6) {
      state.cases[i] = {
        ...c,
        reviewStatus: "approved",
        decision: "Level 3",
        intervention: "Active counselor outreach scheduled",
        followUpLabel: "Week-by-week observation recommended",
      };
    }
  }
  pushMetrics(state);
}

seedVirtualOpenCases();

export const store = {
  snapshot(opts = {}) {
    ensureSyntheticCheckinsForRoster();
    ensureChatThreads();
    pushMetrics(state);
    const session =
      opts.sessionOverride && opts.sessionOverride.studentId !== undefined
        ? { studentId: opts.sessionOverride.studentId }
        : { ...state.session };
    return {
      students: enrichStudents(state),
      rawStudents: state.students,
      cases: attachDeskPresentationToCases(enrichStudents(state), JSON.parse(JSON.stringify(state.cases))),
      caseArchive: enrichArchiveCaseRows(enrichStudents(state), JSON.parse(JSON.stringify(state.caseArchive))),
      metrics: JSON.parse(JSON.stringify(state.metrics)),
      settings: { ...state.settings },
      logs: [...state.logs],
      session,
      selectedId: state.selectedId,
      staff: [...state.staff],
      checkins: JSON.parse(JSON.stringify(state.checkins)),
    };
  },

  getChatThreadsForViewer(jwtRole, jwtStudentId, sessionStudentId, viewerUserId) {
    ensureChatThreads();
    const roleKey = jwtRole == null ? null : String(jwtRole).toUpperCase();
    const uid = typeof viewerUserId === "string" && viewerUserId ? viewerUserId : null;

    const filterForStudentSid = (sid) =>
      JSON.parse(JSON.stringify(state.chatThreads)).filter(
        (t) => Array.isArray(t.studentIds) && sid && t.studentIds.includes(sid),
      );

    if (roleKey === "COUNSELOR") {
      const viewerKey = uid ? `usr:${uid}` : null;
      const all = JSON.parse(JSON.stringify(state.chatThreads));
      return all.filter((t) => t.kind === "counselor").map((t) => decorateChatThreadForViewer(t, viewerKey));
    }
    if (roleKey === "ADMIN") return [];

    const viewerSid = jwtStudentId || sessionStudentId || null;
    if (!viewerSid) return [];

    const viewerKey = `stu:${viewerSid}`;
    let filtered = filterForStudentSid(viewerSid);
    if (roleKey === "STUDENT" && jwtStudentId && filtered.length === 0 && ensureWelcomeChatForStudent(jwtStudentId))
      filtered = filterForStudentSid(viewerSid);
    return filtered.map((t) => decorateChatThreadForViewer(t, viewerKey));
  },

  /**
   * @param {{ role: 'STUDENT' | 'COUNSELOR' | 'GUEST_STUDENT'; studentProfileId?: string | null; viewerUserId?: string | null }} viewer
   * @param {string} threadId
   */
  markChatThreadRead(viewer, threadId) {
    ensureChatThreads();
    const tid = String(threadId || "").trim();
    if (!tid) throw new Error("Choose a conversation thread.");

    const th = state.chatThreads.find((t) => t.id === tid);
    if (!th) throw new Error("Thread not found.");

    const key =
      viewer.role === "COUNSELOR" && viewer.viewerUserId
        ? `usr:${viewer.viewerUserId}`
        : viewer.studentProfileId
          ? `stu:${viewer.studentProfileId}`
          : null;
    if (!key) throw new Error("Cannot resolve viewer for read receipt.");

    if (viewer.role === "STUDENT" || viewer.role === "GUEST_STUDENT") {
      if (!th.studentIds?.includes(viewer.studentProfileId)) throw new Error("You are not a member of this thread.");
    } else if (viewer.role === "COUNSELOR") {
      if (th.kind !== "counselor") throw new Error("Not a counseling thread.");
    } else throw new Error("Insufficient permission to update read state.");

    ensureThreadReadMap(th);
    const msgs = Array.isArray(th.messages) ? th.messages : [];
    const lastTs = msgs.length ? Math.max(...msgs.map((m) => Number(m.ts) || 0)) : Date.now();
    th.readAtByViewer[key] = Math.max(typeof th.readAtByViewer[key] === "number" ? th.readAtByViewer[key] : 0, lastTs);
    pushMetrics(state);
  },

  /**
   * @param {{ role: 'STUDENT'|'COUNSELOR'; studentProfileId?: string | null; viewerUserId?: string | null }} viewer
   * @param {{ threadId?: string; text?: string }} body
   */
  sendChat(viewer, body) {
    ensureChatThreads();
    const tid = String(body?.threadId || "").trim();
    const textRaw = String(body?.text ?? "").trim();
    if (!tid) throw new Error("Choose a conversation thread.");
    if (!textRaw) throw new Error("Message cannot be empty.");
    const text = textRaw.slice(0, 4000);

    const th = state.chatThreads.find((t) => t.id === tid);
    if (!th) throw new Error("Thread not found.");

    if (viewer.role === "STUDENT") {
      const sid = viewer.studentProfileId;
      if (!sid) throw new Error("Student profile is not linked to this account.");
      if (!th.studentIds?.includes(sid)) throw new Error("You are not a member of this thread.");
      const st = state.students.find((s) => s.id === sid);
      const entry = {
        id: `msg-${Date.now()}-${sid}`,
        ts: Date.now(),
        senderKind: "STUDENT",
        senderStudentId: sid,
        senderName: st?.name || sid,
        body: text,
      };
      th.messages.push(entry);
      th.messages.sort((a, b) => a.ts - b.ts);
      bumpSenderReadCursor(th, viewer);
      logLine(`Chat · peer/counselor thread ${tid} ← ${sid}`);
      pushMetrics(state);
      return;
    }

    if (viewer.role === "COUNSELOR") {
      if (th.kind !== "counselor") throw new Error("Counselors may reply only on counselling threads.");
      const staffRow = state.staff.find((s) => s.id === th.counselorId) || state.staff[0];
      const entry = {
        id: `msg-${Date.now()}-staff-${th.counselorId || ""}`,
        ts: Date.now(),
        senderKind: "STAFF",
        senderStaffId: staffRow?.id || th.counselorId,
        senderName: staffRow?.name || th.counselorName || "Counselor",
        body: text,
      };
      th.messages.push(entry);
      th.messages.sort((a, b) => a.ts - b.ts);
      bumpSenderReadCursor(th, viewer);
      logLine(`Chat · counselling thread ${tid} ← clinician`);
      pushMetrics(state);
      return;
    }

    throw new Error("Insufficient permission to send messages.");
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
    seedVirtualOpenCases();
    logLine("System data reset to defaults");
  },

  toggleConsent(studentId) {
    const sid = studentId || state.session.studentId || state.selectedId;
    state.students = state.students.map((x) => {
      if (x.id !== sid) return x;
      const cur = readDataSharing(x);
      const anyOn = DATA_SHARING_CHANNELS.some((k) => cur[k]);
      const unified = !anyOn;
      const dataSharing = Object.fromEntries(DATA_SHARING_CHANNELS.map((k) => [k, unified]));
      /** @type {Record<string, number | null>} */
      const access = {};
      for (const k of DATA_SHARING_CHANNELS) access[k] = unified ? Date.now() : null;
      logLine(`${sid} bulk consent → ${unified ? "all streams on" : "all streams off"}`);
      return { ...x, consent: unified, dataSharing, sharingAccessAt: access };
    });
    pushMetrics(state);
  },

  patchDataSharing(studentId, patchBody = {}) {
    const sid = studentId || state.session.studentId || state.selectedId;
    /** @type {Record<string, boolean>} */
    const delta = {};
    for (const k of DATA_SHARING_CHANNELS) {
      if (Object.prototype.hasOwnProperty.call(patchBody, k) && typeof patchBody[k] === "boolean") delta[k] = patchBody[k];
    }
    if (!Object.keys(delta).length) return;
    state.students = state.students.map((x) => {
      if (x.id !== sid) return x;
      const base = readDataSharing(x);
      const nextDs = /** @type {Record<string, boolean>} */ ({ ...base, ...delta });
      const consent = DATA_SHARING_CHANNELS.some((k) => nextDs[k]);
      const prevAccess =
        x.sharingAccessAt && typeof x.sharingAccessAt === "object" ? { ...x.sharingAccessAt } : {};
      /** @type {Record<string, number | null>} */
      const sharingAccessAt = { ...prevAccess };
      for (const k of Object.keys(delta)) {
        sharingAccessAt[k] = delta[k] ? Date.now() : null;
      }
      const keys = Object.keys(delta).join(", ");
      logLine(`${sid} data sharing ▸ ${keys}`);
      return {
        ...x,
        consent,
        dataSharing: nextDs,
        sharingAccessAt,
      };
    });
    pushMetrics(state);
  },

  updateStudent(studentId, patch) {
    state.students = state.students.map((x) => (x.id === studentId ? { ...x, ...patch } : x));
    pushMetrics(state);
  },

  pushCheckin(studentId, body = {}) {
    const moodKeys = ["great", "good", "ok", "low", "rough"];
    const mk = moodKeys.includes(body.moodKey) ? body.moodKey : "ok";
    const moodLabel =
      MOOD_VARIANTS.find((m) => m.key === mk)?.mood ||
      (typeof body.mood === "string" && body.mood.trim() ? body.mood.trim() : "OK");
    const stress = clampR(1, 5, body.stress ?? 3);
    const sleepQ = clampR(1, 5, body.sleepQ ?? sleepHrToFive(body.sleep) ?? 3);
    const study = clampR(1, 5, body.study ?? 3);
    const physicalActivity = clampR(1, 5, body.physicalActivity ?? 3);
    const socialLonely = clampR(1, 5, body.socialLonely ?? 3);
    const notes = String(body.notes || "").trim().slice(0, 800);

    if (!state.checkins[studentId]) state.checkins[studentId] = [];
    state.checkins[studentId].unshift({
      t: Date.now(),
      stress,
      sleepQ,
      moodKey: mk,
      mood: moodLabel,
      study,
      physicalActivity,
      socialLonely,
      notes,
    });
    state.checkins[studentId] = state.checkins[studentId].slice(0, 24);
    logLine(`${studentId} check-in (${mk}) stress=${stress} sleepQ=${sleepQ}`);
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

  setCaseAiFeedback(caseId, value) {
    const v = String(value || "").trim();
    const allowed = new Set(["accurate", "false_positive", "false_negative", "more_context"]);
    if (!allowed.has(v)) throw new Error("Invalid AI feedback selection.");
    state.cases = state.cases.map((c) => (c.caseId === caseId ? { ...c, counselorAiFeedback: v } : c));
    logLine(`AI calibration · ${caseId} · ${v}`);
    pushMetrics(state);
  },

  archiveCase(caseId) {
    const c = state.cases.find((x) => x.caseId === caseId);
    if (!c) return;
    state.cases = state.cases.filter((x) => x.caseId !== caseId);
    const at = Date.now();
    state.caseArchive.unshift(
      JSON.parse(
        JSON.stringify({
          ...c,
          archived: true,
          archivedAt: at,
          decisionStatus: deriveArchivedDecisionStatus({ ...c, archivedAt: at, closedAt: c.closedAt || at }),
        }),
      ),
    );
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
    state.checkins = seedSyntheticCheckins(rows);
    state.chatThreads = seedChatThreadsFromRoster(rows, state.staff);
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
      title: "Rotating clinician · replace via HR feed",
      department: "Central counselling intake",
      bio: "Professional biography pending integration with your HR or directory system.",
    });
    logLine("Staff placeholder added");
  },

  submitBooking(studentId, payload = {}) {
    const { counselorId, counselorName, date, slotStart, slotEnd, note } = payload || {};
    const who = counselorName || counselorId || "counselor";
    const slot = slotStart && slotEnd ? `${slotStart}–${slotEnd}` : "(unspecified)";
    const noteSnippet = note && String(note).trim() ? ` · Note: "${String(note).trim().slice(0, 120)}${String(note).trim().length > 120 ? "…" : ""}"` : "";
    logLine(`${studentId} booking hold · ${who} · ${date || "?"} ${slot}${noteSnippet}`);
    pushMetrics(state);
  },
};
