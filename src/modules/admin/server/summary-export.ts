import ExcelJS from "exceljs";
import { FormType, type KpiCategory, Period } from "@/generated/prisma/enums";
import db from "@/lib/db";
import { kpiCategoies } from "@/modules/kpi/constants";
import {
  sumCompetencyByPeriod,
  sumCultureByPeriod,
  validateWeight,
} from "@/modules/merit/utils";
import type { Rank } from "@/types/employees";

const YEAR_END = Period.EVALUATION_2ND;
const MID_YEAR = Period.EVALUATION_1ST;
const CULTURE_ORDER = ["S", "M", "A", "R", "T"];
const PERIOD_FILL = "FFFFE598";

const TITLE_FILL = "FF4A4A4A";
const HEADER_FILL = "FFE7E6E6";
const EMPLOYEE_FILL = "FFF4CCCC";
const EVALUATOR1_FILL = "FFFFF2CC";
const TOTAL_FILL = "FFC6EFCE";
const WHITE = "FFFFFFFF";
const INK = "FF1F1F1F";
const LINE = "FFB7B7B7";

const thin = { style: "thin" as const, color: { argb: LINE } };
const border: Partial<ExcelJS.Borders> = {
  top: thin,
  left: thin,
  bottom: thin,
  right: thin,
};

type Score = number | null;

const KPI_TARGETS = [
  { level: 70, key: "target70" },
  { level: 80, key: "target80" },
  { level: 90, key: "target90" },
  { level: 100, key: "target100" },
] as const;

type BonusSettingGroup = {
  id: string;
  name: string;
  position: string;
  rank: string;
  division: string;
  department: string;
  year: number;
  kpi: string;
  strategy: string;
  weight: Score;
  success: Score;
  targets: { label: string; detail: string }[];
};

type BonusDetailRow = {
  id: string;
  name: string;
  position: string;
  rank: string;
  division: string;
  department: string;
  kpi: string;
  strategy: string;
  weight: Score;
  result: string;
  employee: Score;
  evaluator1: Score;
  evaluator2: Score;
};

type BonusRow = {
  id: string;
  name: string;
  position: string;
  rank: string;
  division: string;
  department: string;
  weight: Score;
  employee: Score;
  evaluator1: Score;
  evaluator2: Score;
  grandTotal: Score;
};

type MeritPeriodScore = {
  result: string;
  employee: Score;
  evaluator1: Score;
  evaluator2: Score;
};

type MeritDetailRow = {
  id: string;
  name: string;
  position: string;
  rank: string;
  division: string;
  department: string;
  year: number;
  type: string;
  behavior: string;
  example: string;
  first: MeritPeriodScore;
  second: MeritPeriodScore;
};

type MeritRow = {
  id: string;
  name: string;
  position: string;
  rank: string;
  division: string;
  department: string;
  ownerKpi: Score;
  ownerCompetency: Score;
  ownerCulture: Score;
  ownerTotal: Score;
  checkerKpi: Score;
  checkerCompetency: Score;
  checkerCulture: Score;
  checkerTotal: Score;
  approverKpi: Score;
  approverCompetency: Score;
  approverCulture: Score;
  approverTotal: Score;
};

type KpiScoreSource = {
  weight: unknown;
  achievementOwner: number | null;
  achievementChecker: number | null;
  achievementApprover: number | null;
};

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

function buddhistYear(year: number) {
  return year + 543;
}

function weightedScore(
  kpis: KpiScoreSource[],
  key: "achievementOwner" | "achievementChecker" | "achievementApprover",
): Score {
  if (kpis.length === 0 || kpis.every((kpi) => kpi[key] == null)) return null;
  const total = kpis.reduce((sum, kpi) => {
    const weight = Number(kpi.weight ?? 0);
    return sum + ((kpi[key] ?? 0) / 100) * weight;
  }, 0);
  return round2(total);
}

function meritKpiScore(
  kpis: KpiScoreSource[],
  rank: string,
  key: "achievementOwner" | "achievementChecker" | "achievementApprover",
): Score {
  const weighted = weightedScore(kpis, key);
  if (weighted == null) return null;
  const portion = validateWeight(rank as Rank);
  if (portion <= 0) return null;
  return round2(Math.min(40, (weighted * 40) / portion));
}

function totalOf(parts: Score[]): Score {
  if (parts.every((part) => part == null)) return null;
  return round2(parts.reduce<number>((sum, part) => sum + (part ?? 0), 0));
}

