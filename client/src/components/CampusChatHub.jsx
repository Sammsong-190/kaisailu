import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useApi } from "../ApiProvider.jsx";

/** Match English UI copy regardless of browser locale. */
const DISPLAY_LOCALE = "en-US";

function formatChatTime(ts) {
  if (!ts) return "";
  try {
    return new Date(ts).toLocaleTimeString(DISPLAY_LOCALE, { hour: "numeric", minute: "2-digit" });
  } catch {
    return "";
  }
}

function formatThreadPreviewTime(ts) {
  if (!ts) return "";
  try {
    const d = new Date(ts);
    const now = Date.now();
    const isToday = d.toDateString() === new Date(now).toDateString();
    if (isToday) return formatChatTime(ts);
    return d.toLocaleDateString(DISPLAY_LOCALE, { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

/** @param {{ mode: "student" | "counselor" }} props */
export default function CampusChatHub({ mode }) {
  const { snapshot, api, user } = useApi();
  const threads = snapshot?.chatThreads ?? [];

  const scrollRef = useRef(null);
  const [selectedId, setSelectedId] = useState(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const ids = new Set(threads.map((t) => t.id));
    setSelectedId((cur) => (cur && ids.has(cur) ? cur : threads[0]?.id ?? null));
  }, [threads]);

  const active = useMemo(() => threads.find((t) => t.id === selectedId) ?? null, [threads, selectedId]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [active?.id, active?.messages?.length]);

  useEffect(() => {
    if (!selectedId) return;
    api.markCampusChatRead({ threadId: selectedId }).catch(() => {});
  }, [selectedId, api]);

  const bubbleMine = useCallback(
    (msg) => {
      if (msg.senderKind === "SYSTEM") return false;
      if (mode === "counselor")
        return msg.senderKind === "STAFF" && !!active?.counselorId && msg.senderStaffId === active.counselorId;
      const sid = user?.studentProfileId;
      return msg.senderKind === "STUDENT" && !!sid && msg.senderStudentId === sid;
    },
    [mode, user?.studentProfileId, active?.counselorId],
  );

  const send = useCallback(async () => {
    if (!selectedId || !draft.trim()) return;
    setSending(true);
    try {
      await api.sendCampusChat({ threadId: selectedId, text: draft.trim() });
      setDraft("");
    } catch (e) {
      alert(String(e?.message || e));
    } finally {
      setSending(false);
    }
  }, [api, draft, selectedId]);

  if (!snapshot) return <p className="muted">Loading workspace…</p>;

  const studentNeedsLink = mode === "student" && snapshot.chatStudentLinked === false;

  if (studentNeedsLink) {
    return (
      <div className="campus-chat-shell">
        <div className="spa-card campus-chat-linked-warn">
          <h3>Roster student ID not linked</h3>
          <p className="muted">
            Messages is only available for <strong>Student</strong> accounts linked to a roster student ID. In the admin portal, open <strong>Users</strong> and link a valid ID that matches an entry in the roster.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="campus-chat-shell">
      <header className="campus-chat-hero">
        <div className="campus-chat-hero-text">
          <p className="campus-chat-eyebrow">Messages</p>
          <h2 className="campus-chat-title">Campus chat</h2>
          <p className="campus-chat-intro">
            {mode === "counselor"
              ? "Review and reply to counseling threads assigned to you. Information is visible only to authorized staff."
              : "Message peer groups and counselors. Share personal details only when it feels appropriate."}
          </p>
        </div>
        <span className="campus-chat-hero-mark" aria-hidden>
          💬
        </span>
      </header>

      <div className="campus-chat-split">
        <aside className="campus-chat-threads" aria-label="Conversation list">
          <div className="campus-chat-aside-head flex-between">
            <h4 className="campus-chat-aside-title">Inbox</h4>
            <span className="campus-chat-count">{threads.length}</span>
          </div>
          <div className="campus-chat-threads-scroll">
            {threads.length === 0 ? (
              <p className="muted campus-chat-empty">No conversations visible for this account.</p>
            ) : (
              <ul className="campus-chat-thread-list" role="listbox" aria-label="Message threads">
                {threads.map((t) => {
                  const last = Array.isArray(t.messages) ? t.messages[t.messages.length - 1] : null;
                  const preview =
                    typeof last?.body === "string" ? (last.body.length > 52 ? `${last.body.slice(0, 49)}…` : last.body) : "";
                  const glyph = t.kind === "counselor" ? "⚕️" : "🌿";
                  const stamp = formatThreadPreviewTime(last?.ts);
                  const unread = typeof t.unreadCount === "number" ? t.unreadCount : 0;
                  const unreadLabel = unread > 9 ? "9+" : String(unread);
                  const showUnreadBadge = unread > 0 && selectedId !== t.id;

                  return (
                    <li key={t.id}>
                      <button
                        type="button"
                        className={`campus-chat-thread-card ${selectedId === t.id ? "campus-chat-thread-active" : ""}`}
                        onClick={() => setSelectedId(t.id)}
                        role="option"
                        aria-selected={selectedId === t.id}
                      >
                        <span className="campus-chat-thread-avatar-wrap">
                          <span className={`campus-chat-thread-avatar ${t.kind === "counselor" ? "campus-chat-avatar-cdr" : ""}`} aria-hidden>
                            <span>{glyph}</span>
                          </span>
                          {showUnreadBadge ? (
                            <span className="campus-chat-thread-unread-badge" aria-label={`${unread} unread messages`}>
                              {unreadLabel}
                            </span>
                          ) : null}
                        </span>
                        <span className="campus-chat-thread-body">
                          <span className="campus-chat-thread-top flex-between">
                            <span className="campus-chat-thread-kind">{t.kind === "peer" ? "Peer pod" : "Counseling"}</span>
                            {stamp ? <span className="campus-chat-thread-time">{stamp}</span> : null}
                          </span>
                          <span className="campus-chat-thread-title">{t.title}</span>
                          {preview ? <span className="campus-chat-thread-preview muted">{preview}</span> : null}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </aside>
        <section className="campus-chat-pane" aria-label="Active conversation">
          {!active ? (
            <div className="campus-chat-empty-pane">
              <span className="campus-chat-empty-icon" aria-hidden>
                📮
              </span>
              <p className="muted">Pick a conversation on the left to open the transcript.</p>
            </div>
          ) : (
            <>
              <header className="campus-chat-transcript-head">
                <div>
                  <span
                    className={`campus-chat-type-badge ${active.kind === "peer" ? "campus-chat-type-peer" : "campus-chat-type-cdr"}`}
                  >
                    {active.kind === "peer" ? "Peer circle" : "Counseling"}
                  </span>
                  <h3 className="campus-chat-transcript-title">{active.title}</h3>
                  <p className="campus-chat-subtitle muted">{active.subtitle}</p>
                </div>
              </header>
              <div className="campus-chat-scroll" ref={scrollRef} role="log" aria-live="polite">
                {(active.messages || []).map((m) => {
                  const system = m.senderKind === "SYSTEM";
                  const mine = bubbleMine(m);
                  const who =
                    system
                      ? "System"
                      : m.senderName ||
                        (m.senderKind === "STUDENT" ? m.senderStudentId : "") ||
                        "Participant";
                  return (
                    <div key={m.id} className={`campus-chat-row ${mine ? "campus-chat-row-mine" : ""} ${system ? "campus-chat-row-sys" : ""}`}>
                      {mine && !system ? <span className="campus-chat-row-spacer" aria-hidden /> : null}
                      {!mine && !system ? (
                        <span className="campus-chat-avatar-small" aria-hidden>
                          {(who || "?").slice(0, 1).toUpperCase()}
                        </span>
                      ) : null}
                      {system ? (
                        <span className="campus-chat-avatar-small campus-chat-avatar-sys" aria-hidden>
                          ⓘ
                        </span>
                      ) : null}
                      <div className="campus-chat-turn">
                        {!system ? (
                          <div className="campus-chat-meta">
                            <span className="campus-chat-who">{who}</span>
                            <span className="campus-chat-time">{formatChatTime(m.ts)}</span>
                          </div>
                        ) : (
                          <div className="campus-chat-meta campus-chat-meta-sys">
                            <span className="campus-chat-time">{formatChatTime(m.ts)}</span>
                          </div>
                        )}
                        <div
                          className={`campus-chat-bubble ${mine ? "campus-chat-bubble-mine" : ""} ${system ? "campus-chat-bubble-sys" : ""} ${
                            m.senderKind === "STAFF" && !mine ? "campus-chat-bubble-staff" : ""
                          }`}
                        >
                          {m.body}
                        </div>
                      </div>
                      {mine && !system ? (
                        <span className="campus-chat-avatar-small campus-chat-avatar-me" aria-hidden>
                          {(user?.displayName || who || "Me").slice(0, 1).toUpperCase()}
                        </span>
                      ) : null}
                    </div>
                  );
                })}
              </div>
              <footer className="campus-chat-composer">
                <label htmlFor={`chat-body-${selectedId ?? "x"}`} className="sr-only">
                  Message
                </label>
                <div className="campus-chat-composer-inner">
                  <textarea
                    id={`chat-body-${selectedId ?? "x"}`}
                    rows={2}
                    className="campus-chat-input"
                    placeholder={mode === "counselor" ? "Write a reply…" : "Say something supportive…"}
                    value={draft}
                    onChange={(ev) => setDraft(ev.target.value)}
                    disabled={sending}
                    onKeyDown={(ev) => {
                      if ((ev.ctrlKey || ev.metaKey) && ev.key === "Enter") send();
                    }}
                  />
                  <button
                    type="button"
                    className="btn campus-chat-send-btn"
                    disabled={sending || !draft.trim()}
                    onClick={() => send()}
                    title="Send (⌘/Ctrl + Enter)"
                  >
                    Send
                  </button>
                </div>
                <p className="muted campus-chat-send-hint">
                  <kbd className="campus-chat-kbd">⌘</kbd>
                  &nbsp;/&nbsp;
                  <kbd className="campus-chat-kbd">Ctrl</kbd>
                  &nbsp;+&nbsp;
                  <kbd className="campus-chat-kbd">Enter</kbd>
                  {" · "}
                  {mode === "counselor"
                    ? "Staff replies appear on counselling threads only."
                    : "Peers can’t access clinician-only desks."}
                </p>
              </footer>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
