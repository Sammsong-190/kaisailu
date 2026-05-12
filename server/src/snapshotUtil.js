import { store } from "./store.js";

/**
 * @param {{ role: string; studentProfileId?: string | null } | null | undefined} auth
 * From JWT / optionalAuth: when student, inject session for student portal.
 */
export function snapshotForViewer(auth) {
  if (auth?.role === "STUDENT" && auth.studentProfileId)
    return store.snapshot({ sessionOverride: { studentId: auth.studentProfileId } });
  return store.snapshot();
}