function styleRange(
  worksheet: ExcelJS.Worksheet,
  rowStart: number,
  colStart: number,
  rowEnd: number,
  colEnd: number,
  apply: (cell: ExcelJS.Cell) => void,
) {
  for (let row = rowStart; row <= rowEnd; row++) {
    for (let col = colStart; col <= colEnd; col++) {
      apply(worksheet.getCell(row, col));
    }
  }
}

function paint(
  cell: ExcelJS.Cell,
  fill: string,
  font: Partial<ExcelJS.Font>,
  horizontal: "center" | "left" = "center",
) {
  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: fill } };
  cell.font = { name: "Calibri", ...font };
  cell.alignment = { vertical: "middle", horizontal, wrapText: true };
  cell.border = border;
}

function writeScore(cell: ExcelJS.Cell, score: Score, highlight = false) {
  cell.value = score == null ? null : score;
  if (score != null) cell.numFmt = "0.00";
  paint(cell, highlight ? TOTAL_FILL : WHITE, {
    size: 10,
    color: { argb: INK },
  });
}

function writePercent(cell: ExcelJS.Cell, score: Score, highlight = false) {
  cell.value = score == null ? null : score;
  if (score != null) cell.numFmt = '0.00"%"';
  paint(cell, highlight ? TOTAL_FILL : WHITE, {
    size: 10,
    color: { argb: INK },
  });
}

function writeText(cell: ExcelJS.Cell, value: string) {
  cell.value = value;
  paint(cell, WHITE, { size: 10, color: { argb: INK } }, "left");
}

function writeHeader(cell: ExcelJS.Cell, value: string, fill = HEADER_FILL) {
  cell.value = value;
  paint(cell, fill, { size: 10, bold: true, color: { argb: INK } });
}

function prepareSheet(
  worksheet: ExcelJS.Worksheet,
  title: string,
  columnCount: number,
  widths: number[],
  frozenRows = 3,
) {
  worksheet.views = [
    { state: "frozen", ySplit: frozenRows, showGridLines: false },
  ];
  worksheet.pageSetup = {
    orientation: "landscape",
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    paperSize: 9,
    horizontalCentered: true,
    printTitlesRow: `1:${frozenRows}`,
  };
  worksheet.pageSetup.margins = {
    left: 0.4,
    right: 0.4,
    top: 0.5,
    bottom: 0.5,
    header: 0.2,
    footer: 0.2,
  };
  worksheet.getRow(1).height = 28;
  worksheet.getRow(2).height = 22;
  worksheet.getRow(3).height = 22;

  widths.forEach((width, index) => {
    worksheet.getColumn(index + 1).width = width;
  });

  worksheet.getCell(1, 1).value = title;
  worksheet.mergeCells(1, 1, 1, columnCount);
  styleRange(worksheet, 1, 1, 1, columnCount, (cell) => {
    paint(cell, TITLE_FILL, { size: 14, bold: true, color: { argb: WHITE } });
  });
}

function mergeHeader(
  worksheet: ExcelJS.Worksheet,
  row: number,
  col: number,
  rowSpan: number,
  colSpan: number,
  label: string,
) {
  const rowEnd = row + rowSpan - 1;
  const colEnd = col + colSpan - 1;
  worksheet.getCell(row, col).value = label;
  if (rowSpan > 1 || colSpan > 1) {
    worksheet.mergeCells(row, col, rowEnd, colEnd);
  }
  styleRange(worksheet, row, col, rowEnd, colEnd, (cell) => {
    paint(cell, HEADER_FILL, { size: 10, bold: true, color: { argb: INK } });
  });
  worksheet.getCell(row, col).value = label;
}

function levelScore(level: number | null | undefined, weight: number): Score {
  if (level == null) return null;
  return round2((level / 5) * weight);
}

function meritPeriod(
  result: string | null | undefined,
  employee: number | null | undefined,
  evaluator1: number | null | undefined,
  evaluator2: number | null | undefined,
  weight: number,
): MeritPeriodScore {
  return {
    result: result ?? "",
    employee: levelScore(employee, weight),
    evaluator1: levelScore(evaluator1, weight),
    evaluator2: levelScore(evaluator2, weight),
  };
}

function lineScore(weight: unknown, achievement: number | null): Score {
  if (achievement == null) return null;
  return round2((Number(weight ?? 0) * achievement) / 100);
}

