import { Link } from "react-router-dom";

export default function CaseCard({
  c,
  reviewPath,
  interventionPath,
  onApprove,
  onDismiss,
  onTier,
  showTierSelection = true,
}) {
  const pill =
    c.level === "High"
      ? "high"
      : c.level === "Medium"
        ? "medium"
        : c.level === "Low"
          ? "low"
          : c.level === "Blocked"
            ? "blocked"
            : "balanced";
  const nNotes = (c.counselorNotes || []).length;
  const nFollow = (c.followUps || []).length;

  let body = null;
  if (c.reviewStatus === "pending") {
    body = (
      <div className="caseReview">
        <button type="button" className="btn-sm ok" onClick={onApprove}>
          Confirm risk
        </button>
        <button type="button" className="btn-sm dismiss" onClick={onDismiss}>
          Dismiss alert
        </button>
      </div>
    );
  } else if (c.reviewStatus === "dismissed") {
    body = <p className="dim">Dismissed — no intervention.</p>;
  } else if (c.decision === "Pending" && showTierSelection) {
    body = (
      <>
        <div className="caseActions">
          <button type="button" onClick={() => onTier("Level 1")}>
            Level 1
          </button>
          <button type="button" onClick={() => onTier("Level 2")}>
            Level 2
          </button>
          <button type="button" onClick={() => onTier("Level 3")}>
            Level 3
          </button>
        </div>
        <div className="caseActions single">
          <button type="button" onClick={() => onTier("Monitor Only")}>
            Monitor only
          </button>
        </div>
      </>
    );
  } else if (c.decision === "Pending" && !showTierSelection) {
    body = (
      <p className="dim">
        Risk confirmed — choose a tier in the{" "}
        {interventionPath ? (
          <Link className="link-subtle" to={interventionPath}>
            intervention workspace
          </Link>
        ) : (
          "intervention workspace"
        )}
        .
      </p>
    );
  } else body = <p className="dim">Recorded: {c.decision}</p>;

  return (
    <div className="case">
      <small>{c.caseId}</small>
      <h4>{c.name}</h4>
      <span className={`pill ${pill}`}>
        {c.level} · {c.score}
      </span>
      {c.reasons.slice(0, 4).map((r, i) => (
        <p key={i}>• {r}</p>
      ))}
      {body}
      <span className="decision">
        Status: {c.decision} · {c.followUpLabel || "—"}
      </span>
      <div className="case-meta muted">
        Counselor notes: {nNotes} · Follow-up entries: {nFollow}
      </div>
      <div className="case-links">
        {reviewPath && (
          <Link className="link-subtle" to={reviewPath}>
            Review &amp; confirm →
          </Link>
        )}
        {interventionPath && (
          <Link className="link-subtle" to={interventionPath}>
            Intervention &amp; follow-up →
          </Link>
        )}
      </div>
    </div>
  );
}
