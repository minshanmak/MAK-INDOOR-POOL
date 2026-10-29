const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding M.A.K Indoor Pool initial database...");

  // 1. Singleton pool settings
  const settings = await prisma.poolSetting.upsert({
    where: { id: "singleton_settings" },
    update: {},
    create: {
      id: "singleton_settings",
      poolName: "M.A.K Indoor Pool",
      address: "Near Metro Junction, Aluva, Ernakulam, Kerala - 683101",
      contactPhone: "+91 94470 12345",
      contactEmail: "bookings@makindoorpool.com",
      openHour: 9,
      closeHour: 23,
      publicEndHour: 16,
      maxCapacity: 25,
      defaultPublicRate: 150.0,
      defaultFamilyBaseRate: 1500.0,
      familyBaseGuests: 12,
      familyExtraRate: 100.0,
      familyAdvanceAmount: 750.0,
      holdTtlMinutes: 15,
      cancellationCutoffHours: 12,
      rescheduleCutoffHours: 6,
      maintenanceMode: false,
    },
  });
  console.log("Pool settings seeded:", settings.poolName);

  // 2. Demo Users
  const passwordHash = await bcrypt.hash("Password@123", 10);

  // Super Admin
  await prisma.user.upsert({
    where: { phone: "+919999900001" },
    update: {},
    create: {
      phone: "+919999900001",
      email: "superadmin@makpool.com",
      name: "Super Admin",
      passwordHash,
      role: "SUPER_ADMIN",
      status: "ACTIVE",
      permissions: JSON.stringify(["*"]),
    },
  });

  // Pool Owner
  await prisma.user.upsert({
    where: { phone: "+919999900002" },
    update: {},
    create: {
      phone: "+919999900002",
      email: "owner@makpool.com",
      name: "Pool Owner (M.A.K)",
      passwordHash,
      role: "POOL_OWNER",
      status: "ACTIVE",
      permissions: JSON.stringify(["*"]),
    },
  });

  // Staff Member
  await prisma.user.upsert({
    where: { phone: "+919999900003" },
    update: {},
    create: {
      phone: "+919999900003",
      email: "staff@makpool.com",
      name: "Rahul Nair (Duty Staff)",
      passwordHash,
      role: "STAFF",
      status: "ACTIVE",
      permissions: JSON.stringify([
        "bookings:view",
        "bookings:create",
        "bookings:edit",
        "bookings:cancel_request",
        "payments:view",
        "payments:create",
        "walkin:manage",
        "maintenance:view",
        "maintenance:log",
        "closing:submit",
        "complaints:manage",
        "reports:view"
      ]),
    },
  });

  console.log("Demonstration user accounts seeded successfully.");
  console.log("Credentials (all use password: Password@123):");
  console.log("  Super Admin: +919999900001 or superadmin@makpool.com");
  console.log("  Pool Owner:  +919999900002 or owner@makpool.com");
  console.log("  Duty Staff:  +919999900003 or staff@makpool.com");
}

main()
  .catch((e) => {
    console.error("Error during seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