function linkToStrategy(category: KpiCategory | null) {
  return category ? kpiCategoies[category] : "";
}

function detailRowHeight(texts: string[]) {
  const lines = texts.reduce((max, text) => {
    const breaks = text.split("\n").length;
    const wrapped = Math.ceil([...text].length / 36);
    return Math.max(max, breaks, wrapped);
  }, 1);
  return Math.min(96, Math.max(22, lines * 16));
}

function addBonusDetailSheet(
  workbook: ExcelJS.Workbook,
  rows: BonusDetailRow[],
  year: number,
) {
  const worksheet = workbook.addWorksheet("Detail");
  const headers = [
    "รหัสพนักงาน",
    "ชื่อพนักงาน",
    "ตำแหน่ง",
    "ระดับ",
    "สังกัด",
    "หน่วยงาน",
    "ตัวชี้วัด (KPIs)",
    "กลยุทธ์",
    "น้ำหนัก",
    "ผลลัพธ์",
    "Employee",
    "Evaluator 1",
    "Evaluator 2",
    "ผลสำเร็จ",
  ];
  const headerFills = [
    ...Array.from({ length: 10 }, () => HEADER_FILL),
    EMPLOYEE_FILL,
    EVALUATOR1_FILL,
    HEADER_FILL,
    TOTAL_FILL,
  ];

  prepareSheet(
    worksheet,
    `Details By Employee ปี ${buddhistYear(year)}`,
    headers.length,
    [16, 26, 36, 12, 16, 40, 42, 36, 12, 42, 14, 14, 14, 14],
    2,
  );

  headers.forEach((label, index) => {
    writeHeader(worksheet.getCell(2, index + 1), label, headerFills[index]);
  });

  rows.forEach((row, index) => {
    const excelRow = index + 3;
    worksheet.getRow(excelRow).height = detailRowHeight([
      row.kpi,
      row.strategy,
      row.result,
    ]);
    [
      row.id,
      row.name,
      row.position,
      row.rank,
      row.division,
      row.department,
      row.kpi,
      row.strategy,
    ].forEach((value, column) => {
      writeText(worksheet.getCell(excelRow, column + 1), value);
    });
    writePercent(worksheet.getCell(excelRow, 9), row.weight);
    writeText(worksheet.getCell(excelRow, 10), row.result);
    writeScore(worksheet.getCell(excelRow, 11), row.employee);
    writeScore(worksheet.getCell(excelRow, 12), row.evaluator1);
    writeScore(worksheet.getCell(excelRow, 13), row.evaluator2);
    writeScore(worksheet.getCell(excelRow, 14), row.evaluator2, true);
  });
}

function addBonusSettingSheet(
  workbook: ExcelJS.Workbook,
  groups: BonusSettingGroup[],
  year: number,
) {
  const worksheet = workbook.addWorksheet("KPI Setting");
  const headers = [
    "รหัสพนักงาน",
    "ชื่อพนักงาน",
    "ตำแหน่ง",
    "ระดับ",
    "สังกัด",
    "หน่วยงาน",
    "ปี",
    "ตัวชี้วัด (KPIs)",
    "กลยุทธ์",
    "น้ำหนัก",
    "เป้าหมาย",
    "รายละเอียด",
    "ผลสำเร็จ",
  ];
  const weightColumn = 10;
  const successColumn = 13;

  prepareSheet(
    worksheet,
    `KPI Bonus Setting ปี ${buddhistYear(year)}`,
    headers.length,
    [16, 26, 36, 12, 16, 40, 10, 42, 36, 12, 12, 36, 14],
    2,
  );

  headers.forEach((label, index) => {
    const fill = index === headers.length - 1 ? TOTAL_FILL : HEADER_FILL;
    writeHeader(worksheet.getCell(2, index + 1), label, fill);
  });

  let excelRow = 3;
  for (const group of groups) {
    const targets =
      group.targets.length > 0 ? group.targets : [{ label: "", detail: "" }];
    const start = excelRow;

    for (const target of targets) {
      worksheet.getRow(excelRow).height = detailRowHeight([
        group.kpi,
        group.strategy,
        target.detail,
      ]);
      [
        group.id,
        group.name,
        group.position,
        group.rank,
        group.division,
        group.department,
      ].forEach((value, column) => {
        writeText(worksheet.getCell(excelRow, column + 1), value);
      });
      const yearCell = worksheet.getCell(excelRow, 7);
      yearCell.value = group.year;
      paint(yearCell, WHITE, { size: 10, color: { argb: INK } });
      writeText(worksheet.getCell(excelRow, 8), group.kpi);
      writeText(worksheet.getCell(excelRow, 9), group.strategy);
      const targetCell = worksheet.getCell(excelRow, 11);
      targetCell.value = target.label || null;
      paint(targetCell, WHITE, { size: 10, color: { argb: INK } });
      writeText(worksheet.getCell(excelRow, 12), target.detail);
      excelRow += 1;
    }

    const end = excelRow - 1;
    if (end > start) {
      worksheet.mergeCells(start, weightColumn, end, weightColumn);
      worksheet.mergeCells(start, successColumn, end, successColumn);
    }
    writePercent(worksheet.getCell(start, weightColumn), group.weight);
    styleRange(worksheet, start, weightColumn, end, weightColumn, (cell) => {
      paint(cell, WHITE, { size: 10, color: { argb: INK } });
    });
    const successFill = group.success == null ? WHITE : TOTAL_FILL;
    writePercent(
      worksheet.getCell(start, successColumn),
      group.success,
      group.success != null,
    );
    styleRange(worksheet, start, successColumn, end, successColumn, (cell) => {
      paint(cell, successFill, { size: 10, color: { argb: INK } });
    });
  }
}

