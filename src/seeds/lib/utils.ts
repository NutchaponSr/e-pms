import fs from "fs";
import path from "path";

import { parse, CastingFunction } from "csv-parse/sync";

export function readCSV<T>(
  filePath: string,
  cast?: boolean | CastingFunction,
): T[] {
  const content = fs.readFileSync(filePath, "utf-8");

  return parse(content, {
    columns: true,
    skipEmptyLines: true,
    trim: true,
    bom: true,
    relax_quotes: true,
    cast,
  });
}

/** แปลง array of objects เป็น string CSV (escape comma, newline, double quote) */
export function toCSV<T extends Record<string, unknown>>(
  rows: T[],
  columns?: (keyof T)[],
): string {
  if (rows.length === 0) return "";
  const keys = (columns ?? Object.keys(rows[0]) as (keyof T)[]);
  const escape = (v: unknown): string => {
    const s = String(v ?? "");
    if (s.includes(",") || s.includes('"') || s.includes("\n")) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const header = keys.map((k) => escape(k)).join(",");
  const body = rows.map((r) => keys.map((k) => escape(r[k])).join(",")).join("\n");
  return `${header}\n${body}`;
}

/** เขียนข้อมูลลงไฟล์ CSV (dir ไม่ระบุจะใช้ src/data) */
export function writeCSV<T extends Record<string, unknown>>(
  filename: string,
  rows: T[],
  columns?: (keyof T)[],
  outputDir?: string,
): string {
  const dir = outputDir ?? path.join(process.cwd(), "src", "data");
  const filePath = path.join(dir, filename);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, toCSV(rows, columns), "utf-8");
  return filePath;
}