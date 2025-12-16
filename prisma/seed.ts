// prisma/seed.ts
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Get password from CLI argument or use default
  const args = process.argv.slice(2);
  const passwordArg = args.find((arg) => arg.startsWith("--password="));
  const password = passwordArg ? passwordArg.split("=")[1] : args[0] || "arg"; // Default to "arg" if no argument

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12);

  // Create or update admin user
  const admin = await prisma.user.upsert({
    where: { email: "admin@cultivatedagency.com" },
    update: {
      password: hashedPassword,
      role: "ADMIN",
    },
    create: {
      email: "admin@cultivatedagency.com",
      name: "Admin",
      password: hashedPassword,
      role: "ADMIN",
    },
  });

  console.log("✅ Admin user created/updated:");
  console.log(`   Email: ${admin.email}`);
  console.log(`   Role: ${admin.role}`);
  console.log(`   Password: ${password}`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
