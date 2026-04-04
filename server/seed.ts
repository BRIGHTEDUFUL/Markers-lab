import bcrypt from "bcryptjs";
import prisma from "./db.js";

export async function seed() {
  const adminEmail = "admin@makerslab.com";
  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existing) {
    const hashedPassword = await bcrypt.hash("admin123", 10);
    await prisma.user.create({
      data: {
        name: "System Admin",
        email: adminEmail,
        passwordHash: hashedPassword,
        role: "ADMIN",
      },
    });
    console.log("Admin user seeded: admin@makerslab.com / admin123");
  }

  const demoEmail = "user@makerslab.com";
  const demoExisting = await prisma.user.findUnique({ where: { email: demoEmail } });
  if (!demoExisting) {
    const hashedPassword = await bcrypt.hash("password123", 10);
    await prisma.user.create({
      data: {
        name: "Demo User",
        email: demoEmail,
        passwordHash: hashedPassword,
        role: "USER",
      },
    });
    console.log("Demo user seeded: user@makerslab.com / password123");
  }
}
