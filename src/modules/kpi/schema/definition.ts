import { z } from "zod";

import { KpiCategory } from "@/generated/prisma/enums";

export const kpiDefinitionSchema = z.object({
  id: z.string(),
  name: z.string().trim().min(1, "Name is required"),
  year: z.number(),
  category: z.enum(["CS1", "CS2", "CS3", "CS4", "CS5"], "Category is required"),
  weight: z.coerce.number().min(0).max(100),
  objective: z.string().trim().nullable().default(null),
  definition: z.string().trim().min(1, "Definition is required"),
  strategy: z.string().trim().nullable().default(null),
  method: z.string().trim().min(1, "Method is required"),
  target100: z.string().trim().nullable().default(null),
  target80: z.string().trim().nullable().default(null),
  target90: z.string().trim().nullable().default(null),
  target70: z.string().trim().nullable().default(null),
  target60: z.string().trim().nullable().default(null),
  type: z.string().trim().nullable().default("FP"),
});

// Looser schema for inputs that may omit key fields (used by update bulk)
export const kpiDefinitionInputSchema = kpiDefinitionSchema
  .omit({ year: true })
  .extend({
    name: z.string().trim().nullable(),
    category: z.enum(["CS1", "CS2", "CS3", "CS4", "CS5"]).nullable(),
    definition: z.string().trim().nullable(),
    method: z.string().trim().nullable(),
  });

// export const kpiDefinitionSchema = kpiDefinitionBaseSchema.refine(
//   (data) => (data.year >= 2025 ? data.type !== null && data.type !== "" : true),
//   {
//     message: "Type is required",
//     path: ["type"],
//   },
// );

export const kpiDefinitionsSchema = z.object({
  kpis: z.array(kpiDefinitionSchema),
  saved: z.boolean().default(false),
}).superRefine((data, ctx) => {
  data.kpis.forEach((kpi, index) => {
    if (data.saved) {
      if (kpi.weight < 1 || kpi.weight > 100) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Weight must be at least 1 when saved",
          path: ["kpis", index, "weight"],
        });
      }
      if (kpi.target70 === null || kpi.target70 === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Target 70 is required",
          path: ["kpis", index, "target70"],
        });
      }
    } else {
      if (kpi.weight < 0 || kpi.weight > 100) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Weight must be at least 0 for draft",
          path: ["kpis", index, "weight"],
        });
      }
    }
  });
});

// Schema for raw input data from database (before validation/transformation)
// Adapted from kpiDefinitionBaseSchema with nullable fields and unknown weight
export const rawKpiForMappingSchema = kpiDefinitionSchema.extend({
  name: z.string().nullable(),
  category: z.nativeEnum(KpiCategory).nullable(),
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