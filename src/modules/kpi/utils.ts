import ExcelJS from "exceljs";

import { z } from "zod";

import { KpiCategory, Period } from "@/generated/prisma/enums";
import { chiefDown, managerUp, Rank } from "@/types/employees";

import { kpiUploadSchema } from "@/modules/kpi/schema/upload";
import { KpiDefinitionsMapping } from "./schema/definition";
import { kpiEvaluationSchema } from "./schema/evaluation";
import { PERIOD_LABELS } from "../tasks/constant";
import { Employee, Form, KpiEvaluation, Task } from "@/generated/prisma/client";
import { formatDecimal } from "@/lib/utils";
import { kpiCategoies } from "./constants";
import { RANK_LABELS } from "@/constants";

export function kpiDefinitionMap(kpi: KpiDefinitionsMapping) {
  const weightStr = kpi.weight == null ? "0" : String(kpi.weight);

  return {
    id: kpi.id,
    year: kpi.year,
    name: kpi.name ?? "",
    weight: Number.isNaN(Number(weightStr)) ? 0 : Number(weightStr),
    category: kpi.category ?? KpiCategory.CS1,
    objective: kpi.objective ?? "",
    definition: kpi.definition ?? "",
    strategy: kpi.strategy ?? "",
    method: kpi.method ?? "",
    type: kpi.type,
    target60: kpi.target60,
    target70: kpi.target70,
    target80: kpi.target80,
    target90: kpi.target90,
    target100: kpi.target100,
  };
}

