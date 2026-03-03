import { z } from "zod";

export const competencyDefinitionSchema = z.object({
  id: z.string(),
  competencyId: z.string().nullable(),
  input: z.string().nullable(),
  output: z.string().nullable(),
  // allow nullable while still constraining valid numbers
  weight: z.coerce.number().min(0).max(100),
  expectedLevel: z.number().max(5, "Expected level must be between 0 and 5").nullable(),
});

export const cultureDefinitionSchema = z.object({
  id: z.string(),
  evidence: z.string().nullable(),
});

export const meritDefinitionSchema = z.object({
  saved: z.boolean().default(false),
  competencies: z.array(competencyDefinitionSchema),
  cultures: z.array(cultureDefinitionSchema),
}).superRefine((data, ctx) => {
  // ถ้าเป็นการบันทึกแบบ “saved” ให้บังคับ required ตามฟิลด์ที่ต้องการ
  if (data.saved) {
    data.competencies.forEach((comp, index) => {
      if (!comp.competencyId) {
        ctx.addIssue({
          code: "custom",
          message: "Competency is required",
          path: ["competencies", index, "competencyId"],
        });
      }
      if (!comp.input) {
        ctx.addIssue({
          code: "custom",
          message: "Input is required",
          path: ["competencies", index, "input"],
        });
      }
      if (!comp.output) {
        ctx.addIssue({
          code: "custom",
          message: "Output is required",
          path: ["competencies", index, "output"],
        });
      }
      if (comp.weight < 1 || comp.weight > 100) {
        ctx.addIssue({
          code: "custom",
          message: "Weight must be at least 1 when saved",
          path: ["competencies", index, "weight"],
        });
      }
      if (comp.expectedLevel == null || comp.expectedLevel === 0) {
        ctx.addIssue({
          code: "custom",
          message: "Expected level is required",
          path: ["competencies", index, "expectedLevel"],
        });
      }
    });

    data.cultures.forEach((culture, index) => {
      if (!culture.evidence) {
        ctx.addIssue({
          code: "custom",
          message: "Evidence is required",
          path: ["cultures", index, "evidence"],
        });
      }
    });
  } else {
    data.competencies.forEach((comp, index) => {
      if (comp.weight < 0 || comp.weight > 100) {
        ctx.addIssue({
          code: "custom",
          message: "Weight must be at least 0 for draft",
          path: ["competencies", index, "weight"],
        });
      }
    });
  }
});

export type MeritDefinition = z.infer<typeof meritDefinitionSchema>;