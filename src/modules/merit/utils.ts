import ExcelJS from "exceljs";

import { z } from "zod";
import { CompetencyType, Period } from "@/generated/prisma/enums";
import { MeritDefinition } from "./schemas/definition";
import { inferProcedureOutput } from "@trpc/server";
import { AppRouter } from "@/trpc/routers/_app";
import { Rank, managerUp, chiefDown } from "@/types/employees";
import { Approval } from "../tasks/permissions";
import { MeritEvaluation } from "./schemas/evaluation";
import { competencyUploadSchema, cultureUploadSchema } from "./schemas/upload";
import { CompetencyRecord, CompetencyEvaluation, CultureRecord, CultureEvaluation, MeritOverallComment } from "@/generated/prisma/client";
import { MeritDefinitionWithTasks, MeritFormWithInfo } from "./types";
import { PERIOD_LABELS } from "../tasks/constant";
import { formatDecimal } from "@/lib/utils";

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
      return { types: [CompetencyType.FC, CompetencyType.TC], label: "Functional / Technical Competency" };
    }
    if (orderIndex === 2 || orderIndex === 3) {
      return { types: [CompetencyType.MC], label: "Managerial Competency" };
    }
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
    saved: false,
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
      levelBehaviorOwner: evaluation?.levelBehaviorOwner != null ? toNumberOrZero(evaluation.levelBehaviorOwner) : null,
      actualChecker: evaluation?.actualChecker ?? null,
      levelBehaviorChecker: evaluation?.levelBehaviorChecker != null ? toNumberOrZero(evaluation.levelBehaviorChecker) : null,
      actualApprover: evaluation?.actualApprover ?? null,
      levelBehaviorApprover: evaluation?.levelBehaviorApprover != null ? toNumberOrZero(evaluation.levelBehaviorApprover) : null,
      fileUrl: evaluation?.fileUrl ?? null,
      result: evaluation?.result ?? null,
    };
  });

  const overallComment = data.overallComment;

  return {
    competencies,
    cultures,
    overallComments: {
      role,
      commentOwner: overallComment?.commentOwner ?? null,
      commentChecker: overallComment?.commentChecker ?? null,
      commentApprover: overallComment?.commentApprover ?? null,
    },
  };
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

export function formatMeritExport(meritForm: MeritFormWithInfo) {
  const calcPercentage = (weight: number, decimal: number, achievement?: number) =>
    formatDecimal(weight * ((achievement ?? 0) / 5));

  const nameOrder = ["S", "M", "A", "R", "T"];
  const getSortIndex = (name: string | undefined) => {
    if (!name) return nameOrder.length;
    const index = nameOrder.indexOf(name);
    return index === -1 ? nameOrder.length : index;
  };

  // 🟢 IN_DRAFT
  const inDraft = [
    // Competency
    ...meritForm.competencyRecords.map((c) => ({
      employeeId: meritForm.employee.id,
      employeeName: meritForm.employee.name,
      year: meritForm.year,
      period: PERIOD_LABELS[Period.IN_DRAFT],
      performer: "Approver",
      type: "Competency",
      name: c.competency?.name,
      percentage: formatDecimal(Number(c.weight)),
    })),

    // Culture
    ...meritForm.cultureRecords
      .sort((a, b) => {
        const indexA = getSortIndex(a.culture.code);
        const indexB = getSortIndex(b.culture.code);
        return indexA - indexB;
      })
      .map((c) => ({
        employeeId: meritForm.employee.id,
        employeeName: meritForm.employee.name,
        year: meritForm.year,
        period: PERIOD_LABELS[Period.IN_DRAFT],
        performer: "Approver",
        type: "Culture",
        name: c.culture.code,
        percentage: formatDecimal(30 / meritForm.cultureRecords.length),
      })),
  ];

  // 🟡 Helper function สำหรับ Evaluation (1st / 2nd)
  const createEvaluationData = (periodType: Period) => {
    const competency = meritForm.competencyRecords.flatMap((c) => {
      const evaluation = c.competencyEvaluations.find((e) => e.period === periodType);

      const base = {
        employeeId: meritForm.employee.id,
        employeeName: meritForm.employee.name,
        year: meritForm.year,
        period: PERIOD_LABELS[periodType],
        type: "Competency" as const,
        detail: evaluation?.result,
        owner: evaluation?.actualOwner,
        checker: evaluation?.actualChecker,
        approver: evaluation?.actualApprover,
        name: c.competency?.name,
      };

      const performers = [
        { performer: "Owner", score: evaluation?.levelOwner },
        { performer: "Checker", score: evaluation?.levelChecker },
        { performer: "Approver", score: evaluation?.levelApprover },
      ];

      return performers.map((p) => ({
        ...base,
        performer: p.performer,
        percentage: calcPercentage(Number(c.weight), 0, p.score || 0),
      }));
    });

    const culture = meritForm.cultureRecords
      .sort((a, b) => {
        const indexA = getSortIndex(a.culture.code);
        const indexB = getSortIndex(b.culture.code);
        return indexA - indexB;
      })
      .flatMap((c) => {
        const evaluation = c.cultureEvaluations.find((e) => e.period === periodType);

        const base = {
          employeeId: meritForm.employee.id,
          employeeName: meritForm.employee.name,
          year: meritForm.year,
          period: PERIOD_LABELS[periodType],
          type: "Culture" as const,
          name: c.culture.code,
          detail: evaluation?.result,
          owner: evaluation?.actualOwner,
          checker: evaluation?.actualChecker,
          approver: evaluation?.actualApprover,
        };

        const weight = 30 / meritForm.cultureRecords.length;

        const performers = [
          { performer: "Owner", score: evaluation?.levelBehaviorOwner },
          { performer: "Checker", score: evaluation?.levelBehaviorChecker },
          { performer: "Approver", score: evaluation?.levelBehaviorApprover },
        ];

        return performers.map((p) => ({
          ...base,
          performer: p.performer,
          percentage: calcPercentage(weight, 0, p.score || 0),
        }));
      });

    return [...competency, ...culture];
  };

  // 🔵 EVALUATION_1ST + EVALUATION_2ND
  const evaluation1st = createEvaluationData(Period.EVALUATION_1ST);
  const evaluation2nd = createEvaluationData(Period.EVALUATION_2ND);

  // 🔴 เรียง performer
  const performerOrder = ["Owner", "Checker", "Approver"];
  const sortByPerformer = (data: Array<{ performer: string }>) =>
    performerOrder.flatMap((role) => data.filter((d) => d.performer === role));

  const sortedEval1st = sortByPerformer(evaluation1st);
  const sortedEval2nd = sortByPerformer(evaluation2nd);

  // 🟣 รวมทั้งหมด
  return [...inDraft, ...sortedEval1st, ...sortedEval2nd];
}

