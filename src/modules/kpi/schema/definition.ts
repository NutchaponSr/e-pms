import { z } from "zod";

import { KpiCategory } from "@/generated/prisma/enums";

const kpiDefinitionBaseSchema = z.object({
  id: z.string(),
  name: z.string().trim().min(1),
  year: z.number(),
  category: z.enum(KpiCategory),
  weight: z.coerce.number().min(0).max(100),
  objective: z.string().trim().min(1),
  definition: z.string().trim().min(1),
  strategy: z.string().trim().min(1),
  method: z.string().trim().min(1),
  target100: z.string().trim().nullable().default(null),
  target120: z.string().trim().nullable().default(null),
  target80: z.string().trim().nullable().default(null),
  target90: z.string().trim().nullable().default(null),
  target70: z.string().trim().nullable().default(null),
  type: z.string().trim().nullable().default("FP"),
});

export const kpiDefinitionSchema = kpiDefinitionBaseSchema.refine(
  (data) => (data.year >= 2025 ? data.type !== null && data.type !== "" : true),
  {
    message: "Type is required",
    path: ["type"],
  },
);

export const kpiDefinitionsSchema = z.object({
  kpis: z.array(kpiDefinitionSchema),
});

// Schema for raw input data from database (before validation/transformation)
// Adapted from kpiDefinitionBaseSchema with nullable fields and unknown weight
export const rawKpiForMappingSchema = kpiDefinitionBaseSchema.extend({
  name: z.string().nullable(),
  category: z.enum(KpiCategory).nullable(),
  weight: z.unknown(), // Accepts Decimal, number, string, or null
  objective: z.string().nullable(),
  definition: z.string().nullable(),
  strategy: z.string().nullable(),
  method: z.string().nullable(),
  // Optional evaluation properties
  actualOwner: z.string().nullable().optional(),
  achievementOwner: z.number().nullable().optional(),
});

export type KpiDefinition = z.infer<typeof kpiDefinitionSchema>;
export type KpiDefinitions = z.infer<typeof kpiDefinitionsSchema>;
export type KpiDefinitionsMapping = z.infer<typeof rawKpiForMappingSchema>;