import { z } from "zod";
import { CompetencyType, Period } from "@/generated/prisma/enums";
import { MeritDefinition } from "./schemas/definition";
import { inferProcedureOutput } from "@trpc/server";
import { AppRouter } from "@/trpc/routers/_app";
import { Rank, managerUp, chiefDown } from "@/types/employees";
import { Approval } from "../tasks/permissions";
import { MeritEvaluation } from "./schemas/evaluation";
import { competencyUploadSchema, cultureUploadSchema } from "./schemas/upload";
import { CompetencyRecord, CompetencyEvaluation, CultureRecord, CultureEvaluation } from "@/generated/prisma/client";

type MeritFormData = inferProcedureOutput<AppRouter["merit"]["getOne"]>["form"];

/**
 * Get allowed competency types based on rank and order index
 * @param rank - Employee rank
 * @param orderIndex - Zero-based index of competency record (0, 1, 2, 3...)
 * @returns Array of allowed CompetencyType
 */
export function getCompetencyTypesByRankAndOrder(
  rank: string,
  orderIndex: number
): { types: CompetencyType[], label: string } {
  const rankEnum = rank as Rank;

  // managerUp: order 0,1 -> [FC, TC], order 2,3 -> MC
  if (managerUp.includes(rankEnum)) {
    if (orderIndex === 0 || orderIndex === 1) {
      return { types: [CompetencyType.FC, CompetencyType.TC], label: "Functional / Core Competency" };
    }
    if (orderIndex === 2 || orderIndex === 3) {
      return { types: [CompetencyType.MC], label: "Managerial Competency" };
    }
    // For order > 3, return empty array or all types? Based on requirement, seems like only 4 slots
    return { types: [CompetencyType.MC], label: "Managerial Competency" };
  }

  // chiefDown + CHIEF: all types
  if (chiefDown.includes(rankEnum) || rankEnum === Rank.CHIEF) {
    return { types: Object.values(CompetencyType), label: "Competency" };
  }

  // Default: return all types
  return { types: Object.values(CompetencyType), label: "Competency" };
}

export function meritDefinitionMap(data: MeritFormData): MeritDefinition {
  const competencies = (data.competencyRecords || []).map((record) => {
    const weightStr = record.weight == null ? "0" : String(record.weight);

    return {
      id: record.id,
      competencyId: record.competencyId || "",
      input: record.input || "",
      output: record.output || "",
      weight: Number.isNaN(Number(weightStr)) ? 0 : Number(weightStr),
      expectedLevel: record.expectedLevel ?? 0,
    };
  });

  const cultures = (data.cultureRecords || []).map((record) => {
    return {
      id: record.id,
      evidence: record.evidence || "",
    };
  });

  return {
    competencies,
    cultures,
  };
}

const toNumberOrZero = (value: unknown): number => Number.isNaN(Number(value)) ? 0 : Number(value);

export function meritEvaluationsMap(
  data: MeritFormData,
  period: Period,
  role: Approval
): MeritEvaluation {
  const competencies = data.competencyRecords.map(record => {
    const evaluation = record.competencyEvaluations.find(e => e.period === period);

    return {
      id: evaluation?.id ?? "",
      role,
      actualOwner: evaluation?.actualOwner ?? null,
      achievementOwner: evaluation?.levelOwner != null ? toNumberOrZero(evaluation.levelOwner) : null,
      actualChecker: evaluation?.actualChecker ?? null,
      achievementChecker: evaluation?.levelChecker != null ? toNumberOrZero(evaluation.levelChecker) : null,
      actualApprover: evaluation?.actualApprover ?? null,
      achievementApprover: evaluation?.levelApprover != null ? toNumberOrZero(evaluation.levelApprover) : null,
      fileUrl: evaluation?.fileUrl ?? null,
      result: evaluation?.result ?? null,
    };
  });

  const cultures = data.cultureRecords.map(record => {
    const evaluation = record.cultureEvaluations.find(e => e.period === period);

    return {
      id: evaluation?.id ?? "",
      role,
      actualOwner: evaluation?.actualOwner ?? null,
      levelBehaviorOwner: toNumberOrZero(evaluation?.levelBehaviorOwner),
      actualChecker: evaluation?.actualChecker ?? null,
      levelBehaviorChecker: toNumberOrZero(evaluation?.levelBehaviorChecker),
      actualApprover: evaluation?.actualApprover ?? null,
      levelBehaviorApprover: toNumberOrZero(evaluation?.levelBehaviorApprover),
      fileUrl: evaluation?.fileUrl ?? null,
      result: evaluation?.result ?? null,
    };
  });

  return { competencies, cultures };
}