export function createBonusWorkbook(
  rows: BonusRow[],
  details: BonusDetailRow[],
  settings: BonusSettingGroup[],
  year: number,
) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "e-PMS";
  const worksheet = workbook.addWorksheet("Summary");
  const identity = [
    "รหัสพนักงาน",
    "ชื่อพนักงาน",
    "ตำแหน่ง",
    "ระดับ",
    "สังกัด",
    "หน่วยงาน",
    "น้ำหนัก",
  ];
  const scores = ["Employee", "Evaluator 1", "Evaluator 2", "Grand Total"];

  prepareSheet(
    worksheet,
    `KPI Bonus Summary ปี ${buddhistYear(year)}`,
    identity.length + scores.length,
    [16, 26, 36, 12, 16, 40, 12, 16, 16, 16, 16],
  );

  identity.forEach((label, index) => {
    mergeHeader(worksheet, 2, index + 1, 2, 1, label);
  });
  mergeHeader(
    worksheet,
    2,
    identity.length + 1,
    1,
    scores.length,
    "KPI Achievement",
  );
  scores.forEach((label, index) => {
    writeHeader(worksheet.getCell(3, identity.length + 1 + index), label);
  });

  rows.forEach((row, index) => {
    const excelRow = index + 4;
    worksheet.getRow(excelRow).height = 20;
    const texts = [
      row.id,
      row.name,
      row.position,
      row.rank,
      row.division,
      row.department,
    ];
    texts.forEach((value, column) => {
      writeText(worksheet.getCell(excelRow, column + 1), value);
    });
    writeScore(worksheet.getCell(excelRow, 7), row.weight);
    writeScore(worksheet.getCell(excelRow, 8), row.employee);
    writeScore(worksheet.getCell(excelRow, 9), row.evaluator1);
    writeScore(worksheet.getCell(excelRow, 10), row.evaluator2);
    writeScore(worksheet.getCell(excelRow, 11), row.grandTotal, true);
  });

  addBonusDetailSheet(workbook, details, year);
  addBonusSettingSheet(workbook, settings, year);
  return workbook;
}

function writeMeritPeriod(
  worksheet: ExcelJS.Worksheet,
  excelRow: number,
  startColumn: number,
  period: MeritPeriodScore,
) {
  writeText(worksheet.getCell(excelRow, startColumn), period.result);
  writeScore(worksheet.getCell(excelRow, startColumn + 1), period.employee);
  writeScore(worksheet.getCell(excelRow, startColumn + 2), period.evaluator1);
  writeScore(worksheet.getCell(excelRow, startColumn + 3), period.evaluator2);
  writeScore(
    worksheet.getCell(excelRow, startColumn + 4),
    period.evaluator2,
    true,
  );
}

