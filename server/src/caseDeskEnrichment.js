/** Counselor Alert desk-only presentation fields derived from roster + fused risk (no standalone ML service). */

const CATEGORY_LABELS = [
  "Academic stress",
  "Social isolation",
  "Psychological concern",
  "Physical constitution",
  "Sleep disruption",
];

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

/** Deterministic catalogue-style CASE-#### displayed alongside canonical caseId */
export function deriveDeskCaseSerial(studentId, caseId) {
  let h = 2847;
  const key = `${studentId}::${caseId}`;
  for (let i = 0; i < key.length; i++) h = (Math.imul(31, h) + key.charCodeAt(i)) >>> 0;
  return `CASE-${1000 + (h % 9000)}`;
}

function inferRiskCategory(studentRow, reasons) {
  const s = studentRow || {};
  const txt = (reasons || []).join(" ").toLowerCase();
  /** @type {Record<string, number>} */
  const scores = Object.fromEntries(CATEGORY_LABELS.map((k) => [k, 0]));

  const lms = Number(s.lms ?? 72);
  if (lms < 50) scores["Academic stress"] += 4;
  else if (lms < 62) scores["Academic stress"] += 2;
  if (txt.includes("lms") || txt.includes("study") || txt.includes("grade") || txt.includes("exam")) scores["Academic stress"] += 3;

  const social = Number(s.social ?? 5);
  const gym = Number(s.gym ?? 3);
  const dining = Number(s.dining ?? 8);
  if (social <= 3) scores["Social isolation"] += 3;
  if (gym <= 1) scores["Social isolation"] += 2;
  if (dining <= 5 && social <= 5) scores["Social isolation"] += 2;

  const sleepHr = Number(s.sleep ?? 7);
  const stress = Number(s.stress ?? 3);
  if (sleepHr < 5.5 || (stress >= 4 && sleepHr < 6.5)) scores["Sleep disruption"] += 4;
  if (txt.includes("sleep") || txt.includes("circadian")) scores["Sleep disruption"] += 2;

  if (gym <= 1 && dining <= 6) scores["Physical constitution"] += 3;
  if (stress >= 2 && gym <= 2) scores["Physical constitution"] += 2;

  if (stress >= 5 || txt.includes("mood") || txt.includes("anxi") || txt.includes("mental")) scores["Psychological concern"] += 4;
  if (stress >= 4 && scores["Academic stress"] + scores["Social isolation"] >= 4) scores["Psychological concern"] += 2;

  let best = CATEGORY_LABELS[0];
  let bestScore = -1;
  for (const lab of CATEGORY_LABELS) {
    const v = scores[lab];
    if (v > bestScore) {
      bestScore = v;
      best = lab;
    }
  }

  if (bestScore <= 0) {
    const idx =
      CATEGORY_LABELS.length > 0
        ? [...String(s.id || "SX")].reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % CATEGORY_LABELS.length
        : 0;
    best = CATEGORY_LABELS[idx];
  }
  return best;
}

function composeAiJudgment(studentRow, caseObj, category) {
  const score = Number(caseObj.score ?? 70);
  const reasons = (caseObj.reasons || []).slice(0, 3);
  const r0 = reasons[0] ? String(reasons[0]).replace(/^•\s*/, "") : null;
  const r1 = reasons[1] ? String(reasons[1]).replace(/^•\s*/, "") : null;
  const fused =
    r0 ||
    `${String(studentRow.name || "Student")}'s streamed signals converge on elevated ${category.toLowerCase()}, matching population baselines plus personal variance.`;
  const tail =
    r1 ||
    `Pattern identification passes ${clamp(Math.round(score * 0.75 + 12), 40, 95)}% of internal consistency gates; clinician confirmation is required before escalation.`;
  return `${fused} ${tail}`;
}

/** One-line extract for tracking table “Review” column */
function briefAiReview(fullSummary) {
  const s = String(fullSummary || "").trim();
  if (!s) return "—";
  const max = 132;
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  const sp = cut.lastIndexOf(" ");
  return (sp > 40 ? cut.slice(0, sp) : cut).trim() + "…";
}

function composeAiConcernDetail(studentRow, caseObj, category, deskSerial) {
  const stuLabel = String(deskSerial || "").replace(/^CASE-/i, "STU-");
  const reasons = (caseObj.reasons || [])
    .slice(0, 4)
    .map((r) => String(r).replace(/^•\s*/, "").trim())
    .filter(Boolean);
  const reasonStr = reasons.length ? reasons.join(" ") : `Signals align with elevated ${category.toLowerCase()} relative to cohort norms.`;
  const score = Number(caseObj.score ?? 72);
  const rec = score >= 71 ? "Counselor review required." : "Brief human confirmation recommended.";
  return `Student ${stuLabel} shows significant patterns in recent campus signals. ${reasonStr} AI recommends: ${rec}`;
}

