/** Client-safe helpers สำหรับ EvaluationWindow ที่ได้จาก getInfo */

export interface MonthDay {
  month: number;
  day: number;
}

export interface ClientWindowInfo {
  open: MonthDay;
  close: MonthDay;
  openAt: Date | string;
  closeAt: Date | string;
  isOpen: boolean;
}

export function isValidMonthDay(month: number, day: number) {
  if (month < 1 || month > 12) return false;
  const max = new Date(Date.UTC(2000, month, 0)).getUTCDate();
  return day >= 1 && day <= max;
}

export function parseMonthDay(value: unknown): MonthDay | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const month = (value as { month?: unknown }).month;
  const day = (value as { day?: unknown }).day;
  if (typeof month !== "number" || typeof day !== "number") return null;
  if (!isValidMonthDay(month, day)) return null;
  return { month, day };
}

/** ไม่มี config = เปิด, dev mode = เปิดเสมอ */
export function isWindowActive(window: ClientWindowInfo | null | undefined): boolean {
  if (process.env.NODE_ENV === "development") return true;
  if (!window) return true;
  return window.isOpen;
}

function formatMonthDay({ month, day }: MonthDay) {
  return new Date(Date.UTC(2000, month - 1, day)).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

export function formatWindowRange(window: ClientWindowInfo): string {
  return `${formatMonthDay(window.open)} – ${formatMonthDay(window.close)}`;
}

export function windowClosedMessage(
  label: string,
  window: ClientWindowInfo | null | undefined,
): string {
  if (!window) return `${label} is currently closed`;
  return `${label} is only open ${formatWindowRange(window)}`;
}