function addMeritDetailSheet(
  workbook: ExcelJS.Workbook,
  rows: MeritDetailRow[],
  year: number,
) {
  const worksheet = workbook.addWorksheet("KPI Merit");
  const identity = [
    "รหัสพนักงาน",
    "ชื่อพนักงาน",
    "ตำแหน่ง",
    "ระดับ",
    "สังกัด",
    "หน่วยงาน",
    "ปี",
    "Type",
    "การแสดงพฤติกรรม/โครงการ/กิจกรรม",
    "ตัวอย่างพฤติกรรม/โครงการ",
  ];
  const firstHeaders = [
    "Result No.1",
    "Employee",
    "Evaluator 1",
    "Evaluator 2",
    "ผลสำเร็จ",
  ];
  const secondHeaders = [
    "Result No.2",
    "Employee",
    "Evaluator 1",
    "Evaluator 2",
    "ผลสำเร็จ",
  ];
  const roleFills = [
    HEADER_FILL,
    EMPLOYEE_FILL,
    EVALUATOR1_FILL,
    HEADER_FILL,
    TOTAL_FILL,
  ];
  const columnCount =
    identity.length + firstHeaders.length + secondHeaders.length;

  prepareSheet(
    worksheet,
    `KPI Merit ปี ${buddhistYear(year)}`,
    columnCount,
    [
      16, 26, 36, 12, 16, 40, 10, 18, 36, 36, 28, 14, 14, 14, 14, 28, 14, 14,
      14, 14,
    ],
    3,
  );
  worksheet.getRow(3).height = 32;

  identity.forEach((label, index) => {
    mergeHeader(worksheet, 2, index + 1, 2, 1, label);
  });
  mergeHeader(
    worksheet,
    2,
    identity.length + 1,
    1,
    firstHeaders.length,
    "Evaluation 1st",
  );
  mergeHeader(
    worksheet,
    2,
    identity.length + firstHeaders.length + 1,
    1,
    secondHeaders.length,
    "Evaluation 2nd",
  );
  for (const start of [
    identity.length + 1,
    identity.length + firstHeaders.length + 1,
  ]) {
    styleRange(
      worksheet,
      2,
      start,
      2,
      start + firstHeaders.length - 1,
      (cell) => {
        paint(cell, PERIOD_FILL, {
          size: 10,
          bold: true,
          color: { argb: INK },
        });
      },
    );
  }
  firstHeaders.forEach((label, index) => {
    writeHeader(
      worksheet.getCell(3, identity.length + 1 + index),
      label,
      roleFills[index],
    );
  });
  secondHeaders.forEach((label, index) => {
    writeHeader(
      worksheet.getCell(3, identity.length + firstHeaders.length + 1 + index),
      label,
      roleFills[index],
    );
  });

  rows.forEach((row, index) => {
    const excelRow = index + 4;
    worksheet.getRow(excelRow).height = detailRowHeight([
      row.behavior,
      row.example,
      row.first.result,
      row.second.result,
    ]);
    [
      row.id,
      row.name,
      row.position,
      row.rank,
      row.division,
      row.department,
    ].forEach((value, column) => {
      writeText(worksheet.getCell(excelRow, column + 1), value);
    });
    const yearCell = worksheet.getCell(excelRow, 7);
    yearCell.value = row.year;
    paint(yearCell, WHITE, { size: 10, color: { argb: INK } });
    writeText(worksheet.getCell(excelRow, 8), row.type);
    writeText(worksheet.getCell(excelRow, 9), row.behavior);
    writeText(worksheet.getCell(excelRow, 10), row.example);
    writeMeritPeriod(worksheet, excelRow, 11, row.first);
    writeMeritPeriod(worksheet, excelRow, 16, row.second);
  });
}

