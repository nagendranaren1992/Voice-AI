import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.patient.upsert({
    where: { uhid: "UHID-1001" },
    update: {},
    create: { uhid: "UHID-1001", name: "Demo Patient One" }
  });

  await prisma.patient.upsert({
    where: { uhid: "UHID-1002" },
    update: {},
    create: { uhid: "UHID-1002", name: "Demo Patient Two" }
  });
}

main()
  .catch((error) => {
    console.error("Prisma seed failed", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
