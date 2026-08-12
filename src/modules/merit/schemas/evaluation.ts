import { z } from "zod";

import { COMPETENCY_ACTUAL_MAX_LENGTH } from "../constant";

const competencyActualFieldSchema = z
  .string()
  .max(COMPETENCY_ACTUAL_MAX_LENGTH, `กรอกได้ไม่เกิน ${COMPETENCY_ACTUAL_MAX_LENGTH} ตัวอักษร`)
  .nullable();

export const comepetencyEvaluationSchema = z.object({
  id: z.string(),
  role: z.enum(["owner", "checker", "approver"]),
  actualOwner: competencyActualFieldSchema,
  achievementOwner: z.coerce.number().nullable(),
  actualChecker: competencyActualFieldSchema,
  achievementChecker: z.coerce.number().nullable(),
  actualApprover: competencyActualFieldSchema,
  achievementApprover: z.coerce.number().nullable(),
  fileUrl: z.string().nullable(),
  result: z.string().nullable(),
}).superRefine((data, ctx) => {
  switch (data.role) {
    case "owner":
      if (!data.actualOwner?.trim()) {
        ctx.addIssue({ code: "custom", message: "Actual owner is required", path: ["actualOwner"] });
      }
      break;
    case "checker":
      if (!data.actualChecker?.trim()) {
        ctx.addIssue({ code: "custom", message: "Actual checker is required", path: ["actualChecker"] });
      }
      break;
    case "approver":
      if (!data.actualApprover?.trim()) {
        ctx.addIssue({ code: "custom", message: "Actual approver is required", path: ["actualApprover"] });
      }
      break;
  }
});

export const cultureEvaluationSchema = z.object({
  id: z.string(),
  role: z.enum(["owner", "checker", "approver"]),
  actualOwner: competencyActualFieldSchema,
  levelBehaviorOwner: z.coerce.number().nullable(),
  actualChecker: competencyActualFieldSchema,
  levelBehaviorChecker: z.coerce.number().nullable(),
  actualApprover: competencyActualFieldSchema,
  levelBehaviorApprover: z.coerce.number().nullable(),
  fileUrl: z.string().nullable(),
  result: z.string().nullable(),
}).superRefine((data, ctx) => {
  switch (data.role) {
    case "owner":
      if (!data.actualOwner?.trim()) {
        ctx.addIssue({ code: "custom", message: "Actual owner is required", path: ["actualOwner"] });
      }

      break;
    case "checker":
      if (!data.actualChecker?.trim()) {
        ctx.addIssue({ code: "custom", message: "Actual checker is required", path: ["actualChecker"] });
      }

      break;
    case "approver":
      if (!data.actualApprover?.trim()) {
        ctx.addIssue({ code: "custom", message: "Actual approver is required", path: ["actualApprover"] });
      }

      break;
  }
});

const overallCommentFieldSchema = z
  .string()
  .max(COMPETENCY_ACTUAL_MAX_LENGTH, `กรอกได้ไม่เกิน ${COMPETENCY_ACTUAL_MAX_LENGTH} ตัวอักษร`)
  .nullable();

export const overallCommentFieldsSchema = z.object({
  commentOwner: overallCommentFieldSchema,
  commentChecker: overallCommentFieldSchema,
  commentApprover: overallCommentFieldSchema,
});

const overallCommentWithRoleSchema = overallCommentFieldsSchema.extend({
  role: z.enum(["owner", "checker", "approver"]),
});

export const meritEvaluationsSchema = z.object({
  requireEvaluationResults: z.boolean().default(false),
  cultures: z.array(cultureEvaluationSchema),
  competencies: z.array(comepetencyEvaluationSchema),
  overallComments: overallCommentWithRoleSchema,
}).superRefine((data, ctx) => {
  if (data.requireEvaluationResults) {
    data.competencies.forEach((competency, index) => {
      switch (competency.role) {
        case "owner":
          if (competency.achievementOwner == null) {
            ctx.addIssue({
              code: "custom",
              message: "กรุณาเลือกผลการประเมิน",
              path: ["competencies", index, "achievementOwner"],
            });
          }
          break;
        case "checker":
          if (competency.achievementChecker == null) {
            ctx.addIssue({
              code: "custom",
              message: "กรุณาเลือกผลการประเมิน",
              path: ["competencies", index, "achievementChecker"],
            });
          }
          break;
        case "approver":
          if (competency.achievementApprover == null) {
            ctx.addIssue({
              code: "custom",
              message: "กรุณาเลือกผลการประเมิน",
              path: ["competencies", index, "achievementApprover"],
            });
          }
          break;
      }
    });

    data.cultures.forEach((culture, index) => {
      switch (culture.role) {
        case "owner":
          if (culture.levelBehaviorOwner == null) {
            ctx.addIssue({
              code: "custom",
              message: "กรุณาเลือกผลการประเมิน",
              path: ["cultures", index, "levelBehaviorOwner"],
            });
          }
          break;
        case "checker":
          if (culture.levelBehaviorChecker == null) {
            ctx.addIssue({
              code: "custom",
              message: "กรุณาเลือกผลการประเมิน",
              path: ["cultures", index, "levelBehaviorChecker"],
            });
          }
          break;
        case "approver":
          if (culture.levelBehaviorApprover == null) {
            ctx.addIssue({
              code: "custom",
              message: "กรุณาเลือกผลการประเมิน",
              path: ["cultures", index, "levelBehaviorApprover"],
            });
          }
          break;
      }
    });
  }

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

export type MeritEvaluation = z.infer<typeof meritEvaluationsSchema>;
export type OverallComment = z.infer<typeof overallCommentWithRoleSchema>;
export type CultureEvaluation = z.infer<typeof cultureEvaluationSchema>;
export type CompetencyEvaluation = z.infer<typeof comepetencyEvaluationSchema>;