import "dotenv/config";

// ─── Helper ─────────────────────────────────────────────────────────────────

import {
  CompetencyType,
  FormType,
  KpiCategory,
  Period,
  Prisma,
  Status,
  UserRole,
} from "@/generated/prisma/client";
import db from "@/lib/db";


/** แปลง PostgreSQL NULL (\N) → null, แปลง escape \\n → newline */
function pg(value: string | undefined): string | null {
  if (value === undefined || value === "\\N") return null;
  return value.replace(/\\n/g, "\n").replace(/\\t/g, "\t");
}

function pgInt(value: string | undefined): number | null {
  const v = pg(value);
  if (v === null) return null;
  return parseInt(v, 10);
}

function pgDate(value: string | undefined): Date | null {
  const v = pg(value);
  if (v === null) return null;
  return new Date(v);
}

function pgJson(value: string | undefined): Prisma.InputJsonValue | typeof Prisma.DbNull {
  const v = pg(value);
  if (v === null) return Prisma.DbNull;
  try {
    return JSON.parse(v) as Prisma.InputJsonValue;
  } catch {
    return {};
  }
}

function pgKpiCategory(value: string | undefined): KpiCategory | null {
  const v = pg(value);
  if (!v) return null;
  return Object.values(KpiCategory).includes(v as KpiCategory) ? (v as KpiCategory) : null;
}

function pgBool(value: string | undefined): boolean {
  return value === "t" || value === "true";
}

function pgCompetencyType(value: string | undefined): CompetencyType {
  const v = pg(value);
  if (v && Object.values(CompetencyType).includes(v as CompetencyType)) return v as CompetencyType;
  return CompetencyType.CC;
}

function pgUserRole(value: string | undefined): UserRole {
  const v = pg(value);
  if (v && Object.values(UserRole).includes(v as UserRole)) return v as UserRole;
  return UserRole.USER;
}

// ─── Seed Data ───────────────────────────────────────────────────────────────