function getManagerLevelLabel(rank: Rank | string): string {
  const r = rank as Rank;

  if (r === Rank.MGR) {
    return "Manager";
  }

  if (r === Rank.GM || r === Rank.AGM) {
    return "GM/AGM";
  }

  if (r === Rank.MD || r === Rank.VP) {
    return "MD/VP";
  }

  return "-";
}

const MERIT_EXPORT_COLS = [
  "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P",
] as const;
const MERIT_EXPORT_LAST_COL = "P";

const LEVEL_SUB_HEADERS = {
  employee: "พนักงาน \n(Employee)",
  evaluator1: "ผู้ประเมินลำดับที่ 1 \n(Evaluator 1)",
  evaluator2: "ผู้ประเมินลำดับที่ 2 \n(Evaluator 2)",
} as const;

const MERIT_COMMENT_MID_YEAR_COLS = ["A", "B", "C", "D", "E", "F"] as const;
const MERIT_COMMENT_YEAR_END_COLS = ["G", "H", "I", "J", "K", "L", "M", "N", "O", "P"] as const;

function splitMeritExportColumns(cols: readonly string[], groupCount: number): string[][] {
  const groups: string[][] = [];
  let index = 0;
  const baseSize = Math.floor(cols.length / groupCount);
  const remainder = cols.length % groupCount;

  for (let i = 0; i < groupCount; i++) {
    const size = baseSize + (i < remainder ? 1 : 0);
    groups.push([...cols.slice(index, index + size)]);
    index += size;
  }

  return groups;
}

function resolveOverallComments(meritForm: MeritDefinitionWithTasks): MeritOverallComment[] {
  if (meritForm.overallComments?.length) {
    return meritForm.overallComments;
  }

  const single = (meritForm as { overallComment?: MeritOverallComment | null }).overallComment;
  return single ? [single] : [];
}

function getOverallCommentByPeriod(
  overallComments: MeritOverallComment[],
  period: Period,
): MeritOverallComment | null {
  return overallComments.find((c) => c.period === period) ?? null;
}

