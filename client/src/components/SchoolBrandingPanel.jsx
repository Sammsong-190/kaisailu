/** Institution + SCWIS banner for sign-in / registration screens. Image lives in `/public/branding`. */
export default function SchoolBrandingPanel({ className = "" }) {
  return (
    <div className={`school-branding-panel ${className}`.trim()}>
      <img
        src="/branding/bnbu-scwis-banner.png"
        alt="BNBU — Beijing Normal–Hong Kong Baptist University. SCWIS — Smart Campus Wellness Information System."
        className="school-branding-banner-img"
        loading="lazy"
      />
    </div>
  );
}
