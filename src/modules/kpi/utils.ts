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

export function kpiDefinitionMap(kpi: KpiDefinitionsMapping) {
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
    fileUrl: kpi.fileUrl,
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

  worksheet.columns = [
    { width: 5 }, // A - No.
    { width: 25 }, // B - Individual KPIs
    { width: 10 }, // C - Weight
    { width: 8 }, // D - Target Level
    { width: 30 }, // E - Target Value
    { width: 30 }, // F - Definition
    { width: 30 }, // G - Reporting Method
    { width: 25 }, // H - Achievement Evident
    { width: 15 }, // I - Achieved Level
    { width: 10 }, // J - Score
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

  worksheet.mergeCells("A2:I2");
  const subtitleCell = worksheet.getCell("A2");
  subtitleCell.value = "KPI Bonus";
  subtitleCell.font = { bold: true, color: { argb: "FF1E40AF" } };
  subtitleCell.alignment = { horizontal: "center", vertical: "middle" };

  // have 3 levels are Manager, GM/AGM และ MD/VP else "-"
  const managerCell = worksheet.getCell("J2");
  managerCell.value = getManagerLevelLabel(kpiForm.employee.rank as Rank);
  managerCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF2563EB" },
  };
  managerCell.font = { bold: true, color: { argb: "FFFFFFFF" } };
  managerCell.alignment = { horizontal: "center", vertical: "middle" };
  worksheet.getRow(2).height = 25;

  let currentRow = 4;

  // Header row for info Section
  worksheet.mergeCells(`A${currentRow}:B${currentRow}`);
  worksheet.getCell(`A${currentRow}`).value = "ผู้ได้รับการประเมิน (Owner)";
  worksheet.getCell(`A${currentRow}`).style = blueHeader;

  worksheet.mergeCells(`C${currentRow}:E${currentRow}`);
  worksheet.getCell(`C${currentRow}`).value = "ข้อมูล (Info)";
  worksheet.getCell(`C${currentRow}`).style = blueHeader;

  worksheet.mergeCells(`F${currentRow}:G${currentRow}`);
  worksheet.getCell(`F${currentRow}`).value = "ผู้ประเมิน (Approver)";
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
      evaluatorLabel: "ลำดับที่ 1 (Approver 1)",
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
      evaluatorLabel: "ลำดับที่ 2 (Approver 2)",
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
  worksheet.getCell(`H${headerRow1}`).value = "การประเมินผลการปฏิบัคิงานปลายปี (JAN - DEC) \n(End-Year Evaluation)"

  // Apply header styles
  for (const col of ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"]) {
    worksheet.getCell(`${col}${headerRow1}`).style = blueHeader
  }
  worksheet.getRow(headerRow1).height = 30;
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

  for (const col of ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"]) {
    worksheet.getCell(`${col}${headerRow2}`).style = blueHeader
  }
  worksheet.getRow(headerRow2).height = 25
  worksheet.getRow(headerRow2).font = { size: 9, color: { argb: "FF1E40AF" } }

  // Merge header cells that span two rows
  worksheet.mergeCells(`A${headerRow1}:A${headerRow2}`)
  worksheet.mergeCells(`B${headerRow1}:B${headerRow2}`)
  worksheet.mergeCells(`C${headerRow1}:C${headerRow2}`)
  worksheet.mergeCells(`F${headerRow1}:F${headerRow2}`)
  worksheet.mergeCells(`G${headerRow1}:G${headerRow2}`)

  currentRow++;

  const targetLevels = [70, 80, 90, 100] as const
  const levelDescriptions = {
    70: "(<70%)",
    80: "(≥70%-80%)",
    90: "(≥80%-90%)",
    100: "(≥90%)",
  }

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

    for (let levelIndex = 0; levelIndex < targetLevels.length; levelIndex++) {
      const level = targetLevels[levelIndex];

      if (levelIndex === 0) {
        // First row of each KPI - set values that will be merged
        worksheet.getCell(`A${currentRow}`).value = kpiIndex + 1
        worksheet.getCell(`A${currentRow}`).alignment = { horizontal: "center", vertical: "middle" }
        worksheet.getCell(`A${currentRow}`).border = cellBorder
        worksheet.getCell(`A${currentRow}`).font = { size: 9 }

        worksheet.getCell(`B${currentRow}`).value = kpi.name
        worksheet.getCell(`B${currentRow}`).alignment = { vertical: "top", wrapText: true }
        worksheet.getCell(`B${currentRow}`).border = cellBorder
        worksheet.getCell(`B${currentRow}`).font = { size: 9 }

        worksheet.getCell(`C${currentRow}`).value = Number(kpi.weight)
        worksheet.getCell(`C${currentRow}`).alignment = { horizontal: "center", vertical: "middle" }
        worksheet.getCell(`C${currentRow}`).border = cellBorder
        worksheet.getCell(`C${currentRow}`).font = { size: 9 }

        worksheet.getCell(`F${currentRow}`).value = kpi.definition
        worksheet.getCell(`F${currentRow}`).alignment = { vertical: "top", wrapText: true }
        worksheet.getCell(`F${currentRow}`).border = cellBorder
        worksheet.getCell(`F${currentRow}`).font = { size: 9 }

        worksheet.getCell(`G${currentRow}`).value = kpi.method
        worksheet.getCell(`G${currentRow}`).alignment = { vertical: "top", wrapText: true }
        worksheet.getCell(`G${currentRow}`).border = cellBorder
        worksheet.getCell(`G${currentRow}`).font = { size: 9 }

        worksheet.getCell(`H${currentRow}`).value = kpi.achievementApprover
        worksheet.getCell(`H${currentRow}`).alignment = { vertical: "top", wrapText: true }
        worksheet.getCell(`H${currentRow}`).border = cellBorder
        worksheet.getCell(`H${currentRow}`).font = { size: 9 }

        worksheet.getCell(`J${currentRow}`).value = 0;
        worksheet.getCell(`J${currentRow}`).alignment = { horizontal: "center", vertical: "middle" }
        worksheet.getCell(`J${currentRow}`).border = cellBorder
        worksheet.getCell(`J${currentRow}`).font = { size: 9 }
      }

      // Target level column
      worksheet.getCell(`D${currentRow}`).value = `${level}%`
      worksheet.getCell(`D${currentRow}`).alignment = { horizontal: "center", vertical: "middle" }
      worksheet.getCell(`D${currentRow}`).border = cellBorder
      worksheet.getCell(`D${currentRow}`).font = { size: 9 }

      // Target value column
      worksheet.getCell(`E${currentRow}`).value = getTargetValue(kpi, level)
      worksheet.getCell(`E${currentRow}`).border = cellBorder
      worksheet.getCell(`E${currentRow}`).font = { size: 9 }

      // Achieved level column (checkbox representation)
      const isChecked = kpi.achievementApprover === level;
      worksheet.getCell(`I${currentRow}`).value = `${isChecked ? "☑" : "☐"} ${level} ${levelDescriptions[level]}`
      worksheet.getCell(`I${currentRow}`).alignment = { horizontal: "left", vertical: "middle" }
      worksheet.getCell(`I${currentRow}`).border = cellBorder
      worksheet.getCell(`I${currentRow}`).font = { size: 8 }

      if (levelIndex > 0) {
        // Set borders for merged cells on subsequent rows
        for (const col of ["A", "B", "C", "F", "G", "H", "J"]) {
          worksheet.getCell(`${col}${currentRow}`).border = cellBorder
        }
      }

      currentRow++
    }

    // Merge cells for columns that span all 4 target levels
    const endRow = currentRow - 1
    worksheet.mergeCells(`A${startRow}:A${endRow}`)
    worksheet.mergeCells(`B${startRow}:B${endRow}`)
    worksheet.mergeCells(`C${startRow}:C${endRow}`)
    worksheet.mergeCells(`F${startRow}:F${endRow}`)
    worksheet.mergeCells(`G${startRow}:G${endRow}`)
    worksheet.mergeCells(`H${startRow}:H${endRow}`)
    worksheet.mergeCells(`J${startRow}:J${endRow}`)
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
