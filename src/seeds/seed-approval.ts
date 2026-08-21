import "dotenv/config";

import path from "path";
import db from "@/lib/db";

import { readCSV } from "@/seeds/lib/utils";

interface ApprovalCSVProps {
  employeeId: string;
  checker?: string;
  approver: string;
}

/** Import สายการบังคับบัญชาจาก approval.csv ลง Approval (source of truth) */
export const seedApproval = async () => {
  console.log("Seeding approval chain from approval.csv...");

  const file = path.join(process.cwd(), "src/data", "approval.csv");

  const records = readCSV<ApprovalCSVProps>(file, (value, context) => {
    // เก็บเป็น string เพื่อรักษา leading zero
    if (
      context.column === "employeeId" ||
      context.column === "checker" ||
      context.column === "approver"
    ) {
      return String(value).trim();
    }
    return value;
  });

  if (!records.length) {
    console.log("No data found");
    return;
  }

  const employees = await db.employee.findMany({ select: { id: true } });
  const employeeIds = new Set(employees.map((e) => e.id));

  let updated = 0;
  let skipped = 0;

  for (const record of records) {
    const employeeId = record.employeeId;
    const checkerId = record.checker && record.checker !== "" ? record.checker : null;
    const approverId = record.approver && record.approver !== "" ? record.approver : null;

    if (!employeeIds.has(employeeId)) {
      console.warn(`⚠️ Skipped ${employeeId}: employee not found`);
      skipped++;
      continue;
    }

    if (!approverId || !employeeIds.has(approverId)) {
      console.warn(`⚠️ Skipped ${employeeId}: approver ${record.approver} not found`);
      skipped++;
      continue;
    }

    if (checkerId && !employeeIds.has(checkerId)) {
      console.warn(`⚠️ Skipped ${employeeId}: checker ${record.checker} not found`);
      skipped++;
      continue;
    }

    await db.approval.upsert({
      where: { employeeId },
      create: { employeeId, checkerId, approverId },
      update: { checkerId, approverId },
    });

    updated++;
  }

  console.log(`✅ Approval chain updated: ${updated}, skipped: ${skipped}`);
};

(async () => {
  try {
    await seedApproval();
  } catch (error) {
    console.error(error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
})();
