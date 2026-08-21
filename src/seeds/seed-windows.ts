import "dotenv/config";

import db from "@/lib/db";

import { FormType, Period } from "@/generated/prisma/enums";

/**
 * Seed ช่วงเปิด/ปิดระบบแบบวนทุกปี
 * open/close เป็น JSON { month, day }
 * - KPI Setting:            1 ม.ค. – 3 เม.ย.
 * - KPI Year-end:           1 ส.ค. – 31 ธ.ค.
 * - Merit Setting:          1 ม.ค. – 3 เม.ย.
 * - Merit Mid-year:         1 พ.ค. – 31 ธ.ค.
 * - Merit Year-end:         1 ส.ค. – 31 ธ.ค.
 */
export const seedWindows = async () => {
  console.log("Seeding evaluation windows (open/close JSON)...");

  const defaults = [
    {
      formType: FormType.KPI,
      period: Period.IN_DRAFT,
      open: { month: 1, day: 1 },
      close: { month: 4, day: 3 },
    },
    {
      formType: FormType.KPI,
      period: Period.EVALUATION,
      open: { month: 8, day: 1 },
      close: { month: 12, day: 31 },
    },
    {
      formType: FormType.MERIT,
      period: Period.IN_DRAFT,
      open: { month: 1, day: 1 },
      close: { month: 4, day: 3 },
    },
    {
      formType: FormType.MERIT,
      period: Period.EVALUATION_1ST,
      open: { month: 5, day: 1 },
      close: { month: 12, day: 31 },
    },
    {
      formType: FormType.MERIT,
      period: Period.EVALUATION_2ND,
      open: { month: 8, day: 1 },
      close: { month: 12, day: 31 },
    },
  ];

  for (const window of defaults) {
    await db.evaluationWindow.upsert({
      where: {
        formType_period: {
          formType: window.formType,
          period: window.period,
        },
      },
      create: window,
      update: {
        open: window.open,
        close: window.close,
      },
    });
  }

  console.log("✅ Evaluation windows seeded");
};

const isDirectRun = process.argv[1]?.includes("seed-windows");

if (isDirectRun) {
  (async () => {
    try {
      await seedWindows();
    } catch (error) {
      console.error(error);
      process.exit(1);
    } finally {
      process.exit(0);
    }
  })();
}
