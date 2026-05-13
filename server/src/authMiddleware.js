import { prisma } from "./prisma.js";
import { verifyToken } from "./authUtil.js";

export function optionalAuth(req, _res, next) {
  req.auth = null;
  const h = req.headers.authorization;
  if (!h?.startsWith("Bearer ")) return next();
  const token = h.slice(7);
  const payload = verifyToken(token);
  if (!payload || !payload.sub) return next();
  req.auth = {
    userId: payload.sub,
    role: typeof payload.role === "string" ? payload.role.toUpperCase() : payload.role,
    studentProfileId: payload.sid || null,
  };
  next();
}

export async function requireLoggedIn(req, res, next) {
  if (!req.auth) return res.status(401).json({ error: "Sign in required." });
  try {
    const user = await prisma.user.findUnique({ where: { id: req.auth.userId } });
    if (!user) return res.status(401).json({ error: "Session invalid or expired." });
    req.user = user;
    next();
  } catch (e) {
    res.status(500).json({ error: String(e.message) });
  }
}

/** @param {import('@prisma/client').Role[]} roles */
export function requireRoles(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role))
      return res.status(403).json({ error: `Insufficient permission (requires: ${roles.join(", ")}).` });
    next();
  };
}
