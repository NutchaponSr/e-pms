import { z } from "zod";

import { CompetencyType } from "@/generated/prisma/enums";

export const competencyDefinitionSchema = z.object({
  id: z.string(),
  competencyId: z.string().min(1, "Competency is required"),
  input: z.string().min(1, "Input is required"),
  output: z.string().min(1, "Output is required"),
  weight: z.coerce.number().min(1, "Weight is required").max(100, "Weight must be at most 100"),
  expectedLevel: z.number().min(1, "Expected level is required").max(5, "Expected level must be between 0 and 5"),
});

export const cultureDefinitionSchema = z.object({
  id: z.string(),
  evidence: z.string().min(1, "Evidence is required"),
});

export const meritDefinitionSchema = z.object({
  competencies: z.array(competencyDefinitionSchema),
  cultures: z.array(cultureDefinitionSchema),
});

export type MeritDefinition = z.infer<typeof meritDefinitionSchema>;