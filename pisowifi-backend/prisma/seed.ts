import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const username = "admin";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "changeme123";

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    console.log(`User "${username}" already exists — skipping.`);
    return;
  }

  await prisma.user.create({
    data: {
      username,
      password: await bcrypt.hash(password, 10),
      name: "Rich",
      role: "admin",
    },
  });

  console.log(`Created user "${username}".`);
  console.log(`Password: ${password}  ← change this after first login`);
}

main().finally(() => prisma.$disconnect());
