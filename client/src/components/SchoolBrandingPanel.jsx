/** BNBU + SCWIS identity for auth screens — emblem from `/public/branding/bnbu-emblem.png`. */

const BNBU_EMBLEM_SRC = "/branding/bnbu-emblem.png";
const BNBU_HOME = "https://www.bnbu.edu.cn/en/";

/** @param {{ className?: string }} props */
export default function SchoolBrandingPanel({ className = "" }) {
  return (
    <div className={`school-branding-panel ${className}`.trim()}>
      <div className="school-branding-panel-main">
        <a className="school-branding-emblem-link" href={BNBU_HOME} target="_blank" rel="noreferrer" aria-label="Visit BNBU official website">
          <img src={BNBU_EMBLEM_SRC} alt="BNBU — Beijing Normal–Hong Kong Baptist University" className="school-branding-emblem-img" loading="lazy" />
        </a>
        <div className="school-branding-copy">
          <p className="school-branding-scwis-line">
            <strong>SCWIS</strong>
            <span className="school-branding-scwis-sub">Smart Campus Wellness Information System</span>
          </p>
          <p className="school-branding-uni">
            <a href={BNBU_HOME} target="_blank" rel="noreferrer">
              BNBU · 北师香港浸会大学
            </a>
          </p>
          <p className="school-branding-uni-en muted">Beijing Normal–Hong Kong Baptist University</p>
        </div>
      </div>
    </div>
  );
}
