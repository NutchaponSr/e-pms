import * as XLSX from "xlsx";

import { twMerge } from "tailwind-merge";
import { clsx, type ClassValue } from "clsx";

export const prefixes = ["นาย", "นางสาว", "นาง"] as const;

export interface ExportColumn {
  key: string
  header: string
  transform?: (value: any, row: any) => any
}

export interface Worksheet {
  name: string
  data: any[]
  columns?: ExportColumn[]
}

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

export function formatDecimal(value: number, decimalPlaces: number = 2): string {
  return value.toLocaleString("en-US", {
    maximumFractionDigits: decimalPlaces,
    minimumFractionDigits: decimalPlaces,
  });
}

export function exportExcel(worksheets: Worksheet[]) {
  const workbook = XLSX.utils.book_new();

  worksheets.forEach((sheet) => {
    let processedData = sheet.data

    if (sheet.columns && sheet.columns.length > 0) {
      processedData = sheet.data.map((row) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const newRow: any = {}
        sheet.columns!.forEach((col) => {
          const value = row[col.key]
          newRow[col.header] = col.transform ? col.transform(value, row) : value
        })
        return newRow
      })
    }

    const worksheet = XLSX.utils.json_to_sheet(processedData)

    const firstRow = processedData[0] || {}
    const columnWidths = Object.keys(firstRow).map((key) => {
      const maxLength = Math.max(key.length, ...processedData.map((row) => String(row[key] || "").length))
      return { wch: Math.min(maxLength + 2, 50) }
    })
    worksheet["!cols"] = columnWidths

    XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name)
  })

  const excelBuffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
    bookSST: false,
  });

  const file = Buffer.from(excelBuffer).toString("base64");

  return file;
}