import { z } from "zod";

export const kpiEvaluationSchema = z.object({
  id: z.string(),
  role: z.enum(["owner", "checker", "approver"]),
  actualOwner: z.string().nullable(),
  achievementOwner: z.coerce.number().nullable(),
  actualChecker: z.string().nullable(),
  achievementChecker: z.coerce.number().nullable(),
  actualApprover: z.string().nullable(),
  achievementApprover: z.coerce.number().nullable(),
  fileUrl: z.string().nullable(),
}).superRefine((data, ctx) => {
  switch (data.role) {
    case "owner":
      if (!data.actualOwner) {
        ctx.addIssue({ code: "custom", message: "Actual owner is required", path: ["actualOwner"] });
      }
      if (!data.achievementOwner) {
        ctx.addIssue({ code: "custom", message: "Achievement owner is required", path: ["achievementOwner"] });
      }
      break;
    case "checker":
      if (!data.actualChecker) {
        ctx.addIssue({ code: "custom", message: "Actual checker is required", path: ["actualChecker"] });
      }
      if (!data.achievementChecker) {
        ctx.addIssue({ code: "custom", message: "Achievement checker is required", path: ["achievementChecker"] });
      }
      break;
    case "approver":
      if (!data.actualApprover) {
        ctx.addIssue({ code: "custom", message: "Actual approver is required", path: ["actualApprover"] });
      }
      if (!data.achievementApprover) {
        ctx.addIssue({ code: "custom", message: "Achievement approver is required", path: ["achievementApprover"] });
      }
      break;
  }
});

export const kpisEvaluationSchema = z.object({
  kpis: z.array(kpiEvaluationSchema),
});

export type KpiEvaluation = z.infer<typeof kpiEvaluationSchema>;
export type KpisEvaluation = z.infer<typeof kpisEvaluationSchema>;