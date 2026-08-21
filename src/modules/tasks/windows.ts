import "server-only";

import db from "@/lib/db";
import { FormType, Period } from "@/generated/prisma/enums";
import {
  isValidMonthDay,
  parseMonthDay,
  type MonthDay,
} from "@/modules/tasks/window-utils";

export interface WindowInfo {
  open: MonthDay;
  close: MonthDay;
  openAt: Date;
  closeAt: Date;
  isOpen: boolean;
}

/** คู่ form/period ที่มีช่วงเปิด-ปิดในระบบ */
export const WINDOW_DEFINITIONS: { formType: FormType; period: Period; label: string }[] = [
  { formType: FormType.KPI, period: Period.IN_DRAFT, label: "KPI Bonus — Setting" },
  { formType: FormType.KPI, period: Period.EVALUATION, label: "KPI Bonus — Year-end Evaluation" },
  { formType: FormType.MERIT, period: Period.IN_DRAFT, label: "KPI Merit — Setting" },
  { formType: FormType.MERIT, period: Period.EVALUATION_1ST, label: "KPI Merit — Mid-year Evaluation" },
  { formType: FormType.MERIT, period: Period.EVALUATION_2ND, label: "KPI Merit — Year-end Evaluation" },
];

export { isValidMonthDay, parseMonthDay };

function daysInMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function clampDay(year: number, month: number, day: number) {
  return Math.min(day, daysInMonth(year, month));
}

/** เปิด 00:00 / ปิด 23:59:59 ตามเวลาไทย (UTC+7) */
export function cycleInstant(
  year: number,
  month: number,
  day: number,
  endOfDay = false,
): Date {
  const d = clampDay(year, month, day);
  return new Date(
    Date.UTC(
      year,
      month - 1,
      d,
      endOfDay ? 16 : -7,
      endOfDay ? 59 : 0,
      endOfDay ? 59 : 0,
    ),
  );
}

export function toWindowInfo(
  year: number,
  cycle: { open: unknown; close: unknown },
): WindowInfo | null {
  const open = parseMonthDay(cycle.open);
  const close = parseMonthDay(cycle.close);
  if (!open || !close) return null;

  const wraps =
    close.month < open.month || (close.month === open.month && close.day < open.day);

  const openAt = cycleInstant(year, open.month, open.day);
  const closeAt = cycleInstant(
    wraps ? year + 1 : year,
    close.month,
    close.day,
    true,
  );
  const now = new Date();

  return {
    open,
    close,
    openAt,
    closeAt,
    isOpen: now >= openAt && now <= closeAt,
  };
}

/** คืน window ของทุก period ในปี/ประเภทฟอร์มนั้น — period ที่ไม่มี config จะเป็น null (ตีความว่าเปิด) */
export async function getWindows(
  year: number,
  formType: FormType,
): Promise<Partial<Record<Period, WindowInfo | null>>> {
  const windows = await db.evaluationWindow.findMany({
    where: { formType },
  });

  const result: Partial<Record<Period, WindowInfo | null>> = {};

  for (const def of WINDOW_DEFINITIONS) {
    if (def.formType !== formType) continue;
    const window = windows.find((w) => w.period === def.period);
    result[def.period] = window ? toWindowInfo(year, window) : null;
  }

  return result;
}

/** ตรวจว่าช่วงนี้เปิดอยู่ไหม — ไม่มี config = เปิด */
export async function isWindowOpen(
  year: number,
  formType: FormType,
  period: Period,
): Promise<boolean> {
  const window = await db.evaluationWindow.findUnique({
    where: {
      formType_period: { formType, period },
    },
  });

  if (!window) return true;

  return toWindowInfo(year, window)?.isOpen ?? true;
}
