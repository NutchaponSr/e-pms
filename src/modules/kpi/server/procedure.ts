import db from "@/lib/db";

import { z } from "zod";

import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";

import { FormType, KpiCategory, Period, Status, UserRole } from "@/generated/prisma/enums";

import { kpiUploadSchema } from "@/modules/kpi/schema/upload";
import { kpiEvaluationSchema, overallCommentFieldsSchema } from "@/modules/kpi/schema/evaluation";
import {
  kpiDefinitionInputSchema,
  kpiDefinitionSchema,
} from "@/modules/kpi/schema/definition";
import { buildPermissionContext, getUserRole } from "@/modules/tasks/permissions";
import { getApprovalChain, taskChainInclude, withTaskChain } from "@/modules/tasks/chain";
import { assertAnyRoleOnForm, assertFormOwner, requireTaskRole } from "@/modules/tasks/access";
import { calculateSumAchievement, formatKpiExport } from "../utils";
import { exportExcel, formatDecimal } from "@/lib/utils";
import { columns } from "../constants";
import { generateTaskId } from "@/modules/tasks/utils";
import { getWindows, isWindowOpen } from "@/modules/tasks/windows";
import {
  buildOverallCommentRoleUpdate,
  groupByConnectId,
  normalizeEmptyStringToNull,
  type EvaluationRole,
} from "@/modules/tasks/server/utils";

import {
  collectReplacedFileUrls,
  deleteAttachIfUnreferenced,
  upsertAttach,
} from "@/lib/attach";

function buildKpiRoleUpdate(
  kpi: {
    actualOwner: string | null;
    achievementOwner: number | null;
    actualChecker: string | null;
    achievementChecker: number | null;
    actualApprover: string | null;
    achievementApprover: number | null;
    fileUrl?: string | null;
  },
  role: EvaluationRole,
) {
  switch (role) {
    case "owner":
      return {
        actualOwner: kpi.actualOwner,
        achievementOwner: kpi.achievementOwner,
        fileUrl: kpi.fileUrl ?? null,
      };
    case "checker":
      return {
        actualChecker: kpi.actualChecker,
        achievementChecker: kpi.achievementChecker,
      };
    case "approver":
      return {
        actualApprover: kpi.actualApprover,
        achievementApprover: kpi.achievementApprover,
      };
  }
}

