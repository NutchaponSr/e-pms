import { KpiCategory } from "@/generated/prisma/enums";

export const kpiCategoies: Record<KpiCategory, string> = {
  [KpiCategory.CP]: "Customer Perspective",
  [KpiCategory.FP]: "Financial Perspective",
  [KpiCategory.IP]: "Internal Perspective",
  [KpiCategory.L_G]: "Learning & Growth",
}

export const requiredFields = ["name", "category", "definition", "method"]