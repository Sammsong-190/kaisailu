import { Link } from "react-router-dom";
import { useApi } from "../ApiProvider.jsx";

/** Full-viewport wrapper: same flowing backdrop + glass nav as homepage. */
export default function EntryLayout({ children }) {
  const { err } = useApi();

  return (
    <div className="entry-shell">
      <div className="scwis-flow-layer" aria-hidden />

      <header className="entry-topnav">
        <Link className="logo entry-logo" to="/">
          <span className="logo-mark">◇</span>SCWIS
        </Link>
        <div className="entry-topnav-links">
          <Link className="entry-nav-link ghost-link" to="/login">
            Sign in
          </Link>
        </div>
      </header>

      <main className="entry-main">
        {err ? (
          <div className="banner-err entry-api-banner" role="alert">
            {err}
          </div>
        ) : null}
        {children}
      </main>
    </div>
  );
}
