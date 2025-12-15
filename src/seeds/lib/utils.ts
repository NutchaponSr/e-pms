import fs from "fs";

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
    cast,
  });
}