import { z } from "zod";

import { KPI_ACTUAL_MAX_LENGTH, OVERALL_COMMENT_MAX_LENGTH } from "../constants";

const kpiActualFieldSchema = z
  .string()
  .max(KPI_ACTUAL_MAX_LENGTH, `กรอกได้ไม่เกิน ${KPI_ACTUAL_MAX_LENGTH} ตัวอักษร`)
  .nullable();

export const kpiEvaluationFieldsSchema = z.object({
  id: z.string(),
  role: z.enum(["owner", "checker", "approver"]),
  actualOwner: kpiActualFieldSchema,
  achievementOwner: z.coerce.number().nullable(),
  actualChecker: kpiActualFieldSchema,
  achievementChecker: z.coerce.number().nullable(),
  actualApprover: kpiActualFieldSchema,
  achievementApprover: z.coerce.number().nullable(),
  fileUrl: z.string({ error: "File is required" }).nullish(),
});

export const kpiEvaluationSchema = kpiEvaluationFieldsSchema.superRefine((data, ctx) => {
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

const overallCommentFieldSchema = z
  .string()
  .max(OVERALL_COMMENT_MAX_LENGTH, `กรอกได้ไม่เกิน ${OVERALL_COMMENT_MAX_LENGTH} ตัวอักษร`)
  .nullable();

export const overallCommentFieldsSchema = z.object({
  commentOwner: overallCommentFieldSchema,
  commentChecker: overallCommentFieldSchema,
  commentApprover: overallCommentFieldSchema,
});

const overallCommentWithRoleSchema = overallCommentFieldsSchema.extend({
  role: z.enum(["owner", "checker", "approver"]),
});

export const kpisEvaluationSchema = z.object({
  kpis: z.array(kpiEvaluationSchema),
  overallComments: overallCommentWithRoleSchema,
}).superRefine((data, ctx) => {
  switch (data.overallComments.role) {
    case "owner":
      if (!data.overallComments.commentOwner?.trim()) {
        ctx.addIssue({
          code: "custom",
          message: "Overall comment is required",
          path: ["overallComments", "commentOwner"],
        });
      }
      break;
    case "checker":
      if (!data.overallComments.commentChecker?.trim()) {
        ctx.addIssue({
          code: "custom",
          message: "Overall comment is required",
          path: ["overallComments", "commentChecker"],
        });
      }
      break;
    case "approver":
      if (!data.overallComments.commentApprover?.trim()) {
        ctx.addIssue({
          code: "custom",
          message: "Overall comment is required",
          path: ["overallComments", "commentApprover"],
        });
      }
      break;
  }
});

export const kpiEvaluationInputSchema = kpiEvaluationFieldsSchema.omit({ role: true });
export type KpiEvaluation = z.infer<typeof kpiEvaluationSchema>;
export type KpisEvaluation = z.infer<typeof kpisEvaluationSchema>;
export type OverallComment = z.infer<typeof overallCommentWithRoleSchema>;
