import { z } from "zod";

// Sheet 1
export const competencyUploadSchema = z.object({
  competencyId: z.string().trim().min(1, "Competency is required"),
  name: z.string().trim().min(1, "Name is required"),
  expectedLevel: z.number().min(1, "Expected level is required").max(5, "Expected level must be between 0 and 5"),
  input: z.string().trim().min(1, "Input is required"),
  output: z.string().trim().min(1, "Output is required"),
  weight: z.coerce.number().min(1, "Weight is required").max(100, "Weight must be at most 100"),
});

// Sheet 2
export const cultureUploadSchema = z.object({
  code: z.string().trim().min(1, "Code is required"),
  evidence: z.string().trim().min(1, "Evidence is required"),
});

export type CultureUpload = z.infer<typeof cultureUploadSchema>;
export type CompetencyUpload = z.infer<typeof competencyUploadSchema>;