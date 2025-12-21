import { z } from "zod";

import { KpiCategory } from "@/generated/prisma/enums";

export const kpiUploadSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  category: z.enum(Object.values(KpiCategory) as [string, ...string[]]),
  strategy: z.string().trim().nullable(),
  objective: z.string().trim().nullable(),
  type: z.string().trim().nullable(),
  weight: z.coerce.number().min(0, "Weight must be at least 0").max(100, "Weight cannot exceed 100"),
  definition: z.string().trim().min(1, "Definition is required"),
  method: z.string().trim().min(1, "Method is required"),
  target100: z
    .union([z.string(), z.number()])
    .transform((val) => (val === null || val === undefined ? null : String(val).trim() || null))
    .nullable(),
  target120: z
    .union([z.string(), z.number()])
    .transform((val) => (val === null || val === undefined ? null : String(val).trim() || null))
    .nullable(),
  target80: z
    .union([z.string(), z.number()])
    .transform((val) => (val === null || val === undefined ? null : String(val).trim() || null))
    .nullable(),
  target90: z
    .union([z.string(), z.number()])
    .transform((val) => (val === null || val === undefined ? null : String(val).trim() || null))
    .nullable(),
});

export type KpiUpload = z.infer<typeof kpiUploadSchema>;