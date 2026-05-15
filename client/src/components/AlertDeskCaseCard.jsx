import { Link } from "react-router-dom";

/**
 * Counselor Alert desk dense case row (risk pool columns).
 *
 * @param {{
 *   c: Record<string, unknown>;
 *   reviewPath: string;
 *   interventionPath: string;
 *   onApprove: () => void;
 *   onDismiss: () => void;
 *   onTier: (tier: string) => void;
 * }} props
 */
export default function AlertDeskCaseCard({ c, reviewPath, interventionPath, onApprove, onDismiss, onTier }) {
  const serial = typeof c.deskCaseSerial === "string" ? c.deskCaseSerial : String(c.caseId ?? "");
  const category = typeof c.riskCategory === "string" ? c.riskCategory : "Psychological concern";
  const progressRaw = typeof c.aiPatternProgressPct === "number" ? c.aiPatternProgressPct : 70;
  const progress = clampPct(progressRaw);
  const summary = typeof c.aiJudgmentSummary === "string" ? c.aiJudgmentSummary : "";
  const wf = typeof c.deskWorkflowStatus === "string" ? c.deskWorkflowStatus : "Pending";

  const statusClass =
    wf === "In progress"
      ? "alert-desk-status-progress"
      : wf === "Monitoring"
        ? "alert-desk-status-monitoring"
        : wf === "Reviewed"
          ? "alert-desk-status-reviewed"
          : "alert-desk-status-pending";

  const reviewStatus = String(c.reviewStatus ?? "");
  const decision = String(c.decision ?? "");

  let actions = null;
  if (reviewStatus === "pending") {
    actions = (
      <div className="alert-desk-case-actions">
        <button type="button" className="btn-sm ok" onClick={onApprove}>
          Confirm risk
        </button>
        <button type="button" className="btn-sm dismiss" onClick={onDismiss}>
          Dismiss alert
        </button>
      </div>
    );
  } else if (reviewStatus === "dismissed") {
    actions = <p className="alert-desk-case-dim">Dismissed · no active intervention.</p>;
  } else if (decision === "Pending") {
    actions = (
      <div className="alert-desk-tier-row">
        <button type="button" className="btn-sm-tier" onClick={() => onTier("Level 1")}>
          L1
        </button>
        <button type="button" className="btn-sm-tier" onClick={() => onTier("Level 2")}>
          L2
        </button>
        <button type="button" className="btn-sm-tier" onClick={() => onTier("Level 3")}>
          L3
        </button>
        <button type="button" className="btn-sm-tier ghost-tier" onClick={() => onTier("Monitor Only")}>
          Monitor
        </button>
      </div>
    );
  } else {
    actions = <p className="alert-desk-case-dim">Recorded: {decision}</p>;
  }

  return (
    <article className="alert-desk-case">
      <header className="alert-desk-case-head">
        <div className="alert-desk-case-ids">
          <code className="alert-desk-case-id">{serial}</code>
          <span className="alert-desk-case-canonical muted tiny-help">{String(c.caseId)}</span>
        </div>
        <span className={`alert-desk-status-pill ${statusClass}`}>{wf}</span>
      </header>
      <div className="alert-desk-case-name">{String(c.name ?? "")}</div>
      <dl className="alert-desk-dl">
        <div className="alert-desk-dl-row">
          <dt>Category</dt>
          <dd>{category}</dd>
        </div>
        <div className="alert-desk-dl-row alert-desk-ai-block">
          <dt>
            AI Identification Pattern{" "}
            <span className="alert-desk-progress-label">{progress}% fused</span>
          </dt>
          <dd>
            <div className="alert-desk-progress-track" aria-hidden>
              <div className="alert-desk-progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <p className="alert-desk-ai-summary">{summary}</p>
          </dd>
        </div>
      </dl>
      {actions}
      <footer className="alert-desk-case-foot">
        {reviewPath ? (
          <Link className="link-subtle" to={reviewPath}>
            Case review →
          </Link>
        ) : null}
        {interventionPath ? (
          <Link className="link-subtle" to={interventionPath}>
            Intervention →
          </Link>
        ) : null}
      </footer>
    </article>
  );
}

function clampPct(n) {
  return Math.min(95, Math.max(5, Math.round(Number(n))));
}
