import "dotenv/config";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "scwis-dev-insecure-secret";

/** @typedef {{ sub: string, role: 'ADMIN' | 'STUDENT' | 'COUNSELOR', sid?: string | null }} JwtPayload */

export async function hashPassword(plain) {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

/** @param {{ id: string, role: import('@prisma/client').Role, studentProfileId: string | null }} user */
export function signToken(user) {
  /** @type {JwtPayload} */
  const payload = { sub: user.id, role: user.role };
  if (user.studentProfileId) payload.sid = user.studentProfileId;
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

/** @returns {JwtPayload | null} */
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}
