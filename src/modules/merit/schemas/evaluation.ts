import { z } from "zod";

export const comepetencyEvaluationSchema = z.object({
  id: z.string(),
  role: z.enum(["owner", "checker", "approver"]),
  actualOwner: z.string().nullable(),
  achievementOwner: z.coerce.number().nullable(),
  actualChecker: z.string().nullable(),
  achievementChecker: z.coerce.number().nullable(),
  actualApprover: z.string().nullable(),
  achievementApprover: z.coerce.number().nullable(),
  fileUrl: z.string().nullable(),
  result: z.string().nullable(),
}).superRefine((data, ctx) => {
  switch (data.role) {
    case "owner":
      if (!data.result) {
        ctx.addIssue({ code: "custom", message: "Result is required", path: ["result"] });
      }

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

export const cultureEvaluationSchema = z.object({
  id: z.string(),
  role: z.enum(["owner", "checker", "approver"]),
  actualOwner: z.string().nullable(),
  levelBehaviorOwner: z.coerce.number().nullable(),
  actualChecker: z.string().nullable(),
  levelBehaviorChecker: z.coerce.number().nullable(),
  actualApprover: z.string().nullable(),
  levelBehaviorApprover: z.coerce.number().nullable(),
  fileUrl: z.string().nullable(),
  result: z.string().nullable(),
}).superRefine((data, ctx) => {
  switch (data.role) {
    case "owner":
      if (!data.result) {
        ctx.addIssue({ code: "custom", message: "Result is required", path: ["result"] });
      }

      if (!data.actualOwner) {
        ctx.addIssue({ code: "custom", message: "Actual owner is required", path: ["actualOwner"] });
      }

      if (!data.levelBehaviorOwner) {
        ctx.addIssue({ code: "custom", message: "Level behavior owner is required", path: ["levelBehaviorOwner"] });
      }

      break;
    case "checker":
      if (!data.actualChecker) {
        ctx.addIssue({ code: "custom", message: "Actual checker is required", path: ["actualChecker"] });
      }

      if (!data.levelBehaviorChecker) {
        ctx.addIssue({ code: "custom", message: "Level behavior checker is required", path: ["levelBehaviorChecker"] });
      }

      break;
    case "approver":
      if (!data.actualApprover) {
        ctx.addIssue({ code: "custom", message: "Actual approver is required", path: ["actualApprover"] });
      }

      if (!data.levelBehaviorApprover) {
        ctx.addIssue({ code: "custom", message: "Level behavior approver is required", path: ["levelBehaviorApprover"] });
      }

      break;
  }
});

export const meritEvaluationsSchema = z.object({
  cultures: z.array(cultureEvaluationSchema),
  competencies: z.array(comepetencyEvaluationSchema),
});

export type MeritEvaluation = z.infer<typeof meritEvaluationsSchema>;
export type CultureEvaluation = z.infer<typeof cultureEvaluationSchema>;
export type CompetencyEvaluation = z.infer<typeof comepetencyEvaluationSchema>;