async function seedFromSQL() {
  const fs = await import("fs");
  const path = await import("path");

  // ── อ่านไฟล์ SQL dump ──────────────────────────────────────────────────────
  // ค่าเริ่มต้น: ./backup.sql หรือกำหนด BACKUP_SQL_PATH
  const sqlPath = path.resolve(process.cwd(), process.env.BACKUP_SQL_PATH ?? "backup.sql");
  if (!fs.existsSync(sqlPath)) {
    throw new Error(`ไม่พบไฟล์ dump: ${sqlPath} (วาง backup.sql ที่รากโปรเจกต์ หรือตั้ง BACKUP_SQL_PATH)`);
  }
  const sql = fs.readFileSync(sqlPath, "utf8");

  /** ดึง rows จาก COPY block ของแต่ละตาราง */
  function extractRows(tableName: string): string[][] {
    // รองรับทั้ง public.TableName และ public."TableName"
    const escaped = tableName.replace(/"/g, '\\"');
    const re = new RegExp(
      `COPY public\\.(?:"${escaped}"|${tableName})\\s*\\([^)]+\\)\\s*FROM stdin;\\n([\\s\\S]*?)\\n\\\\.(?:\\n|$)`
    );
    const m = sql.match(re);
    if (!m) return [];
    return m[1]
      .split("\n")
      .filter((l) => l.trim())
      .map((l) => l.split("\t"));
  }

  // // ── employee (ต้องก่อน user / Form / comment / task) ─────────────────────
  // console.log("🌱 Seeding employee...");
  // const employeeRows = extractRows("employee");
  // await db.employee.createMany({
  //   data: employeeRows.map(([id, name, email, position, division, level, rank, department]) => ({
  //     id,
  //     name,
  //     email: pg(email),
  //     position: pg(position) ?? "",
  //     division: pg(division) ?? "",
  //     level: pg(level) ?? "",
  //     rank: pg(rank) ?? "",
  //     department: pg(department) ?? "",
  //   })),
  //   skipDuplicates: true,
  // });
  // console.log(`   ✅ employee: ${employeeRows.length} rows`);

  // // ── culture (ก่อน cultureRecord) ─────────────────────────────────────────
  // console.log("🌱 Seeding culture...");
  // const cultureRows = extractRows("culture");
  // await db.culture.createMany({
  //   data: cultureRows.map(([id, name, code, description, belief, createdAt]) => ({
  //     id: pgInt(id)!,
  //     name: pg(name) ?? "",
  //     code: pg(code) ?? "",
  //     description: pg(description) ?? "",
  //     belief: (() => {
  //       const b = pg(belief);
  //       if (b === null) return Prisma.DbNull;
  //       try {
  //         return JSON.parse(b) as Prisma.InputJsonValue;
  //       } catch {
  //         return Prisma.DbNull;
  //       }
  //     })(),
  //     createdAt: pgDate(createdAt)!,
  //   })),
  //   skipDuplicates: true,
  // });
  // console.log(`   ✅ culture: ${cultureRows.length} rows`);

  // // ── competency (ก่อน competencyRecord) ──────────────────────────────────
  // console.log("🌱 Seeding competency...");
  // const competencyRows = extractRows("competency");
  // await db.competency.createMany({
  //   data: competencyRows.map(
  //     ([id, name, definition, t5, t4, t3, t2, t1, type, createdAt, updatedAt]) => ({
  //       id,
  //       name: pg(name) ?? "",
  //       definition: pg(definition),
  //       t5: pg(t5),
  //       t4: pg(t4),
  //       t3: pg(t3),
  //       t2: pg(t2),
  //       t1: pg(t1),
  //       type: pgCompetencyType(type),
  //       createdAt: pgDate(createdAt)!,
  //       updatedAt: pgDate(updatedAt) ?? pgDate(createdAt)!,
  //     })
  //   ),
  //   skipDuplicates: true,
  // });
  // console.log(`   ✅ competency: ${competencyRows.length} rows`);

  // // ── user (username → employee.id) ─────────────────────────────────────────
  // console.log("🌱 Seeding user...");
  // const userRows = extractRows("user");
  // await db.user.createMany({
  //   data: userRows.map(
  //     ([id, name, email, emailVerified, image, createdAt, updatedAt, role, username, displayUsername, banned, banReason, banExpires]) => ({
  //       id,
  //       name: pg(name) ?? "",
  //       email: pg(email),
  //       emailVerified: pgBool(emailVerified),
  //       image: pg(image),
  //       createdAt: pgDate(createdAt)!,
  //       updatedAt: pgDate(updatedAt) ?? pgDate(createdAt)!,
  //       role: pgUserRole(role),
  //       username: pg(username)!,
  //       displayUsername: pg(displayUsername),
  //       banned: banned === "\\N" || banned === undefined ? null : pgBool(banned),
  //       banReason: pg(banReason),
  //       banExpires: pgDate(banExpires),
  //     })
  //   ),
  //   skipDuplicates: true,
  // });
  // console.log(`   ✅ user: ${userRows.length} rows`);

  // // ── account ─────────────────────────────────────────────────────────────────
  // console.log("🌱 Seeding account...");
  // const accountRows = extractRows("account");
  // await db.account.createMany({
  //   data: accountRows.map(
  //     ([
  //       id,
  //       accountId,
  //       providerId,
  //       accessToken,
  //       refreshToken,
  //       idToken,
  //       accessTokenExpiresAt,
  //       refreshTokenExpiresAt,
  //       scope,
  //       password,
  //       createdAt,
  //       updatedAt,
  //       userId,
  //     ]) => ({
  //       id,
  //       accountId: pg(accountId)!,
  //       providerId: pg(providerId)!,
  //       accessToken: pg(accessToken),
  //       refreshToken: pg(refreshToken),
  //       idToken: pg(idToken),
  //       accessTokenExpiresAt: pgDate(accessTokenExpiresAt),
  //       refreshTokenExpiresAt: pgDate(refreshTokenExpiresAt),
  //       scope: pg(scope),
  //       password: pg(password),
  //       createdAt: pgDate(createdAt)!,
  //       updatedAt: pgDate(updatedAt) ?? pgDate(createdAt)!,
  //       userId: pg(userId)!,
  //     })
  //   ),
  //   skipDuplicates: true,
  // });
  // console.log(`   ✅ account: ${accountRows.length} rows`);

  // // ── session ───────────────────────────────────────────────────────────────
  // console.log("🌱 Seeding session...");
  // const sessionRows = extractRows("session");
  // await db.session.createMany({
  //   data: sessionRows.map(
  //     ([id, expiresAt, token, createdAt, updatedAt, ipAddress, userAgent, impersonatedBy, userId]) => ({
  //       id,
  //       expiresAt: pgDate(expiresAt)!,
  //       token: pg(token)!,
  //       createdAt: pgDate(createdAt)!,
  //       updatedAt: pgDate(updatedAt)!,
  //       ipAddress: pg(ipAddress),
  //       userAgent: pg(userAgent),
  //       impersonatedBy: pg(impersonatedBy),
  //       userId: pg(userId)!,
  //     })
  //   ),
  //   skipDuplicates: true,
  // });
  // console.log(`   ✅ session: ${sessionRows.length} rows`);

  // ── Form ──────────────────────────────────────────────────────────────────
  // console.log("🌱 Seeding Form...");
  // const formRows = extractRows("Form");
  // // cols: id, employeeId, type, year, period, createdAt, updatedAt
  // await db.form.createMany({
  //   data: formRows.map(([id, employeeId, type, year, period, createdAt, updatedAt]) => ({
  //     id,
  //     employeeId: pg(employeeId)!,
  //     type: type as FormType,
  //     year: pgInt(year)!,
  //     period: period as Period,
  //     createdAt: pgDate(createdAt)!,
  //     updatedAt: pgDate(updatedAt)!,
  //   })),
  //   skipDuplicates: true,
  // });
  // console.log(`   ✅ Form: ${formRows.length} rows`);

  // // ── task ──────────────────────────────────────────────────────────────────
  // console.log("🌱 Seeding task...");
  // const taskRows = extractRows("task");
  // // cols: id, context, status, updatedAt, ownerId, createdAt, checkerId, checkedAt, approverId, approvedAt, formId
  // await db.task.createMany({
  //   data: taskRows.map(
  //     ([id, context, status, updatedAt, ownerId, createdAt, checkerId, checkedAt, approverId, approvedAt, formId]) => ({
  //       id,
  //       context: pgJson(context),
  //       status: status as Status,
  //       updatedAt: pgDate(updatedAt)!,
  //       ownerId: pg(ownerId)!,
  //       createdAt: pgDate(createdAt)!,
  //       checkerId: pg(checkerId),
  //       checkedAt: pgDate(checkedAt),
  //       approverId: pg(approverId)!,
  //       approvedAt: pgDate(approvedAt),
  //       formId,
  //     })
  //   ),
  //   skipDuplicates: true,
  // });
  // console.log(`   ✅ task: ${taskRows.length} rows`);

  // // ── comment ───────────────────────────────────────────────────────────────
  // console.log("🌱 Seeding comment...");
  // const commentRows = extractRows("comment");
  // // cols: id, connectId, content, createdAt, updatedAt, createdBy
  // await db.comment.createMany({
  //   data: commentRows.map(([id, connectId, content, createdAt, updatedAt, createdBy]) => ({
  //     id,
  //     connectId,
  //     content: pg(content) ?? "",
  //     createdAt: pgDate(createdAt)!,
  //     updatedAt: pgDate(updatedAt)!,
  //     createdBy: pg(createdBy)!,
  //   })),
  //   skipDuplicates: true,
  // });
  // console.log(`   ✅ comment: ${commentRows.length} rows`);

  // ── cultureRecord ─────────────────────────────────────────────────────────
  console.log("🌱 Seeding cultureRecord...");
  const cultureRecordRows = extractRows("cultureRecord");
  // cols: id, cultureId, meritFormId, evidence, order
  await db.cultureRecord.createMany({
    data: cultureRecordRows.map(([id, cultureId, meritFormId, evidence, order]) => ({
      id,
      cultureId: pgInt(cultureId)!,
      meritFormId,
      evidence: pg(evidence),
      order: pgInt(order)!,
    })),
    skipDuplicates: true,
  });
  console.log(`   ✅ cultureRecord: ${cultureRecordRows.length} rows`);

  // ── cultureEvaluation ────────────────────────────────────────────────────
  console.log("🌱 Seeding cultureEvaluation...");
  const cultureEvalRows = extractRows("cultureEvaluation");
  // cols: id, cultureRecordId, period, result, levelBehaviorOwner, levelBehaviorChecker,
  //       levelBehaviorApprover, actualOwner, actualChecker, actualApprover, fileUrl, createdAt, updatedAt
  await db.cultureEvaluation.createMany({
    data: cultureEvalRows.map(
      ([id, cultureRecordId, period, result, levelBehaviorOwner, levelBehaviorChecker, levelBehaviorApprover, actualOwner, actualChecker, actualApprover, fileUrl, createdAt, updatedAt]) => ({
        id,
        cultureRecordId,
        period: period as Period,
        result: pg(result),
        levelBehaviorOwner: pgInt(levelBehaviorOwner),
        levelBehaviorChecker: pgInt(levelBehaviorChecker),
        levelBehaviorApprover: pgInt(levelBehaviorApprover),
        actualOwner: pg(actualOwner),
        actualChecker: pg(actualChecker),
        actualApprover: pg(actualApprover),
        fileUrl: pg(fileUrl),
        createdAt: pgDate(createdAt)!,
        updatedAt: pgDate(updatedAt) ?? pgDate(createdAt)!,
      })
    ),
    skipDuplicates: true,
  });
  console.log(`   ✅ cultureEvaluation: ${cultureEvalRows.length} rows`);

  // ── competencyRecord ──────────────────────────────────────────────────────
  console.log("🌱 Seeding competencyRecord...");
  const compRecordRows = extractRows("competencyRecord");
  // cols: id, competencyId, meritFormId, weight, expectedLevel, input, output, order, createdAt, updatedAt
  await db.competencyRecord.createMany({
    data: compRecordRows.map(
      ([id, competencyId, meritFormId, weight, expectedLevel, input, output, order, createdAt, updatedAt]) => ({
        id,
        competencyId: pg(competencyId),
        meritFormId,
        weight: new Prisma.Decimal(pg(weight) ?? "0"),
        expectedLevel: pgInt(expectedLevel),
        input: pg(input),
        output: pg(output),
        order: pgInt(order)!,
        createdAt: pgDate(createdAt)!,
        updatedAt: pgDate(updatedAt)!,
      })
    ),
    skipDuplicates: true,
  });
  console.log(`   ✅ competencyRecord: ${compRecordRows.length} rows`);

  // ── competencyEvaluation ──────────────────────────────────────────────────
  console.log("🌱 Seeding competencyEvaluation...");
  const compEvalRows = extractRows("competencyEvaluation");
  // cols: id, period, result, actualOwner, levelOwner, actualChecker, levelChecker,
  //       actualApprover, levelApprover, createdAt, fileUrl, competencyRecordId
  await db.competencyEvaluation.createMany({
    data: compEvalRows.map(
      ([id, period, result, actualOwner, levelOwner, actualChecker, levelChecker, actualApprover, levelApprover, createdAt, fileUrl, competencyRecordId]) => ({
        id,
        period: period as Period,
        result: pg(result),
        actualOwner: pg(actualOwner),
        levelOwner: pgInt(levelOwner),
        actualChecker: pg(actualChecker),
        levelChecker: pgInt(levelChecker),
        actualApprover: pg(actualApprover),
        levelApprover: pgInt(levelApprover),
        createdAt: pgDate(createdAt)!,
        fileUrl: pg(fileUrl),
        competencyRecordId,
      })
    ),
    skipDuplicates: true,
  });
  console.log(`   ✅ competencyEvaluation: ${compEvalRows.length} rows`);

  // ── kpi ───────────────────────────────────────────────────────────────────
  console.log("🌱 Seeding kpi...");
  const kpiRows = extractRows("kpi");
  // cols: id, name, category, weight, objective, strategy, method, target100, target80, target90,
  //       target70, target60, definition, type, createdAt, updatedAt, result, actualOwner,
  //       achievementOwner, actualChecker, achievementChecker, actualApprover, achievementApprover,
  //       fileUrl, order, formId
  await db.kpiEvaluation.createMany({
    data: kpiRows.map(
      ([id, name, category, weight, objective, strategy, method, target100, target80, target90, target70, target60, definition, type, createdAt, updatedAt, result, actualOwner, achievementOwner, actualChecker, achievementChecker, actualApprover, achievementApprover, fileUrl, order, formId]) => ({
        id,
        name: pg(name),
        category: pgKpiCategory(category),
        weight: new Prisma.Decimal(pg(weight) ?? "0"),
        objective: pg(objective),
        strategy: pg(strategy),
        method: pg(method),
        target100: pg(target100),
        target80: pg(target80),
        target90: pg(target90),
        target70: pg(target70),
        target60: pg(target60),
        definition: pg(definition),
        type: pg(type),
        createdAt: pgDate(createdAt)!,
        updatedAt: pgDate(updatedAt)!,
        result: pg(result),
        actualOwner: pg(actualOwner),
        achievementOwner: pgInt(achievementOwner),
        actualChecker: pg(actualChecker),
        achievementChecker: pgInt(achievementChecker),
        actualApprover: pg(actualApprover),
        achievementApprover: pgInt(achievementApprover),
        fileUrl: pg(fileUrl),
        order: pgInt(order)!,
        formId,
      })
    ),
    skipDuplicates: true,
  });
  console.log(`   ✅ kpi: ${kpiRows.length} rows`);
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🚀 Starting seed from backup.sql (ลำดับตาม FK)...\n");

  await seedFromSQL();

  console.log("\n✅ Seed completed!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });