import "dotenv/config";
import express from "express";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { store } from "./store.js";
import { TREND, parseCSV, DATA_SHARING_CHANNELS } from "./riskEngine.js";
import { prisma } from "./prisma.js";
import { optionalAuth, requireLoggedIn, requireRoles } from "./authMiddleware.js";
import { snapshotForViewer, snapshotForPrismaUser } from "./snapshotUtil.js";
import { hashPassword, verifyPassword, signToken } from "./authUtil.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 8788;
const upload = multer({ storage: multer.memoryStorage() });

/** @param {import("@prisma/client").User} u */
function pubUser(u) {
  return {
    id: u.id,
    email: u.email,
    displayName: u.displayName,
    role: u.role,
    studentProfileId: u.studentProfileId,
  };
}

/** @typedef {readonly [typeof optionalAuth, typeof requireLoggedIn, ReturnType<typeof requireRoles>]} Chain */
/** @type {Chain} */
const adminOnlyCh = /** @type {const} */ ([optionalAuth, requireLoggedIn, requireRoles("ADMIN")]);
/** @type {Chain} */
const counselorOrAdminCh = /** @type {const} */ ([optionalAuth, requireLoggedIn, requireRoles("COUNSELOR", "ADMIN")]);
/** @type {Chain} */
const studentCh = /** @type {const} */ ([optionalAuth, requireLoggedIn, requireRoles("STUDENT")]);
const studentCounselorCh = /** @type {const} */ ([optionalAuth, requireLoggedIn, requireRoles("STUDENT", "COUNSELOR")]);

app.use(cors({ origin: true }));
app.use(express.json());

app.get("/api/health", (_, res) => res.json({ ok: true }));

app.get("/api/trend", (_, res) => res.json(TREND));

/** ---- Auth ---- */

app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, password, displayName, role: roleInput, studentProfileId } = req.body || {};
    const emailClean = String(email || "")
      .trim()
      .toLowerCase();
    const passwordStr = String(password || "");
    const role = String(roleInput || "").toUpperCase();
    const name = String(displayName || "").trim() || emailClean.split("@")[0] || "User";

    if (!emailClean || !passwordStr || passwordStr.length < 6)
      return res.status(400).json({ error: "Email and password required (password min 6 characters)." });
    if (role !== "STUDENT" && role !== "COUNSELOR") return res.status(400).json({ error: "Only STUDENT or COUNSELOR self-registration is allowed." });

    const exists = await prisma.user.findUnique({ where: { email: emailClean } });
    if (exists) return res.status(409).json({ error: "Email already registered." });

    let sid = null;
    if (role === "STUDENT") {
      sid = String(studentProfileId || "").trim();
      if (!sid || !store.hasStudentId(sid))
        return res.status(400).json({ error: "Choose a student record ID that exists in the current roster." });
    }

    const passwordHash = await hashPassword(passwordStr);
    const user = await prisma.user.create({
      data: {
        email: emailClean,
        passwordHash,
        displayName: name,
        role,
        studentProfileId: sid,
      },
    });

    const token = signToken(user);
    res.json({
      token,
      user: pubUser(user),
      snapshot: snapshotForPrismaUser(user),
    });
  } catch (e) {
    res.status(400).json({ error: String(e.message) });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const email = String(req.body?.email || "")
      .trim()
      .toLowerCase();
    const password = String(req.body?.password || "");
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await verifyPassword(password, user.passwordHash)))
      return res.status(401).json({ error: "Invalid email or password." });

    const token = signToken(user);
    res.json({
      token,
      user: pubUser(user),
      snapshot: snapshotForPrismaUser(user),
    });
  } catch (e) {
    res.status(500).json({ error: String(e.message) });
  }
});

app.get("/api/auth/me", optionalAuth, requireLoggedIn, (req, res) => {
  res.json({ user: pubUser(req.user) });
});

/** ---- Admin · users ---- */

app.get("/api/admin/users", ...adminOnlyCh, async (_req, res) => {
  const rows = await prisma.user.findMany({ orderBy: { createdAt: "desc" } });
  res.json({ users: rows.map(pubUser) });
});