export function validateWeight(position: Rank) {
  switch (position) {
    case Rank.CHIEF:
      return 40;
    case Rank.PRESIDENT:
    case Rank.MD:
    case Rank.VP:
    case Rank.GM:
    case Rank.AGM:
    case Rank.MGR:
    case Rank.SMGR:
      return 50;
    case Rank.FOREMAN:
    case Rank.STAFF:
    case Rank.OFFICER:
      return 30;
    default:
      return 30;
  }
}

export function isBlankCompetencyRow(row: Record<string, any>): boolean {
  const requiredFields = ["competencyId", "name", "expectedLevel", "input", "output", "weight"];
  return requiredFields.every((field) => {
    const value = String(row[field] || "").trim();
    return !value;
  });
}

export function isBlankCultureRow(row: Record<string, any>): boolean {
  const requiredFields = ["code", "evidence"];
  return requiredFields.every((field) => {
    const value = String(row[field] || "").trim();
    return !value;
  });
}

export function validateMeritUpload(
  competencySheet: Array<Record<string, any>>,
  cultureSheet: Array<Record<string, any>>
) {
  const competencyErrors: Array<{ row: number; errors: z.ZodError }> = [];
  const validCompetencies: Array<z.infer<typeof competencyUploadSchema>> = [];
  const cultureErrors: Array<{ row: number; errors: z.ZodError }> = [];
  const validCultures: Array<z.infer<typeof cultureUploadSchema>> = [];

  competencySheet.forEach((row, index) => {
    const rowNumber = (row._rowIndex as number) || index + 2;

    if (isBlankCompetencyRow(row)) {
      return;
    }

    try {
      const validatedData = competencyUploadSchema.parse(row);
      validCompetencies.push(validatedData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        competencyErrors.push({ row: rowNumber, errors: error });
      }
    }
  });

  cultureSheet.forEach((row, index) => {
    const rowNumber = (row._rowIndex as number) || index + 2;

    if (isBlankCultureRow(row)) {
      return;
    }

    try {
      const validatedData = cultureUploadSchema.parse(row);
      validCultures.push(validatedData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        cultureErrors.push({ row: rowNumber, errors: error });
      }
    }
  });

  return {
    competencyErrors,
    validCompetencies,
    cultureErrors,
    validCultures,
  };
}

export function formatMeritValidationErrors(
  competencyErrors: Array<{ row: number; errors: z.ZodError }>,
  cultureErrors: Array<{ row: number; errors: z.ZodError }>
) {
  const allErrors = [
    ...competencyErrors.map(({ row, errors: zodErrors }) => {
      const fieldErrors = zodErrors.issues
        .map((err) => {
          const field = err.path.join(".");
          return `${field}: ${err.message}`;
        })
        .join(", ");

      return {
        row,
        message: `[Competency Sheet] ${fieldErrors}`,
      };
    }),
    ...cultureErrors.map(({ row, errors: zodErrors }) => {
      const fieldErrors = zodErrors.issues
        .map((err) => {
          const field = err.path.join(".");
          return `${field}: ${err.message}`;
        })
        .join(", ");

      return {
        row,
        message: `[Culture Sheet] ${fieldErrors}`,
      };
    }),
  ];

  return allErrors;
}


type CompetencyLevelKey =
  | 'levelOwner'
  | 'levelChecker'
  | 'levelApprover';

export function sumCompetencyByPeriod(
  competencyRecords: (CompetencyRecord & { competencyEvaluations: CompetencyEvaluation[] })[],
  period: Period,
  levelKey: CompetencyLevelKey,
  maxLevel = 5,
): number {
  return competencyRecords.reduce((acc, record) => {
    const evaluation = record.competencyEvaluations?.find(
      e => e.period === period,
    );

    if (!evaluation) return acc;

    const level = Number(evaluation[levelKey] ?? 0);
    const weight = Number(record.weight ?? 0);

    return acc + (level / maxLevel) * weight;
  }, 0);
}

type CultureLevelKey =
  | 'levelBehaviorOwner'
  | 'levelBehaviorChecker'
  | 'levelBehaviorApprover';

export function sumCultureByPeriod(
  cultureRecords: (CultureRecord & { cultureEvaluations: CultureEvaluation[] })[],
  period: Period,
  levelKey: CultureLevelKey,
  totalWeight = 30,
  maxLevel = 5,
): number {
  const count = cultureRecords.length;
  if (count === 0) return 0;

  const weightPerItem = totalWeight / count;

  return cultureRecords.reduce((acc, record) => {
    const evaluation = record.cultureEvaluations?.find(
      e => e.period === period,
    );

    if (!evaluation) return acc;

    const level = Number(evaluation[levelKey] ?? 0);

    return acc + (level / maxLevel) * weightPerItem;
  }, 0);
}
