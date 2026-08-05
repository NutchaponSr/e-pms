import fs from "fs";
import path from "path";
import db from "@/lib/db";

import { authClient } from "@/lib/auth-client";

import { readCSV } from "@/seeds/lib/utils";

interface EmployeeCVSProps {
  order: number;
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

interface EmployeeUserAccountLog {
  employeeId: string;
  password: string;
  userId: string | null;
  employee: {
    status: "created" | "skipped" | "missing";
    id?: string;
    name?: string;
    email?: string | null;
    position?: string;
    division?: string;
    level?: string;
    rank?: string;
    department?: string;
  };
  user: {
    status: "created" | "skipped" | "failed" | "missing";
    id?: string;
    name?: string;
    email?: string | null;
    emailVerified?: boolean;
    image?: string | null;
    createdAt?: string;
    updatedAt?: string;
    role?: string;
    username?: string;
    displayUsername?: string | null;
    banned?: boolean | null;
    banReason?: string | null;
    banExpires?: string | null;
  };
  account: {
    status: "created" | "skipped" | "failed" | "missing";
    id?: string;
    accountId?: string;
    providerId?: string;
    accessToken?: string | null;
    refreshToken?: string | null;
    idToken?: string | null;
    accessTokenExpiresAt?: string | null;
    refreshTokenExpiresAt?: string | null;
    scope?: string | null;
    password?: string | null;
    createdAt?: string;
    updatedAt?: string;
    userId?: string;
  };
}

type EmployeeUserAccountBase = Pick<EmployeeUserAccountLog, "employeeId" | "password">;

export interface SeedEmployeeOptions {
  employeeIds?: string[];
}

export const parseEmployeeIdsFromArgv = (argv = process.argv.slice(2)) => {
  const employeeIds: string[] = [];

  for (const arg of argv) {
    if (!arg.startsWith("--employeeId=")) continue;

    const value = arg.slice("--employeeId=".length).trim();
    if (!value) continue;

    employeeIds.push(
      ...value
        .split(",")
        .map((employeeId) => employeeId.trim())
        .filter(Boolean),
    );
  }

  return employeeIds;
};

const normalizeEmployeeId = (employeeId: string) => employeeId.trim();

const buildEmployeeUserAccountLogs = (
  records: EmployeeCVSProps[],
) => {
  return Object.fromEntries(
    records.map((record) => {
      const employeeId = record.id.toString();

      return [
        employeeId,
        {
          employeeId,
          password: record.password,
        } satisfies EmployeeUserAccountBase,
      ];
    }),
  ) as Record<string, EmployeeUserAccountBase>;
};

type UserStatus = EmployeeUserAccountLog["user"]["status"];

const resolveUserStatus = (
  employeeId: string,
  existingUsernames: Set<string>,
  createdUserIds: Set<string>,
  failedUserIds: Set<string>,
): UserStatus => {
  if (existingUsernames.has(employeeId)) return "skipped";
  if (failedUserIds.has(employeeId)) return "failed";
  if (createdUserIds.has(employeeId)) return "created";
  return "failed";
};

const toIsoString = (value?: Date | null) => value?.toISOString();

const resolveEmployeeLog = (
  employeeId: string,
  wasExisting: boolean,
  employee?: {
    id: string;
    name: string;
    email: string | null;
    position: string;
    division: string;
    level: string;
    rank: string;
    department: string;
  },
): EmployeeUserAccountLog["employee"] => {
  if (!employee) {
    return { status: "missing" };
  }

  return {
    status: wasExisting ? "skipped" : "created",
    id: employee.id,
    name: employee.name,
    email: employee.email,
    position: employee.position,
    division: employee.division,
    level: employee.level,
    rank: employee.rank,
    department: employee.department,
  };
};

const resolveUserLog = (
  userStatus: UserStatus,
  user?: {
    id: string;
    name: string;
    email: string | null;
    emailVerified: boolean;
    image: string | null;
    createdAt: Date;
    updatedAt: Date;
    role: string;
    username: string;
    displayUsername: string | null;
    banned: boolean | null;
    banReason: string | null;
    banExpires: Date | null;
  },
): EmployeeUserAccountLog["user"] => {
  if (userStatus === "failed" || userStatus === "missing" || !user) {
    return { status: userStatus };
  }

  return {
    status: userStatus,
    id: user.id,
    name: user.name,
    email: user.email,
    emailVerified: user.emailVerified,
    image: user.image,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    role: user.role,
    username: user.username,
    displayUsername: user.displayUsername,
    banned: user.banned,
    banReason: user.banReason,
    banExpires: toIsoString(user.banExpires),
  };
};

const resolveAccountLog = (
  userStatus: UserStatus,
  account?: {
    id: string;
    accountId: string;
    providerId: string;
    accessToken: string | null;
    refreshToken: string | null;
    idToken: string | null;
    accessTokenExpiresAt: Date | null;
    refreshTokenExpiresAt: Date | null;
    scope: string | null;
    password: string | null;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
  },
): EmployeeUserAccountLog["account"] => {
  if (userStatus === "failed") {
    return { status: "failed" };
  }

  if (!account) {
    return { status: "missing" };
  }

  return {
    status: userStatus === "skipped" ? "skipped" : "created",
    id: account.id,
    accountId: account.accountId,
    providerId: account.providerId,
    accessToken: account.accessToken,
    refreshToken: account.refreshToken,
    idToken: account.idToken,
    accessTokenExpiresAt: toIsoString(account.accessTokenExpiresAt),
    refreshTokenExpiresAt: toIsoString(account.refreshTokenExpiresAt),
    scope: account.scope,
    password: account.password,
    createdAt: account.createdAt.toISOString(),
    updatedAt: account.updatedAt.toISOString(),
    userId: account.userId,
  };
};

export const seedEmployee = async (options: SeedEmployeeOptions = {}) => {
  const requestedEmployeeIds = (options.employeeIds ?? parseEmployeeIdsFromArgv()).map(
    normalizeEmployeeId,
  );
  const requestedEmployeeIdSet =
    requestedEmployeeIds.length > 0 ? new Set(requestedEmployeeIds) : null;

  console.log("Seeding employee...");
  if (requestedEmployeeIdSet) {
    console.log(`Filter employeeId: ${requestedEmployeeIds.join(", ")}`);
  }

  const file = path.join(process.cwd(), "src/data", "employee.csv");

  const records = readCSV<EmployeeCVSProps>(file, (value, context) => {
    if (context.column === "password") {
      const str = String(value).trim();
      // รองรับกรณีเลข 0 นำหน้าโดนตัด เช่น 8440 -> 08440
      return str.padStart(5, "0");
    }

    // id เก็บเป็น string เพื่อรักษา leading zero (เช่น 0001)
    if (context.column === "order") return Number(value);
    if (context.column === "id") return String(value).trim();

    return value;
  });

  if (!records.length) {
    console.log("No data found");
    return [];
  }

  const seenIds = new Set<string>();
  let uniqueRecords = records.filter((record) => {
    const id = record.id.toString();
    if (seenIds.has(id)) return false;
    seenIds.add(id);
    return true;
  });

  if (requestedEmployeeIdSet) {
    uniqueRecords = uniqueRecords.filter((record) =>
      requestedEmployeeIdSet.has(record.id.toString()),
    );

    if (!uniqueRecords.length) {
      console.log(`No employee found for employeeId: ${requestedEmployeeIds.join(", ")}`);
      return {};
    }
  }

  const [existingEmployees, existingUsers] = await Promise.all([
    db.employee.findMany({ select: { id: true } }),
    db.user.findMany({ select: { username: true } }),
  ]);

  const existingEmployeeIds = new Set(existingEmployees.map((e) => e.id));
  const existingUsernames = new Set(existingUsers.map((u) => u.username));

  const newEmployees = uniqueRecords.filter(
    (record) => !existingEmployeeIds.has(record.id.toString()),
  );
  const newUsers = uniqueRecords.filter(
    (record) => !existingUsernames.has(record.id.toString()),
  );

  const employeeUserAccounts = buildEmployeeUserAccountLogs(uniqueRecords);

  const skippedEmployeeCount = uniqueRecords.length - newEmployees.length;
  const skippedUserCount = uniqueRecords.length - newUsers.length;
  const createdUserIds = new Set<string>();
  const failedUserIds = new Set<string>();

  if (newEmployees.length) {
    const created = await db.employee.createMany({
      data: newEmployees.map((record) => ({
        id: record.id.toString(),
        name: record.fullName,
        email: record.email,
        position: record.position,
        division: record.division,
        level: record.level,
        rank: record.rank,
        department: record.department,
      })),
      skipDuplicates: true,
    });
    console.log(`Employee created: ${created.count}`);
  } else {
    console.log("Employee created: 0");
  }

  if (skippedEmployeeCount) {
    console.log(`Employee skipped (duplicate): ${skippedEmployeeCount}`);
  }

  if (newUsers.length) {
    await Promise.all(
      newUsers.map(async (record) => {
        const employeeId = record.id.toString();
        const result = await authClient.signUp.email({
          email: record.email || "t@somboon.co.th",
          name: record.fullName,
          password: record.password,
          username: employeeId,
        });

        if (result.error) {
          failedUserIds.add(employeeId);
          console.error(
            `❌ Failed to create user for ${employeeId}:`,
            result.error.message || result.error,
          );
          return;
        }

        createdUserIds.add(employeeId);
      }),
    );
    console.log(`User created: ${createdUserIds.size}`);
  } else {
    console.log("User created: 0");
  }

  if (skippedUserCount) {
    console.log(`User skipped (duplicate): ${skippedUserCount}`);
  }

  const employeeIds = Object.keys(employeeUserAccounts);

  const [employees, usersWithAccounts] = await Promise.all([
    db.employee.findMany({
      where: { id: { in: employeeIds } },
    }),
    db.user.findMany({
      where: { username: { in: employeeIds } },
      include: {
        accounts: true,
      },
    }),
  ]);

  const employeeById = new Map(employees.map((employee) => [employee.id, employee]));
  const userByEmployeeId = new Map(
    usersWithAccounts.map((user) => [user.username, user]),
  );

  const employeeUserAccountLog = Object.fromEntries(
    Object.entries(employeeUserAccounts).map(([employeeId, account]) => {
      const userStatus = resolveUserStatus(
        employeeId,
        existingUsernames,
        createdUserIds,
        failedUserIds,
      );
      const user = userByEmployeeId.get(employeeId);
      const dbAccount = user?.accounts[0];
      const userLog = resolveUserLog(
        user ? userStatus : "missing",
        user,
      );

      return [
        employeeId,
        {
          employeeId,
          password: account.password,
          userId: user?.id ?? dbAccount?.userId ?? null,
          employee: resolveEmployeeLog(
            employeeId,
            existingEmployeeIds.has(employeeId),
            employeeById.get(employeeId),
          ),
          user: userLog,
          account: resolveAccountLog(userLog.status, dbAccount),
        },
      ];
    }),
  ) as Record<string, EmployeeUserAccountLog>;

  const logPath = path.join(
    process.cwd(),
    "src/data",
    "employee-user-accounts.json",
  );

  let finalEmployeeUserAccountLog = employeeUserAccountLog;

  if (requestedEmployeeIdSet && fs.existsSync(logPath)) {
    const existingLog = JSON.parse(
      fs.readFileSync(logPath, "utf-8"),
    ) as Record<string, EmployeeUserAccountLog>;
    finalEmployeeUserAccountLog = {
      ...existingLog,
      ...employeeUserAccountLog,
    };
  }

  fs.writeFileSync(
    logPath,
    JSON.stringify(finalEmployeeUserAccountLog, null, 2),
    "utf-8",
  );

  console.log("Employee user accounts:");
  console.log(JSON.stringify(employeeUserAccountLog, null, 2));
  console.log(`Employee user accounts log: ${logPath}`);

  console.log("Employee seeded successfully");

  return employeeUserAccountLog;
}