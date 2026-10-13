import "dotenv/config";

import path from "path";
import bcrypt from "bcryptjs";

import { UserRole } from "@/generated/prisma/enums";
import db from "@/lib/db";

import { readCSV } from "@/seeds/lib/utils";

interface EmployeeCVSProps {
  id: string;
  fullName: string;
  position: string;
  division: string;
  level: string;
  rank: string;
  department: string;
  email?: string;
  password: string;
}

const seedAdmin = async () => {
  const file = path.join(process.cwd(), "src/data", "employee.csv");

  const admins = readCSV<EmployeeCVSProps>(file, (value, context) => {
    if (context.column === "password") {
      return String(value).trim().padStart(5, "0");
    }

    if (context.column === "id") return String(value).trim();

    return value;
  }).filter((record) => record.position.trim().toLowerCase() === "admin");

  if (!admins.length) {
    console.log("No admin rows in employee.csv");
    return;
  }

  for (const record of admins) {
    const employeeId = record.id.toString();
    const email = record.email?.trim() || null;
    const passwordHash = await bcrypt.hash(record.password, 10);

    await db.employee.upsert({
      where: { id: employeeId },
      update: {},
      create: {
        id: employeeId,
        name: record.fullName,
        email,
        position: record.position,
        division: record.division,
        level: record.level,
        rank: record.rank,
        department: record.department,
      },
    });

    const existing = await db.user.findUnique({
      where: { username: employeeId },
      include: { accounts: true },
    });

    if (!existing) {
      const user = await db.user.create({
        data: {
          name: record.fullName,
          email,
          emailVerified: true,
          role: UserRole.ADMIN,
          username: employeeId,
          displayUsername: employeeId,
          banned: false,
        },
      });

      await db.account.create({
        data: {
          accountId: user.id,
          providerId: "credential",
          password: passwordHash,
          userId: user.id,
        },
      });

      console.log(`created admin ${employeeId}`);
      continue;
    }

    await db.user.update({
      where: { id: existing.id },
      data: {
        role: UserRole.ADMIN,
        banned: false,
        banReason: null,
        banExpires: null,
      },
    });

    const credential = existing.accounts.find(
      (account) => account.providerId === "credential",
    );

    if (credential) {
      await db.account.update({
        where: { id: credential.id },
        data: { password: passwordHash },
      });
    } else {
      await db.account.create({
        data: {
          accountId: existing.id,
          providerId: "credential",
          password: passwordHash,
          userId: existing.id,
        },
      });
    }

    console.log(`updated admin ${employeeId}`);
  }

  const usernames = admins.map((record) => record.id.toString());
  const users = await db.user.findMany({
    where: { username: { in: usernames } },
    select: {
      username: true,
      name: true,
      role: true,
      accounts: { select: { providerId: true, password: true } },
    },
  });

  for (const user of users) {
    const record = admins.find((admin) => admin.id.toString() === user.username);
    const hash = user.accounts.find(
      (account) => account.providerId === "credential",
    )?.password;
    const passwordOk = hash
      ? await bcrypt.compare(record?.password ?? "", hash)
      : false;

    console.log(
      `${user.username} ${user.name} role=${user.role} passwordOk=${passwordOk}`,
    );
  }
};

seedAdmin()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
    process.exit(process.exitCode ?? 0);
  });
