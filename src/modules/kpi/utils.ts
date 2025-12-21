import { z } from "zod";

import { KpiCategory } from "@/generated/prisma/enums";
import { chiefDown, managerUp, Rank } from "@/types/employees";

import { kpiUploadSchema } from "@/modules/kpi/schema/upload";
import { requiredFields } from "./constants";

type RawKpiForMapping = {
  id: string;
  year: number;
  name: string | null;
  category: KpiCategory | null;
  weight: unknown;
  objective: string | null;
  definition: string | null;
  strategy: string | null;
  method: string | null;
  target100: string | null;
  target120: string | null;
  target80: string | null;
  target90: string | null;
  target70: string | null;
  type: string | null;
};

export function bonusEvaluationMapValue(kpi: RawKpiForMapping) {
  const weightStr = kpi.weight == null ? "0" : String(kpi.weight);

  return {
    id: kpi.id,
    year: kpi.year,
    name: kpi.name ?? "",
    weight: Number.isNaN(Number(weightStr)) ? 0 : Number(weightStr),
    category: kpi.category ?? KpiCategory.FP,
    objective: kpi.objective ?? "",
    definition: kpi.definition ?? "",
    strategy: kpi.strategy ?? "",
    method: kpi.method ?? "",
    type: kpi.type,
    target120: kpi.target120,
    target70: kpi.target70,
    target80: kpi.target80,
    target90: kpi.target90,
    target100: kpi.target100,
  };
}

export function validateWeight(rank: Rank) {
  if (managerUp.includes(rank)) {
    return 50;
  }

  if (chiefDown.includes(rank)) {
    return 30;
  }

  return 40;
}

export function isBlankRow(row: Record<string, any>): boolean {
  const requiredFields = ["name", "category", "definition", "method"]

  return requiredFields.every((field) => {
    const value = String(row[field] || "").trim()
    return !value
  });
}

export function validateKpiUpload(sheet: Array<Record<string, any>>) {
  const errors: Array<{ row: number; errors: z.ZodError }> = []
  const validKpis: Array<z.infer<typeof kpiUploadSchema>> = []

  sheet.forEach((row, index) => {
    const rowNumber = (row._rowIndex as number) || index + 2

    // Skip blank rows
    if (isBlankRow(row)) {
      return;
    }

    try {
      const validatedData = kpiUploadSchema.parse(row)
      validKpis.push(validatedData)
    } catch (error) {
      if (error instanceof z.ZodError) {
        errors.push({ row: rowNumber, errors: error })
      }
    }
  })

  return { errors, validKpis }
}

export function formatValidationErrors(errors: Array<{ row: number; errors: z.ZodError }>) {
  return errors.map(({ row, errors: zodErrors }) => {
    const fieldErrors = zodErrors.issues
      .map((err) => {
        const field = err.path.join(".")
        return `${field}: ${err.message}`
      })
      .join(", ")

    return {
      row,
      message: fieldErrors,
    }
  })
}