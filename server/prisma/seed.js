import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function ensureUser({ email, password, displayName, role, studentProfileId }) {
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return;
  await prisma.user.create({
    data: {
      email,
      passwordHash: await bcrypt.hash(password, 10),
      displayName,
      role,
      studentProfileId: studentProfileId ?? null,
    },
  });
  const extra = role === "STUDENT" && studentProfileId ? ` · linked roster id ${studentProfileId}` : "";
  console.log(`Seeded ${role}: ${email} / ${password}${extra}`);
}

async function main() {
  await ensureUser({
    email: "admin@campus.local",
    password: "Admin123!",
    displayName: "Campus Administrator",
    role: "ADMIN",
  });

  await ensureUser({
    email: "student@campus.local",
    password: "Student123!",
    displayName: "Alex Chen",
    role: "STUDENT",
    studentProfileId: "S1001",
  });

  await ensureUser({
    email: "counselor@campus.local",
    password: "Counselor123!",
    displayName: "Clinical counselor",
    role: "COUNSELOR",
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
