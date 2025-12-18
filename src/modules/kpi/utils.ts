import { KpiCategory } from "@/generated/prisma/enums";

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
    // แปลง weight ให้เป็น number เสมอ รองรับ number / Decimal / string
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