export function createMeritWorkbook(
  rows: MeritRow[],
  details: MeritDetailRow[],
  year: number,
) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "e-PMS";
  const worksheet = workbook.addWorksheet("Summary");
  const identity = [
    "รหัสพนักงาน",
    "ชื่อพนักงาน",
    "ตำแหน่ง",
    "ระดับ",
    "สังกัด",
    "หน่วยงาน",
  ];
  const groups = ["Owner", "Checker", "Approver"] as const;
  const metrics = ["KPI Achievement", "Competency", "Culture", "Grand Total"];
  const columnCount = identity.length + groups.length * metrics.length;

  prepareSheet(
    worksheet,
    `Merit Summary ปี ${buddhistYear(year)}`,
    columnCount,
    [16, 26, 36, 12, 16, 40, ...Array.from({ length: 12 }, () => 16)],
  );

  identity.forEach((label, index) => {
    mergeHeader(worksheet, 2, index + 1, 2, 1, label);
  });
  groups.forEach((group, groupIndex) => {
    const start = identity.length + 1 + groupIndex * metrics.length;
    mergeHeader(worksheet, 2, start, 1, metrics.length, group);
    metrics.forEach((metric, metricIndex) => {
      writeHeader(worksheet.getCell(3, start + metricIndex), metric);
    });
  });

  rows.forEach((row, index) => {
    const excelRow = index + 4;
    worksheet.getRow(excelRow).height = 20;
    [
      row.id,
      row.name,
      row.position,
      row.rank,
      row.division,
      row.department,
    ].forEach((value, column) => {
      writeText(worksheet.getCell(excelRow, column + 1), value);
    });
    const scores: Score[] = [
      row.ownerKpi,
      row.ownerCompetency,
      row.ownerCulture,
      row.ownerTotal,
      row.checkerKpi,
      row.checkerCompetency,
      row.checkerCulture,
      row.checkerTotal,
      row.approverKpi,
      row.approverCompetency,
      row.approverCulture,
      row.approverTotal,
    ];
    scores.forEach((score, column) => {
      writeScore(
        worksheet.getCell(excelRow, identity.length + 1 + column),
        score,
        column === scores.length - 1,
      );
    });
  });

  addMeritDetailSheet(workbook, details, year);
  return workbook;
}

async function toBase64(workbook: ExcelJS.Workbook) {
  const raw = await workbook.xlsx.writeBuffer();
  return Buffer.from(raw).toString("base64");
}

function totalWeight(kpis: KpiScoreSource[]): Score {
  if (kpis.length === 0) return null;
  return round2(kpis.reduce((sum, kpi) => sum + Number(kpi.weight ?? 0), 0));
}

export async function exportBonusSummary(year: number, employeeIds: string[]) {
  const [employees, forms] = await Promise.all([
    db.employee.findMany({
      where: { id: { in: employeeIds } },
      orderBy: { id: "asc" },
    }),
    db.form.findMany({
      where: { year, type: FormType.KPI, employeeId: { in: employeeIds } },
      include: { kpis: { orderBy: { order: "asc" } } },
    }),
  ]);

  const formsByEmployee = new Map<string, typeof forms>();
  for (const form of forms) {
    const current = formsByEmployee.get(form.employeeId) ?? [];
    current.push(form);
    formsByEmployee.set(form.employeeId, current);
  }

  const rows: BonusRow[] = employees.map((employee) => {
    const kpis = (formsByEmployee.get(employee.id) ?? []).flatMap(
      (form) => form.kpis,
    );
    const evaluator2 = weightedScore(kpis, "achievementApprover");
    return {
      id: employee.id,
      name: employee.name,
      position: employee.position,
      rank: employee.rank,
      division: employee.division,
      department: employee.department,
      weight: totalWeight(kpis),
      employee: weightedScore(kpis, "achievementOwner"),
      evaluator1: weightedScore(kpis, "achievementChecker"),
      evaluator2,
      grandTotal: evaluator2,
    };
  });

  const details = employees.flatMap((employee): BonusDetailRow[] => {
    const kpis = (formsByEmployee.get(employee.id) ?? []).flatMap(
      (form) => form.kpis,
    );
    const identity = {
      id: employee.id,
      name: employee.name,
      position: employee.position,
      rank: employee.rank,
      division: employee.division,
      department: employee.department,
    };
    if (kpis.length === 0) {
      return [
        {
          ...identity,
          kpi: "",
          strategy: "",
          weight: null,
          result: "",
          employee: null,
          evaluator1: null,
          evaluator2: null,
        },
      ];
    }
    return kpis.map((kpi) => ({
      ...identity,
      kpi: kpi.name ?? "",
      strategy: linkToStrategy(kpi.category),
      weight: round2(Number(kpi.weight ?? 0)),
      result: kpi.actualApprover ?? "",
      employee: lineScore(kpi.weight, kpi.achievementOwner),
      evaluator1: lineScore(kpi.weight, kpi.achievementChecker),
      evaluator2: lineScore(kpi.weight, kpi.achievementApprover),
    }));
  });

  const settings = employees.flatMap((employee): BonusSettingGroup[] => {
    const kpis = (formsByEmployee.get(employee.id) ?? []).flatMap(
      (form) => form.kpis,
    );
    const identity = {
      id: employee.id,
      name: employee.name,
      position: employee.position,
      rank: employee.rank,
      division: employee.division,
      department: employee.department,
      year,
    };
    if (kpis.length === 0) {
      return [
        {
          ...identity,
          kpi: "",
          strategy: "",
          weight: null,
          success: null,
          targets: [],
        },
      ];
    }
    return kpis.map((kpi) => ({
      ...identity,
      kpi: kpi.name ?? "",
      strategy: linkToStrategy(kpi.category),
      weight: round2(Number(kpi.weight ?? 0)),
      success: lineScore(kpi.weight, kpi.achievementApprover),
      targets: KPI_TARGETS.map((target) => ({
        label: `${target.level}%`,
        detail: kpi[target.key] ?? "",
      })),
    }));
  });

  return {
    file: await toBase64(createBonusWorkbook(rows, details, settings, year)),
    count: rows.length,
    filename: `KPI-Bonus-Summary-${buddhistYear(year)}.xlsx`,
  };
}

