import { Status } from "@/generated/prisma/enums";

const TIMEZONE_BANGKOK = "Asia/Bangkok";

type TaskWithStatus = { status: Status } | null | undefined;

export function getDefinitionTaskButtonLabel(task: TaskWithStatus): "Create" | "View" {
  return task ? "View" : "Create";
}

export function getEvaluationTaskButtonLabel(
  task: TaskWithStatus,
): "Create" | "View" | "Evaluate" {
  if (!task) return "Create";
  if (
    task.status === Status.COMPLETED ||
    task.status === Status.WAITING_APPROVER_1 ||
    task.status === Status.WAITING_APPROVER_2
  ) {
    return "View";
  }
  return "Evaluate";
}

export function generateTaskId(): string {
  return `TK${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
}

function getBangkokYmd(date: Date): { y: number; m: number; d: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE_BANGKOK,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(date);

  const num = (type: Intl.DateTimeFormatPart["type"]) => {
    const p = parts.find((x) => x.type === type);
    if (p == null) throw new Error(`Missing DateTimeFormat part: ${type}`);
    return Number(p.value);
  };

  return { y: num("year"), m: num("month"), d: num("day") };
}

/** วันที่ลำดับที่ในปีค.ศ. (1 = 1 ม.ค., 365/366 = 31 ธ.ค.) — ใช้กฎปีฉลองแบบ Gregorian */
export function dayOfYear(year: number, month: number, day: number): number {
  return (
    (Date.UTC(year, month - 1, day) - Date.UTC(year, 0, 1)) / 86_400_000 + 1
  );
}

/**
 * `start` / `end` = วันที่ลำดับที่ในปี `year` (1–366) รวมขอบเขต
 * วันที่ปัจจุบันอิงตามปฏิทินไทย (Asia/Bangkok)
 */
export function isInRange(
  year: number,
  startDayOfYear: number,
  endDayOfYear: number,
  exceptYear?: number,
): boolean {
  const { y, m, d } = getBangkokYmd(new Date());

  if (!!exceptYear && y <= exceptYear) return true;

  if (y !== year) return false;

  const today = dayOfYear(y, m, d);
  return today >= startDayOfYear && today <= endDayOfYear;
}
