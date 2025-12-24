import { CompetencyType, Period } from "@/generated/prisma/enums";
import { MeritDefinition } from "./schemas/definition";
import { inferProcedureOutput } from "@trpc/server";
import { AppRouter } from "@/trpc/routers/_app";
import { Rank, managerUp, chiefDown } from "@/types/employees";
import { Approval } from "../tasks/permissions";
import { MeritEvaluation } from "./schemas/evaluation";

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