app.patch("/api/admin/users/:id", ...adminOnlyCh, async (req, res) => {
  try {
    const id = req.params.id;
    const { displayName, email, role: rolePatch, studentProfileId: sidPatch, password } = req.body || {};

    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) return res.status(404).json({ error: "User not found." });

    const nextRole = rolePatch ? String(rolePatch).toUpperCase() : target.role;
    if (nextRole !== "ADMIN" && nextRole !== "STUDENT" && nextRole !== "COUNSELOR") {
      return res.status(400).json({ error: "Invalid role." });
    }

    if (target.role === "ADMIN" && nextRole !== "ADMIN") {
      const admins = await prisma.user.count({ where: { role: "ADMIN", id: { not: id } } });
      if (admins === 0) return res.status(400).json({ error: "At least one administrator must remain." });
    }

    /** @type {import('@prisma/client').Prisma.UserUpdateInput} */
    const data = {};

    if (displayName !== undefined) {
      const d = String(displayName).trim();
      if (!d) return res.status(400).json({ error: "Display name cannot be empty." });
      data.displayName = d;
    }

    if (email !== undefined) {
      const e = String(email)
        .trim()
        .toLowerCase();
      if (!e) return res.status(400).json({ error: "Email cannot be empty." });
      if (e !== target.email) {
        const clash = await prisma.user.findUnique({ where: { email: e } });
        if (clash) return res.status(409).json({ error: "Email already in use." });
        data.email = e;
      }
    }

    if (password !== undefined && String(password).length >= 6) data.passwordHash = await hashPassword(String(password));

    if (rolePatch) data.role = nextRole;

    const effRole = (data.role ?? target.role);
    let nextSid =
      sidPatch !== undefined && sidPatch !== null && sidPatch !== ""
        ? String(sidPatch).trim()
        : target.studentProfileId;

    if (effRole === "STUDENT") {
      if (sidPatch === "" || sidPatch === null)
        nextSid = null;
      if (!nextSid || !store.hasStudentId(nextSid))
        return res.status(400).json({ error: "STUDENT accounts must link a valid student record ID." });
      data.studentProfileId = nextSid;
    } else data.studentProfileId = null;

    const updated = await prisma.user.update({ where: { id }, data });

    res.json({ user: pubUser(updated) });
  } catch (e) {
    res.status(400).json({ error: String(e.message) });
  }
});

/** ---- State & domain ---- */

app.get("/api/state", optionalAuth, (req, res) => {
  try {
    res.json(snapshotForViewer(req.auth));
  } catch (e) {
    res.status(500).json({ error: String(e.message) });
  }
});

app.post("/api/session/student", optionalAuth, (req, res) => {
  if (req.auth) {
    if (req.auth.role === "STUDENT") return res.status(400).json({ error: "Signed-in students cannot pick a guest profile." });
    return res.status(403).json({ error: "Guest profile switch is not available while signed in." });
  }
  const { studentId } = req.body || {};
  store.setStudentSession(studentId ?? null);
  res.json(snapshotForViewer(null));
});

app.post("/api/consent/:id/toggle", ...studentCh, (req, res) => {
  if (req.params.id !== req.user.studentProfileId)
    return res.status(403).json({ error: "You can only toggle consent on your linked student record." });
  store.toggleConsent(req.params.id);
  res.json(snapshotForPrismaUser(req.user));
});

app.patch("/api/me/data-sharing", ...studentCh, (req, res) => {
  try {
    const body = req.body || {};
    /** @type {Record<string, boolean>} */
    const patch = {};
    for (const k of DATA_SHARING_CHANNELS) {
      if (typeof body[k] === "boolean") patch[k] = body[k];
    }
    store.patchDataSharing(req.user.studentProfileId, patch);
    res.json(snapshotForPrismaUser(req.user));
  } catch (e) {
    res.status(400).json({ error: String(e.message) });
  }
});

app.patch("/api/students/:id", ...adminOnlyCh, (req, res) => {
  store.updateStudent(req.params.id, req.body || {});
  res.json(snapshotForPrismaUser(req.user));
});

app.post("/api/checkins", ...studentCh, (req, res) => {
  const { studentId } = req.body || {};
  if (!studentId) return res.status(400).json({ error: "studentId required" });
  if (studentId !== req.user.studentProfileId) return res.status(403).json({ error: "You can only submit check-ins for your own linked student record." });
  store.pushCheckin(studentId, req.body || {});
  res.json(snapshotForPrismaUser(req.user));
});

