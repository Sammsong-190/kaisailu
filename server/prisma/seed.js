import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = "admin@demo.edu";
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log("Seed skipped: admin already exists.");
    return;
  }
  const passwordHash = await bcrypt.hash("Admin123!", 10);
  await prisma.user.create({
    data: {
      email,
      passwordHash,
      displayName: "Campus Administrator",
      role: "ADMIN",
    },
  });
  console.log(`Seeded admin: ${email} / Admin123!`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