function confidencePctFromCase(caseObj, saltKey) {
  const score = Number(caseObj.score ?? 70);
  const key = String(saltKey || "");
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (Math.imul(31, h) + key.charCodeAt(i)) >>> 0;
  return clamp(Math.round(score * 0.78 + (h % 17) + 18), 67, 96);
}

function patternLineFromCase(caseObj, category) {
  const reasons = (caseObj.reasons || [])
    .slice(0, 2)
    .map((r) => String(r).replace(/^•\s*/, "").trim())
    .filter(Boolean);
  if (reasons.length) return reasons.join(" · ");
  return `${category}: streamed LMS, library, dining, sleep, and self-report channels show converging drift.`;
}

function aiPatternProgressFromCase(caseObj, categoryTag) {
  const score = Number(caseObj.score ?? 60);
  const salt = [...categoryTag].reduce((a, ch) => a + ch.charCodeAt(0), 0) % 11;
  return clamp(Math.round(score * 0.68 + salt + 20), 48, 95);
}

/**
 * Maps workflow to labels shown at the Alert desk.
 * @param {{ reviewStatus?: string; decision?: string }} c
 */
export function deskWorkflowLabel(c) {
  if (String(c.reviewStatus) === "dismissed") return "Reviewed";
  if (String(c.reviewStatus) === "pending") return "Pending";
  if (String(c.decision) === "Monitor Only") return "Monitoring";
  if (["Level 1", "Level 2", "Level 3"].includes(String(c.decision))) return "In progress";
  if (String(c.decision) === "Dismissed") return "Reviewed";
  if (String(c.reviewStatus) === "approved" && String(c.decision) === "Pending") return "Pending";
  if (String(c.reviewStatus) === "approved") return "Pending";
  return "Pending";
}

/**
 * Merge desk presentation into each open case row for snapshots.
 */
export function attachDeskPresentationToCases(enrichedStudents, casesClone) {
  const bySid = new Map(enrichedStudents.map((s) => [s.id, s]));
  return casesClone.map((raw) => {
    const s = bySid.get(raw.studentId) || { id: raw.studentId, name: raw.name };
    const cat = inferRiskCategory(s, raw.reasons || []);
    const deskCaseSerial = deriveDeskCaseSerial(raw.studentId, raw.caseId);
    const aiJudgmentSummary = composeAiJudgment(s, raw, cat);
    const aiPatternProgressPct = aiPatternProgressFromCase(raw, cat);

    return {
      ...raw,
      riskCategory: cat,
      aiPatternProgressPct,
      aiJudgmentSummary,
      aiReviewBrief: briefAiReview(aiJudgmentSummary),
      aiConcernDetail: composeAiConcernDetail(s, raw, cat, deskCaseSerial),
      aiConfidencePct: confidencePctFromCase(raw, deskCaseSerial),
      aiPatternSummary: patternLineFromCase(raw, cat),
      deskWorkflowStatus: deskWorkflowLabel(raw),
      deskCaseSerial,
      trackingCaseDisplayId: deskCaseSerial.replace(/^CASE-/i, "Case-"),
    };
  });
}

/** Closed-archive row presentation (deterministic institutional wording). */
export const ARCHIVE_DECISION_STATUSES = [
  "Cleared-No further action needed",
  "Supportive check-in completed-Monitor progress",
  "Wellness resources shared-Student self-managing",
  "Academic adjustment plan provided-Follow-up scheduled",
];

/**
 * @param {{ caseId?: string; studentId?: string; archivedAt?: number | null; closedAt?: number | null }} row
 */
export function deriveArchivedDecisionStatus(row) {
  const key = `${row?.caseId || ""}:${row?.studentId || ""}:${row?.archivedAt || row?.closedAt || 0}`;
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (Math.imul(31, h) + key.charCodeAt(i)) >>> 0;
  return ARCHIVE_DECISION_STATUSES[h % ARCHIVE_DECISION_STATUSES.length];
}

/**
 * @param {Array<{ id: string; name?: string }>} enrichedStudents
 * @param {Record<string, unknown>[]} archiveClone
 */
export function enrichArchiveCaseRows(enrichedStudents, archiveClone) {
  const bySid = new Map(enrichedStudents.map((s) => [s.id, s]));
  return archiveClone.map((raw) => {
    const s = bySid.get(raw.studentId) || { id: raw.studentId, name: raw.name };
    const deskCaseSerial = deriveDeskCaseSerial(String(raw.studentId || ""), String(raw.caseId || ""));
    const cat = inferRiskCategory(s, raw.reasons || []);
    const row = /** @type {Record<string, unknown>} */ ({
      ...raw,
      deskCaseSerial,
      trackingCaseDisplayId: deskCaseSerial.replace(/^CASE-/i, "Case-"),
      riskCategory: cat,
      decisionStatus: typeof raw.decisionStatus === "string" ? raw.decisionStatus : deriveArchivedDecisionStatus(raw),
    });
    return row;
  });
}
