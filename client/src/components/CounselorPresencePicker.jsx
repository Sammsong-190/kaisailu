import { useEffect, useRef, useState } from "react";
import { useApi } from "../ApiProvider.jsx";

/** Same options as student presence — shared UX in portal header */
const OPTIONS = [
  { id: "online", label: "Online", dot: "#22c55e", ring: "rgba(34, 197, 94, 0.28)" },
  { id: "away", label: "Away", dot: "#eab308", ring: "rgba(234, 179, 8, 0.32)" },
  { id: "busy", label: "Busy", dot: "#ef4444", ring: "rgba(239, 68, 68, 0.28)" },
  { id: "offline", label: "Offline", dot: "#9ca3af", ring: "rgba(156, 163, 175, 0.35)" },
];

function storageKey(userId) {
  return `scwis-counselor-presence-${userId}`;
}

function StatusDot({ dot, ring }) {
  return (
    <span className="presence-dot-wrap" aria-hidden style={{ "--pd": dot, "--pr": ring }}>
      <span className="presence-dot" />
    </span>
  );
}

export default function CounselorPresencePicker() {
  const { user } = useApi();
  const uid = user?.id;
  const [open, setOpen] = useState(false);
  const [statusId, setStatusId] = useState("online");
  const rootRef = useRef(null);

  useEffect(() => {
    if (!uid || typeof window === "undefined") return;
    const stored = window.localStorage.getItem(storageKey(uid));
    if (stored && OPTIONS.some((o) => o.id === stored)) setStatusId(stored);
  }, [uid]);

  useEffect(() => {
    function onDoc(e) {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  if (!uid) return null;

  const active = OPTIONS.find((o) => o.id === statusId) ?? OPTIONS[0];

  function pick(id) {
    setStatusId(id);
    if (typeof window !== "undefined") window.localStorage.setItem(storageKey(uid), id);
    setOpen(false);
  }

  return (
    <div className="student-presence-picker counselor-presence-picker" ref={rootRef}>
      <button
        type="button"
        className="student-presence-trigger"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label="Your availability status"
      >
        <StatusDot dot={active.dot} ring={active.ring} />
        <span className="student-presence-trigger-label">{active.label}</span>
        <span className="student-presence-chevron" aria-hidden>
          ▾
        </span>
      </button>
      {open ? (
        <ul className="student-presence-menu" role="listbox">
          {OPTIONS.map((o) => (
            <li key={o.id} role="option" aria-selected={o.id === statusId}>
              <button type="button" className="student-presence-option" onClick={() => pick(o.id)}>
                <StatusDot dot={o.dot} ring={o.ring} />
                <span>{o.label}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