export const kpiProcedure = createTRPCRouter({
  getInfo: protectedProcedure
    .input(
      z.object({
        year: z.number(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const employeeId = ctx.user.username;

      const [form, windows] = await Promise.all([
        db.form.findFirst({
          where: {
            type: FormType.KPI,
            year: input.year,
            employeeId,
          },
          include: {
            tasks: true,
            kpis: true,
          },
        }),
        getWindows(input.year, FormType.KPI),
      ]);

      const kpis = form?.kpis ?? [];
      const weights = kpis.map((kpi) => Number(kpi.weight));

      const chartSeries = [
        { label: "Employee", key: "achievementOwner" },
        { label: "Evaluator 1", key: "achievementChecker" },
        { label: "Evaluator 2", key: "achievementApprover" },
      ] as const;

      return {
        windows: {
          draft: windows[Period.IN_DRAFT] ?? null,
          evaluation: windows[Period.EVALUATION] ?? null,
        },
        task: {
          draft: form?.tasks.find(
            (t) =>
              (t.context as { period: Period })?.period === Period.IN_DRAFT,
          ),
          evaluation: form?.tasks.find(
            (t) =>
              (t.context as { period: Period })?.period === Period.EVALUATION,
          ),
        },
        chart: chartSeries.map(({ label, key }) => ({
          label,
          score: formatDecimal(
            calculateSumAchievement(
              kpis.map((kpi) => kpi[key] ?? 0),
              weights,
            ),
          ),
        })),
      };
    }),
  getOne: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        period: z.enum(Period),
      }),
    )
    .query(async ({ input, ctx }) => {
      const kpi = await db.form.findFirst({
        where: {
          id: input.id,
          tasks: {
            some: {
              context: {
                path: ["period"],
                equals: input.period,
              },
            },
          },
        },
        include: {
          tasks: {
            include: taskChainInclude,
          },
          kpis: {
            orderBy: {
              order: "asc",
            },
          },
          overallComments: true,
        },
      });

      if (!kpi) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const kpiWithComments = await db.comment.findMany({
        where: {
          connectId: {
            in: kpi.kpis.map((kpi) => kpi.id),
          },
        },
        include: {
          employee: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      });

      // แปลง Prisma Decimal/Date เป็น plain values (superjson ไม่รองรับ Decimal
      // และฝั่ง client คาดหวังค่าจาก JSON round-trip อยู่แล้ว)
      const { form: plain, comments: plainComments } = JSON.parse(
        JSON.stringify({ form: kpi, comments: kpiWithComments }),
      ) as {
        form: typeof kpi;
        comments: typeof kpiWithComments;
      };

      const commentsByKpiId = groupByConnectId(plainComments);

      const kpisWithComments = plain.kpis.map((kpi) => ({
        ...kpi,
        comments: commentsByKpiId[kpi.id] || [],
      }));

      const task = plain.tasks.find(
        (t) => (t.context as { period?: Period })?.period === input.period,
      );

      if (!task) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const chain = getApprovalChain(task);
      const permission = buildPermissionContext(ctx.user.username, chain, task.status);

      let role = getUserRole(permission);

      // Admin เปิดฟอร์มของพนักงานได้ในบทบาท owner (แก้ไขแทนตามคำร้องขอ)
      if (!role && ctx.user.role === UserRole.ADMIN) {
        role = "owner";
        permission.employeeId = chain.ownerId;
      }

      if (!role) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const overallComment = plain.overallComments.find(
        (c) => c.period === input.period,
      ) ?? null;

      return {
        form: {
          ...plain,
          kpis: kpisWithComments,
          overallComment,
          tasks: withTaskChain(task, chain),
        },
        permission: {
          ...permission,
          role,
        },
      };
    }),
  create: protectedProcedure
    .input(
      z.object({
        formId: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      await assertFormOwner(input.formId, ctx.user.username);

      const lastKpi = await db.kpiEvaluation.findFirst({
        where: {
          formId: input.formId,
        },
        orderBy: {
          order: "desc",
        },
      });

      const nextOrder = lastKpi ? lastKpi.order + 100 : 100;

      const kpi = await db.kpiEvaluation.create({
        data: {
          formId: input.formId,
          order: nextOrder,
        },
      });

      return { id: kpi.id };
    }),
  createTask: protectedProcedure
    .input(
      z.object({
        year: z.number(),
        period: z.enum(Period),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const approval = await db.approval.findUnique({
        where: { employeeId: ctx.user.username },
      });

      if (!approval?.approverId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Approval chain not configured for this employee",
        });
      }

      const windowOpen = await isWindowOpen(input.year, FormType.KPI, input.period);

      if (!windowOpen && process.env.NODE_ENV !== "development") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This evaluation window is currently closed",
        });
      }

      const existingForm = await db.form.findFirst({
        where: {
          type: FormType.KPI,
          year: input.year,
          employeeId: ctx.user.username,
        },
        include: {
          competencyRecords: true,
          cultureRecords: true,
        },
      });

      if (existingForm) {
        await db.task.create({
          data: {
            id: generateTaskId(),
            ownerId: ctx.user.username,
            approvalId: approval.id,
            formId: existingForm.id,
            status: Status.IN_DRAFT,
            context: {
              period: input.period,
            },
          },
        });

        return { id: existingForm.id };
      }

      const form = await db.form.create({
        data: {
          employeeId: ctx.user.username,
          type: FormType.KPI,
          year: input.year,
          tasks: {
            create: {
              id: generateTaskId(),
              ownerId: ctx.user.username,
              approvalId: approval.id,
              status: Status.IN_DRAFT,
              context: {
                period: input.period,
              },
            },
          },
        },
      });

      return { id: form.id };
    }),
  createBulk: protectedProcedure
    .input(
      z.object({
        formId: z.string(),
        kpis: z.array(kpiUploadSchema),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      await assertFormOwner(input.formId, ctx.user.username);

      const lastKpi = await db.kpiEvaluation.findFirst({
        where: {
          formId: input.formId,
        },
        orderBy: {
          order: "desc",
        },
      });

      const baseOrder = lastKpi ? lastKpi.order : 0;

      await db.$transaction(async (tx) => {
        await tx.kpiEvaluation.createMany({
          data: input.kpis.map((kpi, index) => ({
            ...kpi,
            formId: input.formId,
            category: kpi.category as KpiCategory,
            order: baseOrder + (index + 1) * 100,
          })),
        });

        await tx.form.update({
          where: {
            id: input.formId,
          },
          data: {
            updatedAt: new Date(),
          }
        })
      });

      return { success: true };
    }),
  updateBulk: protectedProcedure
    .input(
      z.object({
        kpis: z.array(kpiDefinitionInputSchema),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      if (input.kpis.length === 0) return { success: true };

      const owningKpis = await db.kpiEvaluation.findMany({
        where: { id: { in: input.kpis.map((kpi) => kpi.id) } },
        select: { formId: true },
      });
      const formIds = [...new Set(owningKpis.map((kpi) => kpi.formId))];
      await Promise.all(formIds.map((formId) => assertFormOwner(formId, ctx.user.username)));

      await db.$transaction(
        input.kpis.map((kpi) => {
          const { id, ...data } = kpi;

          return db.kpiEvaluation.update({
            where: { id },
            data: normalizeEmptyStringToNull(data),
          });
        }),
      );

      return { success: true };
    }),
  evaluate: protectedProcedure
    .input(
      z.object({
        formId: z.string(),
        period: z.enum(Period),
        kpis: z.array(kpiEvaluationSchema.omit({ role: true })),
        overallComments: overallCommentFieldsSchema,
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { role } = await requireTaskRole(
        input.formId,
        input.period,
        ctx.user.username,
        ["write"],
      );

      const overallCommentUpdate = buildOverallCommentRoleUpdate(input.overallComments, role);

      await db.overallComment.upsert({
        where: {
          formId_period: {
            formId: input.formId,
            period: input.period,
          },
        },
        create: {
          formId: input.formId,
          period: input.period,
          ...overallCommentUpdate,
        },
        update: overallCommentUpdate,
      });

      if (input.kpis.length === 0) return { success: true };

      const existingKpis = await db.kpiEvaluation.findMany({
        where: { id: { in: input.kpis.map((kpi) => kpi.id) } },
        select: { id: true, fileUrl: true },
      });
      const oldUrlById = new Map(existingKpis.map((kpi) => [kpi.id, kpi.fileUrl]));

      await Promise.all(
        input.kpis.map(async (kpi) => {
          const data = buildKpiRoleUpdate(kpi, role);
          const fileUrl = "fileUrl" in data ? data.fileUrl : null;

          if (fileUrl != null) {
            await upsertAttach(db, fileUrl, ctx.user.username);
          }

          return db.kpiEvaluation.update({
            where: { id: kpi.id },
            data,
          });
        }),
      );

      if (role === "owner") {
        const replacedUrls = collectReplacedFileUrls(
          input.kpis.map((kpi) => ({ id: kpi.id, fileUrl: kpi.fileUrl ?? null })),
          oldUrlById,
        );
        await Promise.all(replacedUrls.map((url) => deleteAttachIfUnreferenced(db, url)));
      }

      return { success: true };
    }),
  delete: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const existing = await db.kpiEvaluation.findUnique({
        where: { id: input.id },
        select: { formId: true },
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      await assertFormOwner(existing.formId, ctx.user.username);

      await db.$transaction([
        db.kpiEvaluation.delete({
          where: {
            id: input.id,
          },
        }),
        db.comment.deleteMany({
          where: {
            connectId: input.id,
          },
        }),
      ]);

      return { success: true };
    }),
  deleteKpiFile: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const existing = await db.kpiEvaluation.findUnique({
        where: { id: input.id },
        select: { fileUrl: true, formId: true },
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      await assertFormOwner(existing.formId, ctx.user.username);

      const kpi = await db.kpiEvaluation.update({
        where: {
          id: input.id,
        },
        data: {
          fileUrl: null,
        },
      });

      if (existing?.fileUrl) {
        await deleteAttachIfUnreferenced(db, existing.fileUrl);
      }

      return kpi;
    }),
  syncKpiAttach: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        fileUrl: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const existing = await db.kpiEvaluation.findUnique({
        where: { id: input.id },
        select: { fileUrl: true, formId: true },
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      await assertFormOwner(existing.formId, ctx.user.username);

      await upsertAttach(db, input.fileUrl, ctx.user.username);

      await db.kpiEvaluation.update({
        where: { id: input.id },
        data: { fileUrl: input.fileUrl },
      });

      if (existing?.fileUrl && existing.fileUrl !== input.fileUrl) {
        await deleteAttachIfUnreferenced(db, existing.fileUrl);
      }

      return { success: true };
    }),
  export: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      await assertAnyRoleOnForm(input.id, ctx.user.username);

      const kpiForm = await db.form.findUnique({
        where: {
          id: input.id,
        },
        include: {
          kpis: true,
          employee: true,
          tasks: true,
        },
      });

      if (!kpiForm) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const data = formatKpiExport({
        ...kpiForm,
        kpis: kpiForm.kpis,
        employee: kpiForm.employee,
      });

      const file = exportExcel([
        {
          name: "Score Summary",
          data,
          columns,
        },
      ]);

      return {
        file,
        id: kpiForm.id,
      };
    }),
});
