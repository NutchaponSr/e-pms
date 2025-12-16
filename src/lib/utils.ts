import { twMerge } from "tailwind-merge";
import { clsx, type ClassValue } from "clsx";

export const prefixes = ["นาย", "นางสาว", "นาง"] as const;

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getFirstNameFromFullName(fullName: string): string {
  if (!fullName || typeof fullName !== "string") {
    return "";
  }

  const trimmedName = fullName.trim();
  if (!trimmedName) {
    return "";
  }

  let cleaned = trimmedName;
  for (const prefix of prefixes) {
    if (cleaned.startsWith(prefix)) {
      cleaned = cleaned.substring(prefix.length).trim();
      break;
    }
  }

  if (!cleaned) {
    return "";
  }

  const firstToken = cleaned.split(/\s+/)[0];
  return firstToken ? `คุณ${firstToken}` : "";
}
