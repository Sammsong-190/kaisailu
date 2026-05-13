/** BNBU + SCWIS identity for auth screens — uses optional remote emblem URL (`VITE_BNBU_EMBLEM_URL`), not bundled banner art. Links to official site / VI guidelines. */

const VI_GUIDE =
  "https://mpro.bnbu.edu.cn/en/For_Staff/Visual_Identity_Guidelines.htm";
const BNBU_HOME = "https://www.bnbu.edu.cn/en/";

/** @param {{ layout?: "aside" | "banner"; className?: string }} props */
export default function SchoolBrandingPanel({ layout = "banner", className = "" }) {
  const remoteEmblem = typeof import.meta.env?.VITE_BNBU_EMBLEM_URL === "string" ? import.meta.env.VITE_BNBU_EMBLEM_URL.trim() : "";

  return (
    <div className={`school-branding-panel school-branding-panel--${layout} ${className}`.trim()}>
      <div className="school-branding-panel-main">
        <a className="school-branding-emblem-link" href={BNBU_HOME} target="_blank" rel="noreferrer" aria-label="Visit BNBU official website">
          {remoteEmblem ? (
            <img src={remoteEmblem} alt="BNBU emblem (external)" className="school-branding-remote-emblem" loading="lazy" />
          ) : (
            <span className="school-branding-emblem-fallback" aria-hidden>
              <svg viewBox="0 0 88 88" className="school-branding-emblem-svg" aria-hidden focusable="false">
                <defs>
                  <linearGradient id="bnbu-emblem-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#1d4ed8" />
                    <stop offset="100%" stopColor="#1e3a8a" />
                  </linearGradient>
                </defs>
                <circle cx="44" cy="44" r="42" fill="url(#bnbu-emblem-grad)" />
                <text x="44" y="52" textAnchor="middle" fill="#fff" fontSize="19" fontWeight="800" fontFamily="system-ui, sans-serif">
                  BNBU
                </text>
              </svg>
            </span>
          )}
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
          <p className="school-branding-vi-note muted">
            Official logo files:{" "}
            <a href={VI_GUIDE} target="_blank" rel="noreferrer">
              BNBU visual identity (download)
            </a>
            .
            {remoteEmblem ? null : (
              <>
                {" "}
                Optional: set <code className="school-branding-code">VITE_BNBU_EMBLEM_URL</code> to a hosted emblem image URL.
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