export async function exportMeritDefinition(meritForm: MeritDefinitionWithTasks) {
  const overallComments = resolveOverallComments(meritForm);
  const commentMidYear = getOverallCommentByPeriod(overallComments, Period.EVALUATION_1ST);
  const commentEndYear = getOverallCommentByPeriod(overallComments, Period.EVALUATION_2ND);
  const hasChecker = Boolean(meritForm.task.checker);
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Merit");

  worksheet.columns = [
    { width: 5 }, // A - No.
    { width: 25 }, // B - Name
    { width: 10 }, // C - Weight
    { width: 30 }, // D - Expected Behavior
    { width: 30 }, // E - Input
    { width: 30 }, // F - Output
    { width: 25 }, // G - Evidence (Mid-Year)
    { width: 12 }, // H - Level Employee (Mid-Year)
    { width: 12 }, // I - Level Evaluator 1 (Mid-Year)
    { width: 12 }, // J - Level Evaluator 2 (Mid-Year)
    { width: 10 }, // K - Score (Mid-Year)
    { width: 25 }, // L - Evidence (End-Year)
    { width: 12 }, // M - Level Employee (End-Year)
    { width: 12 }, // N - Level Evaluator 1 (End-Year)
    { width: 12 }, // O - Level Evaluator 2 (End-Year)
    { width: 10 }, // P - Score (End-Year)
  ];  

  const blueHeader = {
    fill: {
      type: "pattern" as const,
      pattern: "solid" as const,
      fgColor: { argb: "FFE8F0FE" },
    },
    font: { bold: true, color: { argb: "FF1E40AF" } },
    border: {
      top: { style: "thin" as const, color: { argb: "FF93C5FD" } },
      left: { style: "thin" as const, color: { argb: "FF93C5FD" } },
      bottom: { style: "thin" as const, color: { argb: "FF93C5FD" } },
      right: { style: "thin" as const, color: { argb: "FF93C5FD" } },
    },
    alignment: {
      horizontal: "center" as const,
      vertical: "middle" as const,
      wrapText: true,
    },
  };

  const cellBorder = {
    top: { style: "thin" as const, color: { argb: "FF93C5FD" } },
    left: { style: "thin" as const, color: { argb: "FF93C5FD" } },
    bottom: { style: "thin" as const, color: { argb: "FF93C5FD" } },
    right: { style: "thin" as const, color: { argb: "FF93C5FD" } },
  };

  // Title
  worksheet.mergeCells(`A1:${MERIT_EXPORT_LAST_COL}1`);
  const titleCell = worksheet.getCell("A1");
  titleCell.value = `แบบประเมินผลการปฏิบัติงาน ประจำปี ${meritForm.year}`;
  titleCell.font = {
    bold: true,
    size: 16,
    color: {
      argb: "FF1E40AF",
    },
  };

  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  worksheet.getRow(1).height = 30;

  worksheet.mergeCells(`A2:${MERIT_EXPORT_LAST_COL}2`);
  const subtitleCell = worksheet.getCell("A2");
  subtitleCell.value = "KPI Merit";
  subtitleCell.font = { bold: true, color: { argb: "FF1E40AF" } };
  subtitleCell.alignment = { horizontal: "center", vertical: "middle" };

  const managerCell = worksheet.getCell(`${MERIT_EXPORT_LAST_COL}3`);
  managerCell.value = getManagerLevelLabel(meritForm.employee.rank as Rank);
  managerCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF2563EB" },
  };
  managerCell.font = { bold: true, color: { argb: "FFFFFFFF" } };
  managerCell.alignment = { horizontal: "center", vertical: "middle" };
  worksheet.getRow(2).height = 25;
  worksheet.getRow(3).height = 32;

  let currentRow = 4;

  // Header row for info Section
  worksheet.mergeCells(`A${currentRow}:B${currentRow}`);
  worksheet.getCell(`A${currentRow}`).value = "พนักงาน (Employee)";
  worksheet.getCell(`A${currentRow}`).style = blueHeader;

  worksheet.mergeCells(`C${currentRow}:F${currentRow}`);
  worksheet.getCell(`C${currentRow}`).value = "ข้อมูล (Info)";
  worksheet.getCell(`C${currentRow}`).style = blueHeader;

  worksheet.mergeCells(`G${currentRow}:H${currentRow}`);
  worksheet.getCell(`G${currentRow}`).value = "ผู้ประเมิน (Approver)";
  worksheet.getCell(`G${currentRow}`).style = blueHeader;

  worksheet.mergeCells(`I${currentRow}:${MERIT_EXPORT_LAST_COL}${currentRow}`);
  worksheet.getCell(`I${currentRow}`).value = "ข้อมูล (Info)";
  worksheet.getCell(`I${currentRow}`).style = blueHeader;

  // ให้เส้นขอบหัวตาราง Owner/Info/Approver/Info แสดงครบทุกคอลัมน์
  for (const col of MERIT_EXPORT_COLS) {
    worksheet.getCell(`${col}${currentRow}`).border = cellBorder
  }

  currentRow++;

  const infoRows = [
    {
      label: "ชื่อ-สกุล (Name-Surname)",
      evalueeValue: meritForm.employee.name,
      evaluatorLabel: "ผู้ประเมินลำดับที่ 1 (Evaluator #1)",
      evaluatorValue: meritForm.task.checker?.name,
    },
    {
      label: "แผนก (Department)",
      evalueeValue: meritForm.employee.department,
      evaluatorLabel: "ตำแหน่ง (Position)",
      evaluatorValue: meritForm.task.checker?.position,
    },
    {
      label: "รหัส (Emp ID)",
      evalueeValue: meritForm.employee.id,
      evaluatorLabel: "ผู้ประเมินลำดับที่ 2 (Evaluator #2)",
      evaluatorValue: meritForm.task.approver.name,
    },
    {
      label: "ตำแหน่ง (Position)",
      evalueeValue: meritForm.employee.position,
      evaluatorLabel: "ตำแหน่ง (Position)",
      evaluatorValue: meritForm.task.approver.position,
    },
    {
      label: "ระดับ (Level)",
      evalueeValue: meritForm.employee.rank,
      evaluatorLabel: "",
      evaluatorValue: "",
    },
    {
      label: "บริษัท (Company)",
      evalueeValue: meritForm.employee.division,
      evaluatorLabel: "",
      evaluatorValue: "",
    },
  ];

  for (const info of infoRows) {
    worksheet.mergeCells(`A${currentRow}:B${currentRow}`)
    worksheet.getCell(`A${currentRow}`).value = info.label
    worksheet.getCell(`A${currentRow}`).border = cellBorder
    worksheet.getCell(`A${currentRow}`).font = { size: 9, color: { argb: "FF1E40AF" } }

    worksheet.mergeCells(`C${currentRow}:F${currentRow}`)
    worksheet.getCell(`C${currentRow}`).value = info.evalueeValue
    worksheet.getCell(`C${currentRow}`).border = cellBorder
    worksheet.getCell(`C${currentRow}`).font = { size: 9 }

    worksheet.mergeCells(`G${currentRow}:H${currentRow}`)
    worksheet.getCell(`G${currentRow}`).value = info.evaluatorLabel
    worksheet.getCell(`G${currentRow}`).border = cellBorder
    worksheet.getCell(`G${currentRow}`).font = { size: 9, color: { argb: "FF1E40AF" } }

    worksheet.mergeCells(`I${currentRow}:${MERIT_EXPORT_LAST_COL}${currentRow}`)
    worksheet.getCell(`I${currentRow}`).value = info.evaluatorValue
    worksheet.getCell(`I${currentRow}`).border = cellBorder
    worksheet.getCell(`I${currentRow}`).font = { size: 9 }

    // ให้เส้นขอบต่อเนื่องครบทุกคอลัมน์ในแถวข้อมูล
    for (const col of MERIT_EXPORT_COLS) {
      worksheet.getCell(`${col}${currentRow}`).border = cellBorder
    }

    currentRow++
  }

  currentRow++;

  // ========== COMPETENCY SECTION ==========
  worksheet.mergeCells(`A${currentRow}:${MERIT_EXPORT_LAST_COL}${currentRow}`)
  worksheet.getCell(`A${currentRow}`).value = "Competency (สมรรถนะ)"
  worksheet.getCell(`A${currentRow}`).font = { bold: true, color: { argb: "FF1E40AF" }, size: 12 }
  worksheet.getCell(`A${currentRow}`).border = cellBorder
  currentRow++

  // Competency Table Headers Row 1
  const compHeaderRow1 = currentRow
  worksheet.getCell(`A${compHeaderRow1}`).value = "ที่ \n(No.)"
  worksheet.getCell(`B${compHeaderRow1}`).value = "สมรรถนะ \n(Competency)"
  worksheet.getCell(`C${compHeaderRow1}`).value = "น้ำหนัก \n(Weight)"
  worksheet.getCell(`D${compHeaderRow1}`).value = "พฤติกรรมที่คาดหวัง \n(Expected Behavior)"
  worksheet.getCell(`E${compHeaderRow1}`).value = "การแสดงออกตามพฤติกรรมที่คาดหวัง\n(Demonstration of Expected Behavior)"
  worksheet.getCell(`F${compHeaderRow1}`).value = "โครงการ/กิจกรรมที่ใช้เป็นตัวประเมินการแสดงออกตามพฤติกรรมที่คาดหวัง \n(Projects / Activities Demonstrating Expected Behavior)"
  worksheet.mergeCells(`G${compHeaderRow1}:K${compHeaderRow1}`)
  worksheet.getCell(`G${compHeaderRow1}`).value = "การทบทวนผลการปฏิบัติงานกลางปี (JAN - JUN) \n(Mid-Year Review)"
  worksheet.mergeCells(`L${compHeaderRow1}:${MERIT_EXPORT_LAST_COL}${compHeaderRow1}`)
  worksheet.getCell(`L${compHeaderRow1}`).value = "การประเมินผลการปฏิบัติงานปลายปี (JUN - DEC) \n(End-Year Evaluation)"

  for (const col of MERIT_EXPORT_COLS) {
    worksheet.getCell(`${col}${compHeaderRow1}`).style = blueHeader
  }
  worksheet.getRow(compHeaderRow1).height = 40
  worksheet.getRow(compHeaderRow1).font = { size: 9, color: { argb: "FF1E40AF" } }

  currentRow++
  const compHeaderRow2 = currentRow

  // Competency Table Headers Row 2
  worksheet.getCell(`G${compHeaderRow2}`).value = "ผลลัพธ์การแสดงออกตามพฤติกรรมที่คาดหวัง \n(Result)"
  worksheet.mergeCells(`H${compHeaderRow2}:J${compHeaderRow2}`)
  worksheet.getCell(`H${compHeaderRow2}`).value = "ระดับความสำเร็จ \n(Level of Achievement)"
  worksheet.getCell(`K${compHeaderRow2}`).value = "คะแนน \n(Score)"
  worksheet.getCell(`L${compHeaderRow2}`).value = "ผลลัพธ์การแสดงออกตามพฤติกรรมที่คาดหวัง \n(Result)"
  worksheet.mergeCells(`M${compHeaderRow2}:O${compHeaderRow2}`)
  worksheet.getCell(`M${compHeaderRow2}`).value = "ระดับความสำเร็จ \n(Level of Achievement)"
  worksheet.getCell(`P${compHeaderRow2}`).value = "คะแนน \n(Score)"

  for (const col of MERIT_EXPORT_COLS) {
    worksheet.getCell(`${col}${compHeaderRow2}`).style = blueHeader
  }
  worksheet.getRow(compHeaderRow2).height = 30
  worksheet.getRow(compHeaderRow2).font = { size: 9, color: { argb: "FF1E40AF" } }

  currentRow++
  const compHeaderRow3 = currentRow

  // Competency Table Headers Row 3 (Level sub-columns)
  worksheet.getCell(`H${compHeaderRow3}`).value = LEVEL_SUB_HEADERS.employee
  worksheet.getCell(`I${compHeaderRow3}`).value = LEVEL_SUB_HEADERS.evaluator1
  worksheet.getCell(`J${compHeaderRow3}`).value = LEVEL_SUB_HEADERS.evaluator2
  worksheet.getCell(`M${compHeaderRow3}`).value = LEVEL_SUB_HEADERS.employee
  worksheet.getCell(`N${compHeaderRow3}`).value = LEVEL_SUB_HEADERS.evaluator1
  worksheet.getCell(`O${compHeaderRow3}`).value = LEVEL_SUB_HEADERS.evaluator2

  for (const col of MERIT_EXPORT_COLS) {
    worksheet.getCell(`${col}${compHeaderRow3}`).style = blueHeader
  }
  worksheet.getRow(compHeaderRow3).height = 30
  worksheet.getRow(compHeaderRow3).font = { size: 9, color: { argb: "FF1E40AF" } }

  worksheet.mergeCells(`A${compHeaderRow1}:A${compHeaderRow3}`)
  worksheet.mergeCells(`B${compHeaderRow1}:B${compHeaderRow3}`)
  worksheet.mergeCells(`C${compHeaderRow1}:C${compHeaderRow3}`)
  worksheet.mergeCells(`D${compHeaderRow1}:D${compHeaderRow3}`)
  worksheet.mergeCells(`E${compHeaderRow1}:E${compHeaderRow3}`)
  worksheet.mergeCells(`F${compHeaderRow1}:F${compHeaderRow3}`)
  worksheet.mergeCells(`G${compHeaderRow2}:G${compHeaderRow3}`)
  worksheet.mergeCells(`K${compHeaderRow2}:K${compHeaderRow3}`)
  worksheet.mergeCells(`L${compHeaderRow2}:L${compHeaderRow3}`)
  worksheet.mergeCells(`P${compHeaderRow2}:P${compHeaderRow3}`)

  currentRow++;

  for (let i = 0; i < meritForm.competencyRecords.length; i++) {
    const comp = meritForm.competencyRecords[i]
    worksheet.getCell(`A${currentRow}`).value = i + 1
    worksheet.getCell(`A${currentRow}`).alignment = { horizontal: "center", vertical: "middle" }
    worksheet.getCell(`A${currentRow}`).border = cellBorder
    worksheet.getCell(`A${currentRow}`).font = { size: 9 }

    worksheet.getCell(`B${currentRow}`).value = comp.competency?.name
    worksheet.getCell(`B${currentRow}`).alignment = { vertical: "top", wrapText: true }
    worksheet.getCell(`B${currentRow}`).border = cellBorder
    worksheet.getCell(`B${currentRow}`).font = { size: 9 }

    worksheet.getCell(`C${currentRow}`).value = formatDecimal(Number(comp.weight))
    worksheet.getCell(`C${currentRow}`).alignment = { horizontal: "center", vertical: "middle" }
    worksheet.getCell(`C${currentRow}`).border = cellBorder
    worksheet.getCell(`C${currentRow}`).font = { size: 9 }

    worksheet.getCell(`D${currentRow}`).value = comp.competency?.[`t${comp.expectedLevel}` as 't1' | 't2' | 't3' | 't4' | 't5'] as string | null
    worksheet.getCell(`D${currentRow}`).alignment = { vertical: "top", wrapText: true }
    worksheet.getCell(`D${currentRow}`).border = cellBorder 
    worksheet.getCell(`D${currentRow}`).font = { size: 9 }

    worksheet.getCell(`E${currentRow}`).value = comp.input
    worksheet.getCell(`E${currentRow}`).alignment = { vertical: "top", wrapText: true }
    worksheet.getCell(`E${currentRow}`).border = cellBorder
    worksheet.getCell(`E${currentRow}`).font = { size: 9 }

    worksheet.getCell(`F${currentRow}`).value = comp.output
    worksheet.getCell(`F${currentRow}`).alignment = { vertical: "top", wrapText: true }
    worksheet.getCell(`F${currentRow}`).border = cellBorder
    worksheet.getCell(`F${currentRow}`).font = { size: 9 }

    const compEva1st = comp.competencyEvaluations.find((f) => f.period === Period.EVALUATION_1ST)
    const compEva2nd = comp.competencyEvaluations.find((f) => f.period === Period.EVALUATION_2ND)

    worksheet.getCell(`G${currentRow}`).value = compEva1st?.actualApprover
    worksheet.getCell(`G${currentRow}`).alignment = { vertical: "top", wrapText: true }
    worksheet.getCell(`G${currentRow}`).border = cellBorder
    worksheet.getCell(`G${currentRow}`).font = { size: 9 }

    worksheet.getCell(`H${currentRow}`).value = compEva1st?.levelOwner ?? 0
    worksheet.getCell(`H${currentRow}`).alignment = { horizontal: "center", vertical: "middle" }
    worksheet.getCell(`H${currentRow}`).border = cellBorder
    worksheet.getCell(`H${currentRow}`).font = { size: 9 }

    worksheet.getCell(`I${currentRow}`).value = compEva1st?.levelChecker ?? 0
    worksheet.getCell(`I${currentRow}`).alignment = { horizontal: "center", vertical: "middle" }
    worksheet.getCell(`I${currentRow}`).border = cellBorder
    worksheet.getCell(`I${currentRow}`).font = { size: 9 }

    worksheet.getCell(`J${currentRow}`).value = compEva1st?.levelApprover ?? 0
    worksheet.getCell(`J${currentRow}`).alignment = { horizontal: "center", vertical: "middle" }
    worksheet.getCell(`J${currentRow}`).border = cellBorder
    worksheet.getCell(`J${currentRow}`).font = { size: 9 }

    worksheet.getCell(`K${currentRow}`).value = formatDecimal(((compEva1st?.levelApprover ?? 0) / 5) * Number(comp.weight))
    worksheet.getCell(`K${currentRow}`).alignment = { horizontal: "center", vertical: "middle" }
    worksheet.getCell(`K${currentRow}`).border = cellBorder
    worksheet.getCell(`K${currentRow}`).font = { size: 9 }

    worksheet.getCell(`L${currentRow}`).value = compEva2nd?.actualApprover
    worksheet.getCell(`L${currentRow}`).alignment = { vertical: "top", wrapText: true }
    worksheet.getCell(`L${currentRow}`).border = cellBorder
    worksheet.getCell(`L${currentRow}`).font = { size: 9 }

    worksheet.getCell(`M${currentRow}`).value = compEva2nd?.levelOwner ?? 0
    worksheet.getCell(`M${currentRow}`).alignment = { horizontal: "center", vertical: "middle" }
    worksheet.getCell(`M${currentRow}`).border = cellBorder
    worksheet.getCell(`M${currentRow}`).font = { size: 9 }

    worksheet.getCell(`N${currentRow}`).value = compEva2nd?.levelChecker ?? 0
    worksheet.getCell(`N${currentRow}`).alignment = { horizontal: "center", vertical: "middle" }
    worksheet.getCell(`N${currentRow}`).border = cellBorder
    worksheet.getCell(`N${currentRow}`).font = { size: 9 }

    worksheet.getCell(`O${currentRow}`).value = compEva2nd?.levelApprover ?? 0
    worksheet.getCell(`O${currentRow}`).alignment = { horizontal: "center", vertical: "middle" }
    worksheet.getCell(`O${currentRow}`).border = cellBorder
    worksheet.getCell(`O${currentRow}`).font = { size: 9 }

    worksheet.getCell(`P${currentRow}`).value = formatDecimal(((compEva2nd?.levelApprover ?? 0) / 5) * Number(comp.weight))
    worksheet.getCell(`P${currentRow}`).alignment = { horizontal: "center", vertical: "middle" }
    worksheet.getCell(`P${currentRow}`).border = cellBorder
    worksheet.getCell(`P${currentRow}`).font = { size: 9 }

    worksheet.getRow(currentRow).height = 60
    currentRow++
  }

  // Competency Footer
  const competencyTotalWeight = meritForm.competencyRecords.reduce(
    (acc, comp) => acc + Number(comp.weight ?? 0),
    0,
  )

  // แสดงผลรวม Weight ให้ตรงกับคอลัมน์ Weight (C)
  worksheet.mergeCells(`A${currentRow}:B${currentRow}`)
  worksheet.getCell(`A${currentRow}`).value = "รวม (คะแนนเต็ม) / Total (Full Score)"
  worksheet.getCell(`A${currentRow}`).alignment = { horizontal: "right", vertical: "middle" }
  worksheet.getCell(`A${currentRow}`).font = { size: 9, color: { argb: "FF1E40AF" } }
  worksheet.getCell(`A${currentRow}`).border = cellBorder
  worksheet.getCell(`A${currentRow}`).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF0F7FF" } }

  worksheet.getCell(`C${currentRow}`).value = competencyTotalWeight ? formatDecimal(competencyTotalWeight) : ""
  worksheet.getCell(`C${currentRow}`).alignment = { horizontal: "center", vertical: "middle" }
  worksheet.getCell(`C${currentRow}`).font = { size: 9, color: { argb: "FF1E40AF" } }
  worksheet.getCell(`C${currentRow}`).border = cellBorder
  worksheet.getCell(`C${currentRow}`).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF0F7FF" } }

  worksheet.mergeCells(`H${currentRow}:J${currentRow}`)
  worksheet.getCell(`H${currentRow}`).value = "คะแนนที่ได้ (Score Achieved)"
  worksheet.getCell(`H${currentRow}`).alignment = { horizontal: "center", vertical: "middle" }
  worksheet.getCell(`H${currentRow}`).font = { size: 9, color: { argb: "FF1E40AF" } }
  worksheet.getCell(`H${currentRow}`).border = cellBorder
  worksheet.getCell(`H${currentRow}`).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF0F7FF" } }

  worksheet.getCell(`K${currentRow}`).value = formatDecimal(sumCompetencyByPeriod(
    meritForm.competencyRecords,
    Period.EVALUATION_1ST,
    "levelApprover"
  ))
  worksheet.getCell(`K${currentRow}`).alignment = { horizontal: "center", vertical: "middle" }
  worksheet.getCell(`K${currentRow}`).font = { size: 9, color: { argb: "FF1E40AF" } }
  worksheet.getCell(`K${currentRow}`).border = cellBorder
  worksheet.getCell(`K${currentRow}`).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF0F7FF" } }

  worksheet.mergeCells(`M${currentRow}:O${currentRow}`)
  worksheet.getCell(`M${currentRow}`).value = "คะแนนที่ได้ (Score Achieved)"
  worksheet.getCell(`M${currentRow}`).alignment = { horizontal: "center", vertical: "middle" }
  worksheet.getCell(`M${currentRow}`).font = { size: 9, color: { argb: "FF1E40AF" } }
  worksheet.getCell(`M${currentRow}`).border = cellBorder
  worksheet.getCell(`M${currentRow}`).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF0F7FF" } }

  worksheet.getCell(`P${currentRow}`).value = formatDecimal(sumCompetencyByPeriod(
    meritForm.competencyRecords,
    Period.EVALUATION_2ND,
    "levelApprover"
  ))
  worksheet.getCell(`P${currentRow}`).alignment = { horizontal: "center", vertical: "middle" }
  worksheet.getCell(`P${currentRow}`).font = { size: 9, color: { argb: "FF1E40AF" } }
  worksheet.getCell(`P${currentRow}`).border = cellBorder
  worksheet.getCell(`P${currentRow}`).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF0F7FF" } }

  // เติมพื้นหลังและเส้นขอบให้ครบทุกคอลัมน์ในแถว footer
  for (const col of MERIT_EXPORT_COLS) {
    const cell = worksheet.getCell(`${col}${currentRow}`)
    cell.border = cellBorder
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF0F7FF" } }
  }

  currentRow += 2;

  // ========== CULTURE SECTION ==========
  worksheet.mergeCells(`A${currentRow}:${MERIT_EXPORT_LAST_COL}${currentRow}`)
  worksheet.getCell(`A${currentRow}`).value = "Culture (วัฒนธรรม)"
  worksheet.getCell(`A${currentRow}`).font = { bold: true, color: { argb: "FF1E40AF" }, size: 12 }
  worksheet.getCell(`A${currentRow}`).border = cellBorder
  currentRow++

  // Culture Table Headers Row 1
  const cultHeaderRow1 = currentRow
  worksheet.getCell(`A${cultHeaderRow1}`).value = "ที่ \n(No.)"
  worksheet.getCell(`B${cultHeaderRow1}`).value = "วัฒนธรรม \n(Culture)"
  worksheet.getCell(`C${cultHeaderRow1}`).value = "น้ำหนัก \n(Weight)"
  worksheet.getCell(`D${cultHeaderRow1}`).value = "พฤติกรรมที่คาดหวัง \n(Expected Behavior)"
  worksheet.getCell(`E${cultHeaderRow1}`).value = "แนวทางในการประเมิน \n(Key Evidence Guideline)"
  worksheet.mergeCells(`G${cultHeaderRow1}:K${cultHeaderRow1}`)
  worksheet.getCell(`G${cultHeaderRow1}`).value = "การทบทวนผลการปฏิบัติงานกลางปี (JAN - JUN) \n(Mid-Year Review)"
  worksheet.mergeCells(`L${cultHeaderRow1}:${MERIT_EXPORT_LAST_COL}${cultHeaderRow1}`)
  worksheet.getCell(`L${cultHeaderRow1}`).value = "การประเมินผลการปฏิบัติงานปลายปี (JUN - DEC) \n(End-Year Evaluation)"

  for (const col of MERIT_EXPORT_COLS) {
    worksheet.getCell(`${col}${cultHeaderRow1}`).style = blueHeader
  }
  worksheet.getRow(cultHeaderRow1).height = 30

  currentRow++
  const cultHeaderRow2 = currentRow

  // Culture Table Headers Row 2
  worksheet.getCell(`G${cultHeaderRow2}`).value = "ผลลัพธ์การแสดงออกตามพฤติกรรมที่คาดหวัง \n(Result)"
  worksheet.mergeCells(`H${cultHeaderRow2}:J${cultHeaderRow2}`)
  worksheet.getCell(`H${cultHeaderRow2}`).value = "ระดับความสำเร็จ \n(Level of Achievement)"
  worksheet.getCell(`K${cultHeaderRow2}`).value = "คะแนน \n(Score)"
  worksheet.getCell(`L${cultHeaderRow2}`).value = "ผลลัพธ์การแสดงออกตามพฤติกรรมที่คาดหวัง \n(Result)"
  worksheet.mergeCells(`M${cultHeaderRow2}:O${cultHeaderRow2}`)
  worksheet.getCell(`M${cultHeaderRow2}`).value = "ระดับความสำเร็จ \n(Level of Achievement)"
  worksheet.getCell(`P${cultHeaderRow2}`).value = "คะแนน \n(Score)"

  for (const col of MERIT_EXPORT_COLS) {
    worksheet.getCell(`${col}${cultHeaderRow2}`).style = blueHeader
  }
  worksheet.getRow(cultHeaderRow2).height = 30

  currentRow++
  const cultHeaderRow3 = currentRow

  // Culture Table Headers Row 3 (Level sub-columns)
  worksheet.getCell(`H${cultHeaderRow3}`).value = LEVEL_SUB_HEADERS.employee
  worksheet.getCell(`I${cultHeaderRow3}`).value = LEVEL_SUB_HEADERS.evaluator1
  worksheet.getCell(`J${cultHeaderRow3}`).value = LEVEL_SUB_HEADERS.evaluator2
  worksheet.getCell(`M${cultHeaderRow3}`).value = LEVEL_SUB_HEADERS.employee
  worksheet.getCell(`N${cultHeaderRow3}`).value = LEVEL_SUB_HEADERS.evaluator1
  worksheet.getCell(`O${cultHeaderRow3}`).value = LEVEL_SUB_HEADERS.evaluator2

  for (const col of MERIT_EXPORT_COLS) {
    worksheet.getCell(`${col}${cultHeaderRow3}`).style = blueHeader
  }
  worksheet.getRow(cultHeaderRow3).height = 30

  // Merge header cells
  worksheet.mergeCells(`A${cultHeaderRow1}:A${cultHeaderRow3}`)
  worksheet.mergeCells(`B${cultHeaderRow1}:B${cultHeaderRow3}`)
  worksheet.mergeCells(`C${cultHeaderRow1}:C${cultHeaderRow3}`)
  worksheet.mergeCells(`D${cultHeaderRow1}:D${cultHeaderRow3}`)
  worksheet.mergeCells(`E${cultHeaderRow1}:F${cultHeaderRow3}`)
  worksheet.mergeCells(`G${cultHeaderRow2}:G${cultHeaderRow3}`)
  worksheet.mergeCells(`K${cultHeaderRow2}:K${cultHeaderRow3}`)
  worksheet.mergeCells(`L${cultHeaderRow2}:L${cultHeaderRow3}`)
  worksheet.mergeCells(`P${cultHeaderRow2}:P${cultHeaderRow3}`)

  currentRow++

  // Culture Data Rows
  for (let i = 0; i < meritForm.cultureRecords.length; i++) {
    const cult = meritForm.cultureRecords[i]
    worksheet.getCell(`A${currentRow}`).value = i + 1
    worksheet.getCell(`A${currentRow}`).alignment = { horizontal: "center", vertical: "middle" }
    worksheet.getCell(`A${currentRow}`).border = cellBorder
    worksheet.getCell(`A${currentRow}`).font = { size: 9 }

    worksheet.getCell(`B${currentRow}`).value = cult.culture.name
    worksheet.getCell(`B${currentRow}`).alignment = { vertical: "top", wrapText: true }
    worksheet.getCell(`B${currentRow}`).border = cellBorder
    worksheet.getCell(`B${currentRow}`).font = { size: 9 }

    worksheet.getCell(`C${currentRow}`).value = formatDecimal(30 / meritForm.cultureRecords.length)
    worksheet.getCell(`C${currentRow}`).alignment = { horizontal: "center", vertical: "middle" }
    worksheet.getCell(`C${currentRow}`).border = cellBorder
    worksheet.getCell(`C${currentRow}`).font = { size: 9 }

    worksheet.getCell(`D${currentRow}`).value = Array.isArray(cult.culture.belief)
      ? cult.culture.belief.map((item) => `- ${String(item)}`).join("\n")
      : ""
    worksheet.getCell(`D${currentRow}`).alignment = { vertical: "top", wrapText: true }
    worksheet.getCell(`D${currentRow}`).border = cellBorder
    worksheet.getCell(`D${currentRow}`).font = { size: 9 }

    worksheet.mergeCells(`E${currentRow}:F${currentRow}`)
    worksheet.getCell(`E${currentRow}`).value = cult.evidence
    worksheet.getCell(`E${currentRow}`).alignment = { vertical: "top", wrapText: true }
    worksheet.getCell(`E${currentRow}`).border = cellBorder
    worksheet.getCell(`E${currentRow}`).font = { size: 9 }

    const cultEva1st = cult.cultureEvaluations.find((f) => f.period === Period.EVALUATION_1ST)
    const cultEva2nd = cult.cultureEvaluations.find((f) => f.period === Period.EVALUATION_2ND)
    const cultWeight = 30 / meritForm.cultureRecords.length

    worksheet.getCell(`G${currentRow}`).value = cultEva1st?.actualApprover
    worksheet.getCell(`G${currentRow}`).alignment = { vertical: "top", wrapText: true }
    worksheet.getCell(`G${currentRow}`).border = cellBorder
    worksheet.getCell(`G${currentRow}`).font = { size: 9 }

    worksheet.getCell(`H${currentRow}`).value = cultEva1st?.levelBehaviorOwner ?? 0
    worksheet.getCell(`H${currentRow}`).alignment = { horizontal: "center", vertical: "middle" }
    worksheet.getCell(`H${currentRow}`).border = cellBorder
    worksheet.getCell(`H${currentRow}`).font = { size: 9 }

    worksheet.getCell(`I${currentRow}`).value = cultEva1st?.levelBehaviorChecker ?? 0
    worksheet.getCell(`I${currentRow}`).alignment = { horizontal: "center", vertical: "middle" }
    worksheet.getCell(`I${currentRow}`).border = cellBorder
    worksheet.getCell(`I${currentRow}`).font = { size: 9 }

    worksheet.getCell(`J${currentRow}`).value = cultEva1st?.levelBehaviorApprover ?? 0
    worksheet.getCell(`J${currentRow}`).alignment = { horizontal: "center", vertical: "middle" }
    worksheet.getCell(`J${currentRow}`).border = cellBorder
    worksheet.getCell(`J${currentRow}`).font = { size: 9 }

    worksheet.getCell(`K${currentRow}`).value = formatDecimal(((cultEva1st?.levelBehaviorApprover ?? 0) / 5) * cultWeight)
    worksheet.getCell(`K${currentRow}`).alignment = { horizontal: "center", vertical: "middle" }
    worksheet.getCell(`K${currentRow}`).border = cellBorder
    worksheet.getCell(`K${currentRow}`).font = { size: 9 }

    worksheet.getCell(`L${currentRow}`).value = cultEva2nd?.actualApprover
    worksheet.getCell(`L${currentRow}`).alignment = { vertical: "top", wrapText: true }
    worksheet.getCell(`L${currentRow}`).border = cellBorder
    worksheet.getCell(`L${currentRow}`).font = { size: 9 }

    worksheet.getCell(`M${currentRow}`).value = cultEva2nd?.levelBehaviorOwner ?? 0
    worksheet.getCell(`M${currentRow}`).alignment = { horizontal: "center", vertical: "middle" }
    worksheet.getCell(`M${currentRow}`).border = cellBorder
    worksheet.getCell(`M${currentRow}`).font = { size: 9 }

    worksheet.getCell(`N${currentRow}`).value = cultEva2nd?.levelBehaviorChecker ?? 0
    worksheet.getCell(`N${currentRow}`).alignment = { horizontal: "center", vertical: "middle" }
    worksheet.getCell(`N${currentRow}`).border = cellBorder
    worksheet.getCell(`N${currentRow}`).font = { size: 9 }

    worksheet.getCell(`O${currentRow}`).value = cultEva2nd?.levelBehaviorApprover ?? 0
    worksheet.getCell(`O${currentRow}`).alignment = { horizontal: "center", vertical: "middle" }
    worksheet.getCell(`O${currentRow}`).border = cellBorder
    worksheet.getCell(`O${currentRow}`).font = { size: 9 }

    worksheet.getCell(`P${currentRow}`).value = formatDecimal(((cultEva2nd?.levelBehaviorApprover ?? 0) / 5) * cultWeight)
    worksheet.getCell(`P${currentRow}`).alignment = { horizontal: "center", vertical: "middle" }
    worksheet.getCell(`P${currentRow}`).border = cellBorder
    worksheet.getCell(`P${currentRow}`).font = { size: 9 }

    worksheet.getRow(currentRow).height = 60
    currentRow++
  }

  // Culture Footer
  // แสดงผลรวม Weight ให้ตรงกับคอลัมน์ Weight (C)
  worksheet.mergeCells(`A${currentRow}:B${currentRow}`)
  worksheet.getCell(`A${currentRow}`).value = "รวม (คะแนนเต็ม) / Total (Full Score)"
  worksheet.getCell(`A${currentRow}`).alignment = { horizontal: "right", vertical: "middle" }
  worksheet.getCell(`A${currentRow}`).font = { size: 9, color: { argb: "FF1E40AF" } }
  worksheet.getCell(`A${currentRow}`).border = cellBorder
  worksheet.getCell(`A${currentRow}`).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF0F7FF" } }

  worksheet.getCell(`C${currentRow}`).value = 30
  worksheet.getCell(`C${currentRow}`).alignment = { horizontal: "center", vertical: "middle" }
  worksheet.getCell(`C${currentRow}`).font = { size: 9, color: { argb: "FF1E40AF" } }
  worksheet.getCell(`C${currentRow}`).border = cellBorder
  worksheet.getCell(`C${currentRow}`).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF0F7FF" } }

  worksheet.mergeCells(`E${currentRow}:F${currentRow}`)
  worksheet.mergeCells(`H${currentRow}:J${currentRow}`)
  worksheet.getCell(`H${currentRow}`).value = "คะแนนที่ได้ (Score Achieved)"
  worksheet.getCell(`H${currentRow}`).alignment = { horizontal: "center", vertical: "middle" }
  worksheet.getCell(`H${currentRow}`).font = { size: 9, color: { argb: "FF1E40AF" } }
  worksheet.getCell(`H${currentRow}`).border = cellBorder
  worksheet.getCell(`H${currentRow}`).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF0F7FF" } }

  worksheet.getCell(`K${currentRow}`).value = formatDecimal(sumCultureByPeriod(
    meritForm.cultureRecords,
    Period.EVALUATION_1ST,
    "levelBehaviorApprover"
  ))
  worksheet.getCell(`K${currentRow}`).alignment = { horizontal: "center", vertical: "middle" }
  worksheet.getCell(`K${currentRow}`).font = { size: 9, color: { argb: "FF1E40AF" } }
  worksheet.getCell(`K${currentRow}`).border = cellBorder
  worksheet.getCell(`K${currentRow}`).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF0F7FF" } }

  worksheet.mergeCells(`M${currentRow}:O${currentRow}`)
  worksheet.getCell(`M${currentRow}`).value = "คะแนนที่ได้ (Score Achieved)"
  worksheet.getCell(`M${currentRow}`).alignment = { horizontal: "center", vertical: "middle" }
  worksheet.getCell(`M${currentRow}`).font = { size: 9, color: { argb: "FF1E40AF" } }
  worksheet.getCell(`M${currentRow}`).border = cellBorder
  worksheet.getCell(`M${currentRow}`).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF0F7FF" } }

  worksheet.getCell(`P${currentRow}`).value = formatDecimal(sumCultureByPeriod(
    meritForm.cultureRecords,
    Period.EVALUATION_2ND,
    "levelBehaviorApprover"
  ))
  worksheet.getCell(`P${currentRow}`).alignment = { horizontal: "center", vertical: "middle" }
  worksheet.getCell(`P${currentRow}`).font = { size: 9, color: { argb: "FF1E40AF" } }
  worksheet.getCell(`P${currentRow}`).border = cellBorder
  worksheet.getCell(`P${currentRow}`).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF0F7FF" } }

  // เติมพื้นหลังและเส้นขอบให้ครบทุกคอลัมน์ในแถว footer
  for (const col of MERIT_EXPORT_COLS) {
    const cell = worksheet.getCell(`${col}${currentRow}`)
    cell.border = cellBorder
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF0F7FF" } }
  }

  currentRow += 2;

  // ========== OVERALL COMMENTS SECTION ==========
  const commentSectionTitleRow = currentRow
  worksheet.mergeCells(`A${commentSectionTitleRow}:${MERIT_EXPORT_LAST_COL}${commentSectionTitleRow}`)
  worksheet.getCell(`A${commentSectionTitleRow}`).value =
    "ข้อคิดเห็น/ข้อเสนอแนะภาพรวม (Overall Comments / Recommendations)"
  worksheet.getCell(`A${commentSectionTitleRow}`).font = { bold: true, color: { argb: "FF1E40AF" }, size: 12 }
  worksheet.getCell(`A${commentSectionTitleRow}`).alignment = { vertical: "middle" }
  for (const col of MERIT_EXPORT_COLS) {
    worksheet.getCell(`${col}${commentSectionTitleRow}`).border = cellBorder
  }
  currentRow++

  const midYearColGroups = splitMeritExportColumns(
    MERIT_COMMENT_MID_YEAR_COLS,
    hasChecker ? 3 : 2,
  )
  const yearEndColGroups = splitMeritExportColumns(
    MERIT_COMMENT_YEAR_END_COLS,
    hasChecker ? 3 : 2,
  )
  const commentGroupLabels = hasChecker
    ? [LEVEL_SUB_HEADERS.employee, LEVEL_SUB_HEADERS.evaluator1, LEVEL_SUB_HEADERS.evaluator2]
    : [LEVEL_SUB_HEADERS.employee, LEVEL_SUB_HEADERS.evaluator2]
  const getCommentValue = (
    comment: MeritOverallComment | null,
    index: number,
  ): string | null | undefined => {
    if (!comment) return null
    if (hasChecker) {
      return [comment.commentOwner, comment.commentChecker, comment.commentApprover][index]
    }
    return [comment.commentOwner, comment.commentApprover][index]
  }

  const mergeColsInRow = (cols: string[], row: number) => {
    if (cols.length > 1) {
      worksheet.mergeCells(`${cols[0]}${row}:${cols[cols.length - 1]}${row}`)
    }
  }

  const applyCommentGroupHeader = (cols: string[], row: number, label: string) => {
    mergeColsInRow(cols, row)
    const cell = worksheet.getCell(`${cols[0]}${row}`)
    cell.value = label
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true }
  }

  const commentHeaderRow1 = currentRow
  const midYearFirstCol = MERIT_COMMENT_MID_YEAR_COLS[0]
  const midYearLastCol = MERIT_COMMENT_MID_YEAR_COLS[MERIT_COMMENT_MID_YEAR_COLS.length - 1]
  const yearEndFirstCol = MERIT_COMMENT_YEAR_END_COLS[0]
  const yearEndLastCol = MERIT_COMMENT_YEAR_END_COLS[MERIT_COMMENT_YEAR_END_COLS.length - 1]

  worksheet.mergeCells(`${midYearFirstCol}${commentHeaderRow1}:${midYearLastCol}${commentHeaderRow1}`)
  worksheet.getCell(`${midYearFirstCol}${commentHeaderRow1}`).value =
    "การทบทวนผลการปฏิบัติงานกลางปี (JAN - JUN) \n(Mid-Year Review)"
  worksheet.mergeCells(`${yearEndFirstCol}${commentHeaderRow1}:${yearEndLastCol}${commentHeaderRow1}`)
  worksheet.getCell(`${yearEndFirstCol}${commentHeaderRow1}`).value =
    "การประเมินผลการปฏิบัติงานปลายปี (JUN - DEC) \n(End-Year Evaluation)"
  worksheet.getCell(`${midYearFirstCol}${commentHeaderRow1}`).alignment = {
    horizontal: "center",
    vertical: "middle",
    wrapText: true,
  }
  worksheet.getCell(`${yearEndFirstCol}${commentHeaderRow1}`).alignment = {
    horizontal: "center",
    vertical: "middle",
    wrapText: true,
  }
  for (const col of MERIT_EXPORT_COLS) {
    worksheet.getCell(`${col}${commentHeaderRow1}`).style = blueHeader
  }
  worksheet.getRow(commentHeaderRow1).height = 36
  currentRow++

  const commentHeaderRow2 = currentRow
  midYearColGroups.forEach((cols, index) => {
    applyCommentGroupHeader(cols, commentHeaderRow2, commentGroupLabels[index])
  })
  yearEndColGroups.forEach((cols, index) => {
    applyCommentGroupHeader(cols, commentHeaderRow2, commentGroupLabels[index])
  })
  for (const col of MERIT_EXPORT_COLS) {
    worksheet.getCell(`${col}${commentHeaderRow2}`).style = blueHeader
  }
  worksheet.getRow(commentHeaderRow2).height = 40
  currentRow++

  const commentDataRow = currentRow
  const writeCommentGroup = (cols: string[], value: string | null | undefined) => {
    mergeColsInRow(cols, commentDataRow)
    const cell = worksheet.getCell(`${cols[0]}${commentDataRow}`)
    cell.value = value ?? ""
    cell.alignment = { vertical: "top", wrapText: true }
    cell.border = cellBorder
    cell.font = { size: 9 }
  }

  midYearColGroups.forEach((cols, index) => {
    writeCommentGroup(cols, getCommentValue(commentMidYear, index))
  })
  yearEndColGroups.forEach((cols, index) => {
    writeCommentGroup(cols, getCommentValue(commentEndYear, index))
  })

  for (const col of MERIT_EXPORT_COLS) {
    worksheet.getCell(`${col}${commentDataRow}`).border = cellBorder
  }

  worksheet.getRow(commentDataRow).height = 100

  // Generate and download file
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `KPI_Merit_${meritForm.year}_${meritForm.employee.name}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}