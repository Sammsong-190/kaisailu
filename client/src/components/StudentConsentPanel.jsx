import { CHANNEL_ORDER, formatLastAccess, readSharingRecord } from "../consentChannels.js";

/** @typedef {{ snapshot: Record<string, unknown>; studentId: string; api: { patchMeDataSharing: (patch: Record<string, boolean>) => Promise<unknown> } }} Props */

/**
 * @param {Props} props
 */
export default function StudentConsentPanel({ snapshot, studentId, api }) {
  const s =
    snapshot && Array.isArray(snapshot.students) ? snapshot.students.find((x) => x.id === studentId) : undefined;
  if (!s) return null;

  const prefs = /** @type {Record<string, boolean>} */ (readSharingRecord(s));

  const setChannel = (key, enabled) => {
    api.patchMeDataSharing({ [key]: enabled });
  };

  return (
    <div className="student-privacy-stack">
      <section className="spa-card data-control-hero">
        <div className="data-control-hero-head">
          <span className="data-control-badge consent-based">Consent-based · you decide</span>
          <h3>Your data control center</h3>
          <p className="muted">
            Toggle each institutional or self-report stream independently. Counsellors see risk math only from categories you leave on.
            Turning everything off withholds automated screening signals derived from institutional feeds.
          </p>
        </div>
      </section>

      <section className="spa-card consent-panel-card">
        <div className="consent-panel-head">
          <h4>Consent &amp; privacy control</h4>
          <span className="data-control-badge privacy-first">Privacy-first</span>
        </div>
        <p className="muted tiny-help">Changes save immediately · not legal advice — follow your institution’s consent policy.</p>

        <ul className="consent-category-list">
          {CHANNEL_ORDER.map(({ key, title, datums, why }) => {
            const enabled = prefs[key];
            return (
              <li key={key} className="consent-category-row">
                <div className="consent-category-copy">
                  <div className="consent-category-title-row">
                    <h5>{title}</h5>
                    <ConsentSwitch
                      pressed={enabled}
                      onToggle={() => setChannel(key, !enabled)}
                      label={`Toggle ${title}`}
                    />
                  </div>
                  <ul className="consent-bullet-list muted tiny-help">{datums.map((ln) => <li key={ln}>{ln}</li>)}</ul>
                  <p className="consent-why">{why}</p>
                  <p className="consent-last muted tiny-help">{formatLastAccess(s, key)}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="spa-card consent-data-purpose-section" aria-labelledby="consent-purpose-heading">
        <h4 id="consent-purpose-heading">How authorised data powers SCWIS</h4>
        <div className="consent-purpose-grid">
          <div className="consent-purpose-main">
            <p className="muted tiny-help">
              Only the categories you enable feed risk analytics—and only authorised counselling &amp; wellbeing staff.
            </p>
            <ul className="purpose-list">
              <li>
                <strong>Care triage &amp; follow-up.</strong> Fused LMS, dining, recreation, library, and check-in sliders create risk{" "}
                <em>patterns</em> that cue human review—not a diagnosis and never punitive scoring on its own.
              </li>
              <li>
                <strong>Context for voluntary check-ins.</strong> Moody faces and notes attach to timelines so counselors honour the story{" "}
                <em>you</em> choose to share alongside campus signals you permit.
              </li>
              <li>
                <strong>Population insights.</strong> Administrators see anonymised cohort curves (titles like “overall stress trajectory”){" "}
                without student-level drill-down tied to unrelated classes.
              </li>
              <li>
                <strong>Operational transparency.</strong> Export logs (where enabled) summarise who accessed fused records; downloads acknowledge your request.
              </li>
              <li>
                <strong>Retention &amp; safeguards.</strong> Live deployments follow retention schedules governed by institutional policy.
              </li>
            </ul>
          </div>
          <aside className="consent-purpose-aside">
            <p className="purpose-aside-title">Takeaway</p>
            <p>Turn a stream off and it stops contributing to alerts as soon as the change is saved.</p>
            <p className="muted tiny-help">
              Counsellors cannot re-enable a stream without you; optional bulk shortcuts are for convenience during onboarding.
            </p>
          </aside>
        </div>
      </section>
    </div>
  );
}

/** @param {{ pressed: boolean; onToggle: () => void; label: string }} props */
function ConsentSwitch({ pressed, onToggle, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={pressed}
      aria-label={label}
      className={`consent-switch ${pressed ? "consent-switch-on" : ""}`}
      onClick={onToggle}
    >
      <span className="consent-switch-knob" />
    </button>
  );
}
