import { useState } from "react";
import { useNavigate } from "react-router-dom";

const AI_FEEDBACK_OPTS = [
  { value: "accurate", label: "Accurate" },
  { value: "false_positive", label: "False positive" },
  { value: "false_negative", label: "False negative" },
  { value: "more_context", label: "Need more context" },
];

function displayLevel(level) {
  const lv = String(level || "");
  if (lv === "High") return "high";
  if (lv === "Medium") return "Medium";
  if (lv === "Low") return "Low";
  return lv || "—";
}

/**
 * Counselor-side “Human Review Panel” mirroring AI summary + calibration + shortcuts.
 *
 * @param {{
 *   c: Record<string, unknown> | null;
 *   api: {
 *     approveCase: (id: string) => Promise<unknown>;
 *     dismissCase: (id: string) => Promise<unknown>;
 *     setCaseAiFeedback: (id: string, v: string) => Promise<unknown>;
 *   };
 *   interventionPath: string;
 * }} props
 */
export default function HumanReviewPanel({ c, api, interventionPath }) {
  const navigate = useNavigate();
  const [identityOpen, setIdentityOpen] = useState(false);

  if (!c) {
    return (
      <div className="human-review-panel spa-card human-review-panel--empty">
        <div className="human-review-head">
          <h4 className="human-review-title">
            <span className="human-review-icon" aria-hidden>
              ✓
            </span>
            Human Review Panel
          </h4>
          <p className="muted human-review-lead">Click a case row to load details.</p>
        </div>
      </div>
    );
  }

  const caseIdStr = String(c.caseId ?? "");
  const detail = typeof c.aiConcernDetail === "string" ? c.aiConcernDetail : String(c.aiJudgmentSummary || "").trim();
  const conf =
    typeof c.aiConfidencePct === "number"
      ? `${c.aiConfidencePct}%`
      : typeof c.score === "number"
        ? `${Math.min(96, Math.max(62, Math.round(Number(c.score) * 0.85)))}%`
        : "—";
  const pattern = typeof c.aiPatternSummary === "string" ? c.aiPatternSummary : "—";
  const lev = displayLevel(c.level);
  const currentFb = typeof c.counselorAiFeedback === "string" ? c.counselorAiFeedback : "";

  const pickAiFeedback = async (value) => {
    try {
      await api.setCaseAiFeedback(caseIdStr, value);
    } catch (e) {
      alert(String(e?.message || e));
    }
  };

  return (
    <div className="human-review-panel spa-card human-review-panel--filled">
      <div className="human-review-head">
        <h4 className="human-review-title">
          <span className="human-review-icon" aria-hidden>
            ✓
          </span>
          Human Review Panel
        </h4>
        <p className="muted human-review-meta">
          <code className="human-review-case-code">{typeof c.trackingCaseDisplayId === "string" ? c.trackingCaseDisplayId : caseIdStr}</code>
          {" · Level "}
          <span className="human-review-level">{lev}</span>
        </p>
      </div>

      <section className="human-review-ai-box" aria-label="AI concern summary">
        <p className="human-review-ai-caption">AI Concern Summary</p>
        <p className="human-review-ai-body">{detail || "—"}</p>
      </section>

      <dl className="human-review-metrics">
        <div>
          <dt>Confidence</dt>
          <dd>{conf}</dd>
        </div>
        <div>
          <dt>Pattern</dt>
          <dd>{pattern}</dd>
        </div>
      </dl>

      <button type="button" className="human-review-reveal btn secondary full" onClick={() => setIdentityOpen((x) => !x)}>
        {identityOpen ? "Hide identity" : "Reveal identity (assigned counselor only)"}
      </button>
      {identityOpen ? (
        <p className="human-review-identity-strip">
          <strong>{String(c.name || "Student")}</strong>
          {" · roster "}
          <code>{String(c.studentId || "")}</code>
        </p>
      ) : null}

      <div className="human-review-ai-calibration">
        <p className="human-review-cal-label muted">AI feedback — is this assessment aligned with what you observe?</p>
        <div className="human-review-chip-row">
          {AI_FEEDBACK_OPTS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              className={`human-review-chip ${currentFb === value ? "human-review-chip-active" : ""}`}
              onClick={() => pickAiFeedback(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="human-review-actions">
        <button type="button" className="human-review-act" onClick={() => api.approveCase(caseIdStr).catch((e) => alert(String(e.message)))}>
          <span aria-hidden>👤</span> Mark for counselor review
        </button>
        <button type="button" className="human-review-act" onClick={() => navigate("/app/counselor/messages")}>
          <span aria-hidden>✉️</span> Send supportive message
        </button>
        <button
          type="button"
          className="human-review-act"
          onClick={() => {
            if (interventionPath && interventionPath !== "#") navigate(interventionPath);
          }}
        >
          <span aria-hidden>📅</span> Schedule appointment
        </button>
        <button type="button" className="human-review-act" onClick={() => api.dismissCase(caseIdStr).catch((e) => alert(String(e.message)))}>
          <span aria-hidden>⏱</span> Dismiss after review
        </button>
        <button type="button" className="human-review-act" onClick={() => navigate("/app/counselor/messages")}>
          <span aria-hidden>💬</span> Open chat with student
        </button>
      </div>
    </div>
  );
}

export { displayLevel };
