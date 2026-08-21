import { KpiCategory, type Period } from "@/generated/prisma/enums";
import type { ExportColumn } from "@/lib/utils";
import { parsePeriodParam } from "@/modules/tasks/constant";

export type KpiPeriod = Extract<Period, "IN_DRAFT" | "EVALUATION">;

export function isKpiPeriod(period: Period): period is KpiPeriod {
  return period === "IN_DRAFT" || period === "EVALUATION";
}

export function parseKpiPeriodParam(slug: string): KpiPeriod | undefined {
  const period = parsePeriodParam(slug);
  return period && isKpiPeriod(period) ? period : undefined;
}

export const KPI_TARGET_FIELDS = [
  { percent: "70%", name: "target70" },
  { percent: "80%", name: "target80" },
  { percent: "90%", name: "target90" },
  { percent: "100%", name: "target100" },
] as const;

export const kpiCategoies: Record<KpiCategory, string> = {
  [KpiCategory.CS1]: "CS1: Sustainable growth",
  [KpiCategory.CS2]: "CS2: Strengthening the core business",
  [KpiCategory.CS3]:
    "CS3: Leading engineering products and solutions development",
  [KpiCategory.CS4]:
    "CS4: Securing advanced technology as competitive advantage",
  [KpiCategory.CS5]: "CS5: Developing people and team capabilities",
};

export const requiredFields = ["name", "category", "definition", "method"];

export const KPI_ACTUAL_MAX_LENGTH = 255;
export const OVERALL_COMMENT_MAX_LENGTH = 255;

export const columns: ExportColumn[] = [
  {
    key: "employeeId",
    header: "รหัสพนักงาน",
  },
  {
    key: "employeeName",
    header: "ชื่อพนักงาน",
  },
  {
    key: "year",
    header: "Year",
  },
  {
    key: "period",
    header: "Period",
  },
  {
    key: "performer",
    header: "Performer",
  },
  {
    key: "name",
    header: "ชื่อ KPI",
  },
  {
    key: "owner",
    header: "Owner",
  },
  {
    key: "checker",
    header: "Checker",
  },
  {
    key: "approver",
    header: "Approver",
  },
  {
    key: "percentage",
    header: "Percentage (%)",
  },
];