type CompetencyLevelKey = "levelOwner" | "levelChecker" | "levelApprover";
type CultureLevelKey =
  | "levelBehaviorOwner"
  | "levelBehaviorChecker"
  | "levelBehaviorApprover";

function competencyScore(
  records: Parameters<typeof sumCompetencyByPeriod>[0],
  key: CompetencyLevelKey,
): Score {
  const hasScore = records.some((record) =>
    record.competencyEvaluations.some(
      (evaluation) => evaluation.period === YEAR_END && evaluation[key] != null,
    ),
  );
  if (!hasScore) return null;
  return round2(sumCompetencyByPeriod(records, YEAR_END, key));
}

function cultureScore(
  records: Parameters<typeof sumCultureByPeriod>[0],
  key: CultureLevelKey,
): Score {
  const hasScore = records.some((record) =>
    record.cultureEvaluations.some(
      (evaluation) => evaluation.period === YEAR_END && evaluation[key] != null,
    ),
  );
  if (!hasScore) return null;
  return round2(sumCultureByPeriod(records, YEAR_END, key));
}

export async function exportMeritSummary(year: number, employeeIds: string[]) {
  const [employees, meritForms, kpiForms] = await Promise.all([
    db.employee.findMany({
      where: { id: { in: employeeIds } },
      orderBy: { id: "asc" },
    }),
    db.form.findMany({
      where: { year, type: FormType.MERIT, employeeId: { in: employeeIds } },
      include: {
        competencyRecords: {
          orderBy: { order: "asc" },
          include: {
            competency: { select: { name: true } },
            competencyEvaluations: true,
          },
        },
        cultureRecords: {
          orderBy: { order: "asc" },
          include: {
            culture: { select: { name: true, code: true } },
            cultureEvaluations: true,
          },
        },
      },
    }),
    db.form.findMany({
      where: { year, type: FormType.KPI, employeeId: { in: employeeIds } },
      include: { kpis: true },
    }),
  ]);

  const kpisByEmployee = new Map<string, KpiScoreSource[]>();
  for (const form of kpiForms) {
    const current = kpisByEmployee.get(form.employeeId) ?? [];
    current.push(...form.kpis);
    kpisByEmployee.set(form.employeeId, current);
  }

  const meritByEmployee = new Map<string, typeof meritForms>();
  for (const form of meritForms) {
    const current = meritByEmployee.get(form.employeeId) ?? [];
    current.push(form);
    meritByEmployee.set(form.employeeId, current);
  }

  const rows: MeritRow[] = employees.map((employee) => {
    const group = meritByEmployee.get(employee.id) ?? [];
    const kpis = kpisByEmployee.get(employee.id) ?? [];
    const competencies = group.flatMap((form) => form.competencyRecords);
    const cultures = group.flatMap((form) => form.cultureRecords);

    const ownerKpi = meritKpiScore(kpis, employee.rank, "achievementOwner");
    const ownerCompetency = competencyScore(competencies, "levelOwner");
    const ownerCulture = cultureScore(cultures, "levelBehaviorOwner");
    const checkerKpi = meritKpiScore(kpis, employee.rank, "achievementChecker");
    const checkerCompetency = competencyScore(competencies, "levelChecker");
    const checkerCulture = cultureScore(cultures, "levelBehaviorChecker");
    const approverKpi = meritKpiScore(
      kpis,
      employee.rank,
      "achievementApprover",
    );
    const approverCompetency = competencyScore(competencies, "levelApprover");
    const approverCulture = cultureScore(cultures, "levelBehaviorApprover");

    return {
      id: employee.id,
      name: employee.name,
      position: employee.position,
      rank: employee.rank,
      division: employee.division,
      department: employee.department,
      ownerKpi,
      ownerCompetency,
      ownerCulture,
      ownerTotal: totalOf([ownerKpi, ownerCompetency, ownerCulture]),
      checkerKpi,
      checkerCompetency,
      checkerCulture,
      checkerTotal: totalOf([checkerKpi, checkerCompetency, checkerCulture]),
      approverKpi,
      approverCompetency,
      approverCulture,
      approverTotal: totalOf([
        approverKpi,
        approverCompetency,
        approverCulture,
      ]),
    };
  });

  const details = employees.flatMap((employee): MeritDetailRow[] => {
    const group = meritByEmployee.get(employee.id) ?? [];
    const kpis = kpisByEmployee.get(employee.id) ?? [];
    const competencies = group
      .flatMap((form) => form.competencyRecords)
      .sort((a, b) => a.order - b.order);
    const cultures = group
      .flatMap((form) => form.cultureRecords)
      .sort((a, b) => {
        const aIndex = CULTURE_ORDER.indexOf(a.culture?.code ?? "");
        const bIndex = CULTURE_ORDER.indexOf(b.culture?.code ?? "");
        return (
          (aIndex === -1 ? CULTURE_ORDER.length : aIndex) -
            (bIndex === -1 ? CULTURE_ORDER.length : bIndex) || a.order - b.order
        );
      });
    const cultureWeight = cultures.length === 0 ? 0 : 30 / cultures.length;
    const identity = {
      id: employee.id,
      name: employee.name,
      position: employee.position,
      rank: employee.rank,
      division: employee.division,
      department: employee.department,
      year,
    };
    const kpiPeriod: MeritPeriodScore = {
      result: "",
      employee: meritKpiScore(kpis, employee.rank, "achievementOwner"),
      evaluator1: meritKpiScore(kpis, employee.rank, "achievementChecker"),
      evaluator2: meritKpiScore(kpis, employee.rank, "achievementApprover"),
    };

    return [
      {
        ...identity,
        type: "KPI Achievement",
        behavior: "",
        example: "",
        first: kpiPeriod,
        second: kpiPeriod,
      },
      ...competencies.map((record) => {
        const mid = record.competencyEvaluations.find(
          (evaluation) => evaluation.period === MID_YEAR,
        );
        const end = record.competencyEvaluations.find(
          (evaluation) => evaluation.period === YEAR_END,
        );
        const weight = Number(record.weight ?? 0);
        return {
          ...identity,
          type: "Competency",
          behavior: record.competency?.name ?? "",
          example: [record.input, record.output].filter(Boolean).join("\n"),
          first: meritPeriod(
            mid?.actualApprover,
            mid?.levelOwner,
            mid?.levelChecker,
            mid?.levelApprover,
            weight,
          ),
          second: meritPeriod(
            end?.actualApprover,
            end?.levelOwner,
            end?.levelChecker,
            end?.levelApprover,
            weight,
          ),
        };
      }),
      ...cultures.map((record) => {
        const mid = record.cultureEvaluations.find(
          (evaluation) => evaluation.period === MID_YEAR,
        );
        const end = record.cultureEvaluations.find(
          (evaluation) => evaluation.period === YEAR_END,
        );
        return {
          ...identity,
          type: "Culture",
          behavior: record.culture?.code
            ? `Culture ${record.culture.code}`
            : (record.culture?.name ?? ""),
          example: record.evidence ?? "",
          first: meritPeriod(
            mid?.actualApprover,
            mid?.levelBehaviorOwner,
            mid?.levelBehaviorChecker,
            mid?.levelBehaviorApprover,
            cultureWeight,
          ),
          second: meritPeriod(
            end?.actualApprover,
            end?.levelBehaviorOwner,
            end?.levelBehaviorChecker,
            end?.levelBehaviorApprover,
            cultureWeight,
          ),
        };
      }),
    ];
  });

  return {
    file: await toBase64(createMeritWorkbook(rows, details, year)),
    count: rows.length,
    filename: `Merit-Summary-${buddhistYear(year)}.xlsx`,
  };
}
