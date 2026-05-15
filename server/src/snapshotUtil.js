import { store } from "./store.js";

/**
 * Normalize role from JWT or Prisma (defensive).
 * @param {string | null | undefined} r
 */
function viewerRoleUpper(r) {
  if (r == null) return null;
  return String(r).toUpperCase();
}

/**
 * Snapshot filtered for the bearer JWT context (`optionalAuth` sets `req.auth`).
 * @param {{ role?: string | null; studentProfileId?: string | null; userId?: string | null } | null | undefined} auth
 */
export function snapshotForViewer(auth) {
  const role = viewerRoleUpper(auth?.role);
  const sid = auth?.studentProfileId ?? null;
  const viewerUserId = typeof auth?.userId === "string" && auth.userId ? auth.userId : null;

  let snap;
  if (role === "STUDENT" && sid) snap = store.snapshot({ sessionOverride: { studentId: sid } });
  else snap = store.snapshot();

  snap.chatThreads = store.getChatThreadsForViewer(role, sid, snap.session?.studentId ?? null, viewerUserId);
  snap.chatStudentLinked = role !== "STUDENT" || Boolean(sid);
  return snap;
}

/** Signed-in HTTP user rows from Prisma (login mutations, counselor/admin POST handlers). */
export function snapshotForPrismaUser(user) {
  if (!user) return snapshotForViewer(null);
  return snapshotForViewer({
    role: String(user.role || "").toUpperCase(),
    studentProfileId: user.studentProfileId ?? null,
    userId: user.id ?? null,
  });
}
