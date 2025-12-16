import { getMonth, getYear } from "date-fns";

export function generateTaskId(): string {
  return `TK${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
}

export function isInRange(year: number, start: number, end: number, exceptYear?: number): boolean {
  const now = new Date();
  const currentYear = getYear(now);
  const currentMonth = getMonth(now);

  if (!!exceptYear && currentYear <= exceptYear) return true;

  if (currentYear !== year) return false;

  return currentMonth >= start && currentMonth <= end;
}