app.post("/api/chat/send", ...studentCounselorCh, (req, res) => {
  try {
    /** @type {{ role: "STUDENT" | "COUNSELOR"; studentProfileId?: string | null }} */
    let viewer;
    if (req.user.role === "STUDENT") viewer = { role: "STUDENT", studentProfileId: req.user.studentProfileId };
    else if (req.user.role === "COUNSELOR") viewer = { role: "COUNSELOR" };
    else return res.status(403).json({ error: "Only students and counselors can send campus messages." });

    store.sendChat(viewer, req.body || {});
    res.json(snapshotForPrismaUser(req.user));
  } catch (e) {
    res.status(400).json({ error: String(e.message) });
  }
});

app.post("/api/detection/run", ...counselorOrAdminCh, (req, res) => {
  store.runDetection();
  res.json(snapshotForPrismaUser(req.user));
});

app.post("/api/cases/:caseId/approve", ...counselorOrAdminCh, (req, res) => {
  store.approveCase(req.params.caseId);
  res.json(snapshotForPrismaUser(req.user));
});

app.post("/api/cases/:caseId/dismiss", ...counselorOrAdminCh, (req, res) => {
  store.dismissCase(req.params.caseId);
  res.json(snapshotForPrismaUser(req.user));
});

app.post("/api/cases/:caseId/tier", ...counselorOrAdminCh, (req, res) => {
  try {
    const { tier } = req.body || {};
    store.decideTier(req.params.caseId, tier);
    res.json(snapshotForPrismaUser(req.user));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.post("/api/cases/:caseId/notes", ...counselorOrAdminCh, (req, res) => {
  store.addCaseNote(req.params.caseId, (req.body || {}).text);
  res.json(snapshotForPrismaUser(req.user));
});

app.post("/api/cases/:caseId/follow-up", ...counselorOrAdminCh, (req, res) => {
  store.addFollowUp(req.params.caseId, req.body || {});
  res.json(snapshotForPrismaUser(req.user));
});

app.post("/api/cases/:caseId/archive", ...counselorOrAdminCh, (req, res) => {
  store.archiveCase(req.params.caseId);
  res.json(snapshotForPrismaUser(req.user));
});

app.patch("/api/settings", ...adminOnlyCh, (req, res) => {
  store.setSettings(req.body || {});
  res.json(snapshotForPrismaUser(req.user));
});

app.post("/api/reset", ...adminOnlyCh, (req, res) => {
  store.reset();
  res.json(snapshotForPrismaUser(req.user));
});

app.post("/api/staff/placeholder", ...adminOnlyCh, (req, res) => {
  store.addStaffPlaceholder();
  res.json(snapshotForPrismaUser(req.user));
});

app.post("/api/bookings", ...studentCh, (req, res) => {
  store.submitBooking(req.user.studentProfileId, req.body || {});
  res.json(snapshotForPrismaUser(req.user));
});

app.post("/api/import/csv", ...adminOnlyCh, upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "file field required (multipart/form-data)" });
  const txt = req.file.buffer.toString("utf8");
  const rows = parseCSV(txt);
  if (!rows.length) return res.status(400).json({ error: "CSV not recognized" });
  store.importStudents(rows);
  res.json(snapshotForPrismaUser(req.user));
});

const spaDist = path.join(__dirname, "../../client/dist");
const spaIndex = path.join(spaDist, "index.html");

if (fs.existsSync(spaIndex)) {
  app.use(express.static(spaDist));
  app.use((req, res, next) => {
    if (req.path.startsWith("/api")) return next();
    if (req.method !== "GET") return next();
    res.sendFile(spaIndex);
  });
}

app.listen(PORT, () => {
  console.log(`SCWIS API http://localhost:${PORT}`);
  prisma
    .$connect()
    .then(() => console.log("[Prisma] connected"))
    .catch((e) => console.warn("[Prisma] not ready — run: npx prisma db push && npm run db:seed\n", e.message));
  if (!fs.existsSync(spaIndex)) {
    console.log("SPA not built yet — run: npm run build --prefix client — or npm run dev in client for proxy.");
  }
});