export function kpiEvaluationMap(kpi: z.infer<typeof kpiEvaluationSchema>) {
  return {
    id: kpi.id,
    role: kpi.role,
    actualOwner: kpi.actualOwner,
    achievementOwner: kpi.achievementOwner,
    actualChecker: kpi.actualChecker,
    achievementChecker: kpi.achievementChecker,
    actualApprover: kpi.actualApprover,
    achievementApprover: kpi.achievementApprover,
    fileUrl: kpi.fileUrl ?? null,
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

const KPI_EXPORT_COLS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"] as const;
type KpiExportCol = (typeof KPI_EXPORT_COLS)[number];

const KPI_EXPORT_COLUMN_WIDTHS: Record<KpiExportCol, number> = {
  A: 5,
  B: 25,
  C: 10,
  D: 8,
  E: 30,
  F: 30,
  G: 30,
  H: 25,
  I: 15,
  J: 10,
};

const KPI_EXPORT_CELL_PADDING_X_CHARS = 0;
const KPI_EXPORT_CELL_PADDING_Y_PX = 3;
const KPI_EXPORT_PX_TO_PT = 72 / 96;
const KPI_EXPORT_CELL_PADDING_X_INDENT = 0;
const KPI_EXPORT_CELL_PADDING_Y_PT =
  KPI_EXPORT_CELL_PADDING_Y_PX * 2 * KPI_EXPORT_PX_TO_PT;

type KpiExportBodyCellVariant = "wrap" | "center";

const kpiExportBodyAlignmentWrap: Partial<ExcelJS.Alignment> = {
  vertical: "top",
  horizontal: "left",
  wrapText: true,
  indent: KPI_EXPORT_CELL_PADDING_X_INDENT,
};

const kpiExportBodyAlignmentCenter: Partial<ExcelJS.Alignment> = {
  vertical: "middle",
  horizontal: "center",
};

type KpiExportCellBorder = {
  top: { style: "thin"; color: { argb: string } };
  left: { style: "thin"; color: { argb: string } };
  bottom: { style: "thin"; color: { argb: string } };
  right: { style: "thin"; color: { argb: string } };
};

function kpiExportBodyCellValue(
  value: string | number | null | undefined,
  variant: KpiExportBodyCellVariant,
): string | number {
  if (value == null || value === "") return "";

  if (variant === "center") {
    return typeof value === "number" ? value : String(value);
  }

  if (typeof value === "number") return value;

  return String(value);
}

function setKpiExportBodyCell(
  cell: ExcelJS.Cell,
  value: string | number | null | undefined,
  variant: KpiExportBodyCellVariant,
  border: KpiExportCellBorder,
  fontSize = 9,
) {
  cell.value = kpiExportBodyCellValue(value, variant);
  cell.alignment =
    variant === "wrap" ? kpiExportBodyAlignmentWrap : kpiExportBodyAlignmentCenter;
  cell.border = border;
  cell.font = { size: fontSize };
}

function getKpiExportColumnWidthChars(col: KpiExportCol): number {
  return KPI_EXPORT_COLUMN_WIDTHS[col];
}

function kpiExportTextWidthUnits(text: string): number {
  return [...text].reduce(
    (sum, ch) => sum + (ch.charCodeAt(0) > 255 ? 1 : 0.6),
    0,
  );
}

function countKpiExportWrappedLines(
  text: string | null | undefined,
  columnWidthChars: number,
): number {
  if (!text?.trim()) return 1;

  const usableWidth = Math.max(
    1,
    columnWidthChars - KPI_EXPORT_CELL_PADDING_X_CHARS * 2,
  );

  return String(text)
    .split(/\r?\n/)
    .reduce((total, paragraph) => {
      const units = kpiExportTextWidthUnits(paragraph);
      return total + Math.max(1, Math.ceil(units / usableWidth));
    }, 0);
}

function kpiExportLineHeightPt(fontSize: number): number {
  return fontSize * (4 / 3);
}

function calcKpiExportRowHeight(
  cells: Array<{ text: string | number | null | undefined; widthChars: number }>,
  fontSize = 9,
  minHeight = 15,
): number {
  const lineHeight = kpiExportLineHeightPt(fontSize);
  let maxLines = 1;

  for (const { text, widthChars } of cells) {
    const content = text == null ? "" : String(text);
    maxLines = Math.max(maxLines, countKpiExportWrappedLines(content, widthChars));
  }

  return Math.max(minHeight, maxLines * lineHeight + KPI_EXPORT_CELL_PADDING_Y_PT);
}

type KpiExportRowHeightCell =
  | { text: string | number | null | undefined; col: KpiExportCol }
  | { text: string | number | null | undefined; cols: readonly string[] };

function setKpiExportRowHeight(
  worksheet: ExcelJS.Worksheet,
  row: number,
  cells: KpiExportRowHeightCell[],
  options?: { fontSize?: number; minHeight?: number },
) {
  worksheet.getRow(row).height = calcKpiExportRowHeight(
    resolveKpiExportRowHeightCells(cells),
    options?.fontSize ?? 9,
    options?.minHeight,
  );
}

function resolveKpiExportRowHeightCells(cells: KpiExportRowHeightCell[]) {
  return cells.map((cell) => {
    if ("cols" in cell) {
      const widthChars = cell.cols.reduce(
        (sum, col) => sum + getKpiExportColumnWidthChars(col as KpiExportCol),
        0,
      );
      return { text: cell.text, widthChars };
    }

    return {
      text: cell.text,
      widthChars: getKpiExportColumnWidthChars(cell.col),
    };
  });
}

function setKpiExportMergedBlockRowHeights(
  worksheet: ExcelJS.Worksheet,
  startRow: number,
  endRow: number,
  mergedCells: KpiExportRowHeightCell[],
  perRowCells: KpiExportRowHeightCell[][] = [],
  options?: { fontSize?: number; minHeight?: number },
) {
  const fontSize = options?.fontSize ?? 9;
  const minHeight = options?.minHeight ?? 22;

  const mergedHeight = calcKpiExportRowHeight(
    resolveKpiExportRowHeightCells(mergedCells),
    fontSize,
    minHeight,
  );

  const stackedHeight = perRowCells.reduce(
    (sum, rowCells) =>
      sum +
      calcKpiExportRowHeight(
        resolveKpiExportRowHeightCells(rowCells),
        fontSize,
        16,
      ),
    0,
  );

  const totalHeight = Math.max(mergedHeight, stackedHeight);
  const rowCount = endRow - startRow + 1;
  const perRowHeight = Math.max(16, totalHeight / rowCount);

  for (let row = startRow; row <= endRow; row++) {
    worksheet.getRow(row).height = perRowHeight;
  }
}

export function isBlankRow(row: Record<string, any>): boolean {
  const requiredFields = ["name", "category", "definition", "method"];

  return requiredFields.every((field) => {
    const value = String(row[field] || "").trim();
    return !value;
  });
}

export function validateKpiUpload(sheet: Array<Record<string, any>>) {
  const errors: Array<{ row: number; errors: z.ZodError }> = [];
  const validKpis: Array<z.infer<typeof kpiUploadSchema>> = [];

  sheet.forEach((row, index) => {
    const rowNumber = (row._rowIndex as number) || index + 2;

    if (isBlankRow(row)) {
      return;
    }

    try {
      const validatedData = kpiUploadSchema.parse(row);
      validKpis.push(validatedData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        errors.push({ row: rowNumber, errors: error });
      }
    }
  });

  return { errors, validKpis };
}

export function formatValidationErrors(
  errors: Array<{ row: number; errors: z.ZodError }>,
) {
  return errors.map(({ row, errors: zodErrors }) => {
    const fieldErrors = zodErrors.issues
      .map((err) => {
        const field = err.path.join(".");
        return `${field}: ${err.message}`;
      })
      .join(", ");

    return {
      row,
      message: fieldErrors,
    };
  });
}

export function calculateSumAchievement(
  achievements: number[],
  weights: number[],
) {
  return achievements.reduce(
    (acc, achievement, index) => acc + (achievement / 100) * weights[index],
    0,
  );
}

export function formatKpiExport(
  kpiForm: Form & { kpis: KpiEvaluation[]; employee: Employee },
) {
  const inDraft = kpiForm.kpis.map((kpi) => ({
    employeeId: kpiForm.employee.id,
    employeeName: kpiForm.employee.name,
    year: kpiForm.year,
    period: PERIOD_LABELS[Period.IN_DRAFT],
    performer: "Approver",
    name: kpi.name,
    percentage: formatDecimal(Number(kpi.weight)),
  }));

  const createEvaluationData = () =>
    kpiForm.kpis.flatMap((kpi) => {
      const base = {
        employeeId: kpiForm.employee.id,
        employeeName: kpiForm.employee.name,
        period: "Evaluation",
        year: kpiForm.year,
        owner: kpi.actualOwner,
        checker: kpi.actualChecker,
        approver: kpi.actualApprover,
        name: kpi.name,
      };

      const performers = [
        { performer: "Owner", score: kpi.achievementOwner },
        { performer: "Checker", score: kpi.achievementChecker },
        { performer: "Approver", score: kpi.achievementApprover },
      ];

      return performers.map((p) => ({
        ...base,
        performer: p.performer,
        percentage: formatDecimal((Number(kpi.weight) * (p.score || 0)) / 100),
      }));
    });

  const performerOrder = ["Owner", "Checker", "Approver"];

  const sortByPerformer = (data: Array<{ performer: string }>) =>
    performerOrder.flatMap((role) => data.filter((d) => d.performer === role));

  const sortedEvaluate = sortByPerformer(createEvaluationData());

  return [...inDraft, ...sortedEvaluate];
}

export async function exportDefinitionKpi(
  kpiForm: Form & { 
    kpis: KpiEvaluation[]; 
    employee: Employee;
    task: Task & {
      checker?: Employee;
      approver: Employee;
    } 
  },
) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("KPI Bonus");

  worksheet.columns = KPI_EXPORT_COLS.map((col) => ({
    width: KPI_EXPORT_COLUMN_WIDTHS[col],
  }));

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
    top: { style: "thin" as const, color: { argb: "FF93C5FD" }, },
    left: { style: "thin" as const, color: { argb: "FF93C5FD" } },
    bottom: { style: "thin" as const, color: { argb: "FF93C5FD" } },
    right: { style: "thin" as const, color: { argb: "FF93C5FD" } },
  };

  // Title
  worksheet.mergeCells("A1:J1");
  const titleCell = worksheet.getCell("A1");
  titleCell.value = `แบบประเมินผลการปฏิบัติงาน ประจำปี ${kpiForm.year}`;
  titleCell.font = {
    bold: true,
    size: 16,
    color: {
      argb: "FF1E40AF",
    },
  };

  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  worksheet.getRow(1).height = 30;

  worksheet.mergeCells("A2:J2");
  const subtitleCell = worksheet.getCell("A2");
  subtitleCell.value = "KPI Bonus";
  subtitleCell.font = { bold: true, color: { argb: "FF1E40AF" } };
  subtitleCell.alignment = { horizontal: "center", vertical: "middle" };

  // have 3 levels are Manager, GM/AGM และ MD/VP else "-"
  const managerCell = worksheet.getCell("J3");
  managerCell.value = RANK_LABELS[kpiForm.employee.rank as Rank];
  managerCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF2563EB" },
  };
  managerCell.font = { bold: true, color: { argb: "FFFFFFFF" } };
  managerCell.alignment = { horizontal: "center", vertical: "middle" };
  worksheet.getRow(2).height = 32;
  worksheet.getRow(3).height = 32;

  let currentRow = 4;

  // Header row for info Section
  worksheet.mergeCells(`A${currentRow}:B${currentRow}`);
  worksheet.getCell(`A${currentRow}`).value = "พนักงาน (Employee)";
  worksheet.getCell(`A${currentRow}`).style = blueHeader;

  worksheet.mergeCells(`C${currentRow}:E${currentRow}`);
  worksheet.getCell(`C${currentRow}`).value = "ข้อมูล (Info)";
  worksheet.getCell(`C${currentRow}`).style = blueHeader;

  worksheet.mergeCells(`F${currentRow}:G${currentRow}`);
  worksheet.getCell(`F${currentRow}`).value = "ผู้ประเมิน (Evaluator)";
  worksheet.getCell(`F${currentRow}`).style = blueHeader;

  worksheet.mergeCells(`H${currentRow}:J${currentRow}`);
  worksheet.getCell(`H${currentRow}`).value = "ข้อมูล (Info)";
  worksheet.getCell(`H${currentRow}`).style = blueHeader;

  // ให้เส้นขอบหัวตาราง Owner/Info/Approver/Info แสดงครบทุกคอลัมน์
  for (const col of ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"]) {
    worksheet.getCell(`${col}${currentRow}`).border = cellBorder
  }

  currentRow++;

  const infoRows = [
    {
      label: "ชื่อ-สกุล (Name-Surname)",
      evalueeValue: kpiForm.employee.name,
      evaluatorLabel: "ผู้ประเมินลำดับที่ 1 (Evaluator #1)",
      evaluatorValue: kpiForm.task.checker?.name,
    },
    {
      label: "แผนก (Department)",
      evalueeValue: kpiForm.employee.department,
      evaluatorLabel: "ตำแหน่ง (Position)",
      evaluatorValue: kpiForm.task.checker?.position,
    },
    {
      label: "รหัส (Emp ID)",
      evalueeValue: kpiForm.employee.id,
      evaluatorLabel: "ผู้ประเมินลำดับที่ 2 (Evaluator #2)",
      evaluatorValue: kpiForm.task.approver.name,
    },
    {
      label: "ตำแหน่ง (Position)",
      evalueeValue: kpiForm.employee.position,
      evaluatorLabel: "ตำแหน่ง (Position)",
      evaluatorValue: kpiForm.task.approver.position,
    },
    {
      label: "ระดับ (Level)",
      evalueeValue: kpiForm.employee.rank,
      evaluatorLabel: "",
      evaluatorValue: "",
    },
    {
      label: "บริษัท (Company)",
      evalueeValue: kpiForm.employee.division,
      evaluatorLabel: "",
      evaluatorValue: "",
    },
  ];

  for (const info of infoRows) {
    worksheet.mergeCells(`A${currentRow}:B${currentRow}`)
    worksheet.getCell(`A${currentRow}`).value = info.label
    worksheet.getCell(`A${currentRow}`).border = cellBorder
    worksheet.getCell(`A${currentRow}`).font = { size: 9, color: { argb: "FF1E40AF" } }

    worksheet.mergeCells(`C${currentRow}:E${currentRow}`)
    worksheet.getCell(`C${currentRow}`).value = info.evalueeValue
    worksheet.getCell(`C${currentRow}`).border = cellBorder
    worksheet.getCell(`C${currentRow}`).font = { size: 9 }

    worksheet.mergeCells(`F${currentRow}:G${currentRow}`)
    worksheet.getCell(`F${currentRow}`).value = info.evaluatorLabel
    worksheet.getCell(`F${currentRow}`).border = cellBorder
    worksheet.getCell(`F${currentRow}`).font = { size: 9, color: { argb: "FF1E40AF" } }

    worksheet.mergeCells(`H${currentRow}:J${currentRow}`)
    worksheet.getCell(`H${currentRow}`).value = info.evaluatorValue
    worksheet.getCell(`H${currentRow}`).border = cellBorder
    worksheet.getCell(`H${currentRow}`).font = { size: 9 }

    // ให้เส้นขอบต่อเนื่องครบทุกคอลัมน์ในแถวข้อมูล
    for (const col of ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"]) {
      worksheet.getCell(`${col}${currentRow}`).border = cellBorder
    }

    currentRow++
  }

  currentRow++;

  const headerRow1 = currentRow
  worksheet.getCell(`A${headerRow1}`).value = "ที่ \n(No.)"
  worksheet.getCell(`B${headerRow1}`).value = "ตัวชี้วัด \n(Individual KPIs)"
  worksheet.getCell(`C${headerRow1}`).value = "น้ำหนัก \n(Weight)"
  worksheet.getCell(`D${headerRow1}`).value = "เป้าหมาย \n(Target)"
  worksheet.getCell(`F${headerRow1}`).value = "คำจำกัดความและสูตรการคำนวณ \n(Definition and Calculation Formula)"
  worksheet.getCell(`G${headerRow1}`).value = "รูปแบบและวิธีการรายงานผลความสำเร็จ \n(Format/Method of Reporting Achievement)"
  worksheet.mergeCells(`H${headerRow1}:J${headerRow1}`)
  worksheet.getCell(`H${headerRow1}`).value = "การประเมินผลการปฏิบัคิงานปลายปี (JAN - DEC) \n(Year-End Evaluation)"

  // Apply header styles
  for (const col of KPI_EXPORT_COLS) {
    worksheet.getCell(`${col}${headerRow1}`).style = blueHeader
  }
  setKpiExportRowHeight(worksheet, headerRow1, [
    { text: worksheet.getCell(`A${headerRow1}`).value as string, col: "A" },
    { text: worksheet.getCell(`B${headerRow1}`).value as string, col: "B" },
    { text: worksheet.getCell(`C${headerRow1}`).value as string, col: "C" },
    { text: worksheet.getCell(`D${headerRow1}`).value as string, cols: ["D", "E"] },
    { text: worksheet.getCell(`F${headerRow1}`).value as string, col: "F" },
    { text: worksheet.getCell(`G${headerRow1}`).value as string, col: "G" },
    { text: worksheet.getCell(`H${headerRow1}`).value as string, cols: ["H", "I", "J"] },
  ], { minHeight: 24 })
  worksheet.getRow(headerRow1).font = { size: 9, color: { argb: "FF1E40AF" } }


  currentRow++;
  const headerRow2 = currentRow;

  worksheet.getCell(`A${headerRow2}`).value = ""
  worksheet.getCell(`B${headerRow2}`).value = ""
  worksheet.getCell(`C${headerRow2}`).value = ""
  worksheet.getCell(`D${headerRow2}`).value = ""
  worksheet.getCell(`E${headerRow2}`).value = ""
  worksheet.getCell(`F${headerRow2}`).value = ""
  worksheet.getCell(`G${headerRow2}`).value = ""
  worksheet.getCell(`H${headerRow2}`).value = "ข้อมูล/หลักฐาน การประเมิน \n(Achievement Evident)"
  worksheet.getCell(`I${headerRow2}`).value = "ระดับความสำเร็จ \n(Achieved Level)"
  worksheet.getCell(`J${headerRow2}`).value = "คะแนน \n(Score)"

  // Merge เป้าหมาย (Target) ให้เป็นบล็อกเดียวครอบ D:E ทั้งสองแถว
  worksheet.mergeCells(`D${headerRow1}:E${headerRow2}`)

  for (const col of KPI_EXPORT_COLS) {
    worksheet.getCell(`${col}${headerRow2}`).style = blueHeader
  }
  setKpiExportRowHeight(worksheet, headerRow2, [
    { text: worksheet.getCell(`H${headerRow2}`).value as string, col: "H" },
    { text: worksheet.getCell(`I${headerRow2}`).value as string, col: "I" },
    { text: worksheet.getCell(`J${headerRow2}`).value as string, col: "J" },
  ], { minHeight: 22 })
  worksheet.getRow(headerRow2).font = { size: 9, color: { argb: "FF1E40AF" } }

  // Merge header cells that span two rows
  worksheet.mergeCells(`A${headerRow1}:A${headerRow2}`)
  worksheet.mergeCells(`B${headerRow1}:B${headerRow2}`)
  worksheet.mergeCells(`C${headerRow1}:C${headerRow2}`)
  worksheet.mergeCells(`F${headerRow1}:F${headerRow2}`)
  worksheet.mergeCells(`G${headerRow1}:G${headerRow2}`)

  currentRow++;

  const targetLevels = [70, 80, 90, 100] as const

  // Helper function to get target value from level
  const getTargetValue = (kpi: KpiEvaluation, level: typeof targetLevels[number]): string | null => {
    switch (level) {
      case 70:
        return kpi.target70
      case 80:
        return kpi.target80
      case 90:
        return kpi.target90
      case 100:
        return kpi.target100
      default:
        return null
    }
  }

  for (let kpiIndex = 0; kpiIndex < kpiForm.kpis.length; kpiIndex++) {
    const kpi = kpiForm.kpis[kpiIndex]
    const startRow = currentRow
    const kpiTitle = `${kpi.name} \n${kpiCategoies[kpi.category!] ?? ""}`

    for (let levelIndex = 0; levelIndex < targetLevels.length; levelIndex++) {
      const level = targetLevels[levelIndex];

      if (levelIndex === 0) {
        setKpiExportBodyCell(worksheet.getCell(`A${currentRow}`), kpiIndex + 1, "center", cellBorder)
        setKpiExportBodyCell(worksheet.getCell(`B${currentRow}`), kpiTitle, "wrap", cellBorder)
        setKpiExportBodyCell(worksheet.getCell(`C${currentRow}`), Number(kpi.weight), "center", cellBorder)
        setKpiExportBodyCell(worksheet.getCell(`F${currentRow}`), kpi.definition, "wrap", cellBorder)
        setKpiExportBodyCell(worksheet.getCell(`G${currentRow}`), kpi.method, "wrap", cellBorder)
        setKpiExportBodyCell(worksheet.getCell(`H${currentRow}`), kpi.achievementApprover, "wrap", cellBorder)
        setKpiExportBodyCell(worksheet.getCell(`J${currentRow}`), 0, "center", cellBorder)
      }

      setKpiExportBodyCell(worksheet.getCell(`D${currentRow}`), `${level}%`, "center", cellBorder)
      setKpiExportBodyCell(worksheet.getCell(`E${currentRow}`), getTargetValue(kpi, level), "wrap", cellBorder)
      setKpiExportBodyCell(
        worksheet.getCell(`I${currentRow}`),
        `${level}%`,
        "center",
        cellBorder,
        8,
      )

      if (levelIndex > 0) {
        for (const col of ["A", "B", "C", "F", "G", "H", "J"] as const) {
          worksheet.getCell(`${col}${currentRow}`).border = cellBorder
        }
      }

      currentRow++
    }

    const endRow = currentRow - 1
    worksheet.mergeCells(`A${startRow}:A${endRow}`)
    worksheet.mergeCells(`B${startRow}:B${endRow}`)
    worksheet.mergeCells(`C${startRow}:C${endRow}`)
    worksheet.mergeCells(`F${startRow}:F${endRow}`)
    worksheet.mergeCells(`G${startRow}:G${endRow}`)
    worksheet.mergeCells(`H${startRow}:H${endRow}`)
    worksheet.mergeCells(`J${startRow}:J${endRow}`)

    setKpiExportMergedBlockRowHeights(
      worksheet,
      startRow,
      endRow,
      [
        { text: kpiTitle, col: "B" },
        { text: kpi.definition, col: "F" },
        { text: kpi.method, col: "G" },
        { text: kpi.achievementApprover, col: "H" },
      ],
      targetLevels.map((level) => [{ text: getTargetValue(kpi, level), col: "E" }]),
      { minHeight: 22 },
    )
  }

  // Calculate total score from achievementApprover and weights
  const totalScore = calculateSumAchievement(
    kpiForm.kpis.map((kpi) => kpi.achievementApprover ?? 0),
    kpiForm.kpis.map((kpi) => Number(kpi.weight))
  )

  // Footer row
  worksheet.mergeCells(`A${currentRow}:B${currentRow}`)
  worksheet.getCell(`A${currentRow}`).value = "รวม (คะแนนเต็ม) / Total (Full Score)"
  worksheet.getCell(`A${currentRow}`).alignment = { horizontal: "right", vertical: "middle" }
  worksheet.getCell(`A${currentRow}`).font = { size: 9, color: { argb: "FF1E40AF" } }
  worksheet.getCell(`A${currentRow}`).border = cellBorder
  worksheet.getCell(`A${currentRow}`).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF0F7FF" } }

  // find sum weight
  worksheet.getCell(`C${currentRow}`).value = kpiForm.kpis.reduce((acc, kpi) => acc + Number(kpi.weight), 0)
  worksheet.getCell(`C${currentRow}`).alignment = { horizontal: "center", vertical: "middle" }
  worksheet.getCell(`C${currentRow}`).font = { size: 9, color: { argb: "FF1E40AF" } }
  worksheet.getCell(`C${currentRow}`).border = cellBorder
  worksheet.getCell(`C${currentRow}`).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF0F7FF" } }


  for (const col of ["D", "E", "F", "G", "I"]) {
    const cell = worksheet.getCell(`${col}${currentRow}`)
    cell.border = cellBorder
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF0F7FF" } }
  }

  worksheet.mergeCells(`H${currentRow}:J${currentRow}`)
  worksheet.getCell(`H${currentRow}`).value = `คะแนนที่ได้ (Score achieved): ${formatDecimal(totalScore)}`
  worksheet.getCell(`H${currentRow}`).alignment = { horizontal: "right", vertical: "middle" }
  worksheet.getCell(`H${currentRow}`).font = { size: 9, color: { argb: "FF1E40AF" } }
  worksheet.getCell(`H${currentRow}`).border = cellBorder
  worksheet.getCell(`H${currentRow}`).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF0F7FF" } }

  // Generate and download file
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `KPI_Bonus_${kpiForm.year}_${kpiForm.employee.name}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
