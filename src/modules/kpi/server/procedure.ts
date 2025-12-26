import path from "path";
import db from "@/lib/db";

import { z } from "zod";

import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";

import { FormType, KpiCategory, Period, Status } from "@/generated/prisma/enums";

import { kpiUploadSchema } from "@/modules/kpi/schema/upload";
import { kpiEvaluationSchema } from "@/modules/kpi/schema/evaluation";
import { kpiDefinitionSchema } from "@/modules/kpi/schema/definition";
import { buildPermissionContext, getUserRole } from "@/modules/tasks/permissions";
import { calculateSumAchievement, formatKpiExport } from "../utils";
import { exportExcel, formatDecimal } from "@/lib/utils";
import { columns } from "../constants";
import { readCSV } from "@/seeds/lib/utils";
import { generateTaskId } from "@/modules/tasks/utils";

interface ApprovalCSVProps {
  employeeId: string;
  checker?: string;
  approver: string;
}

export const kpiProcedure = createTRPCRouter({
  getInfo: protectedProcedure
    .input(
      z.object({
        year: z.number(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const form = await db.form.findFirst({
        where: {
          type: FormType.KPI,
          year: input.year,
          employeeId: ctx.user.username,
        },
        include: {
          tasks: true,
          kpis: true,
        },
      });

      return {
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
        chart: [
          {
            label: "Owner",
            score: formatDecimal(calculateSumAchievement(
              form?.kpis.map((kpi) => kpi.achievementOwner ?? 0) ?? [], 
              form?.kpis.map((kpi) => Number(kpi.weight)) ?? []
            )),
          },
          {
            label: "Checker",
            score: formatDecimal(calculateSumAchievement(
              form?.kpis.map((kpi) => kpi.achievementChecker ?? 0) ?? [], 
              form?.kpis.map((kpi) => Number(kpi.weight)) ?? []
            )),
          },
          {
            label: "Approver",
            score: formatDecimal(calculateSumAchievement(
              form?.kpis.map((kpi) => kpi.achievementApprover ?? 0) ?? [], 
              form?.kpis.map((kpi) => Number(kpi.weight)) ?? []
            )),
          },
        ]
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
            include: {
              owner: true,
              checker: true,
              approver: true,
            },
          },
          kpis: {
            orderBy: {
              order: "asc",
            },
          },
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

      const plain = JSON.parse(JSON.stringify(kpi)) as typeof kpi;
      const plainComments = JSON.parse(
        JSON.stringify(kpiWithComments),
      ) as typeof kpiWithComments;

      const commentsByKpiId = plainComments.reduce(
        (acc, comment) => {
          if (!acc[comment.connectId]) {
            acc[comment.connectId] = [];
          }
          acc[comment.connectId].push(comment);
          return acc;
        },
        {} as Record<string, typeof plainComments>,
      );

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

      const permission = buildPermissionContext(ctx.user.username, task);

      return {
        form: {
          ...plain,
          kpis: kpisWithComments,
          tasks: task,
        },
        permission: {
          ...permission,
          role: getUserRole(permission),
        },
      };
    }),
  create: protectedProcedure
    .input(
      z.object({
        formId: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
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
      const file = path.join(process.cwd(), "src/data", "approval.csv");

      const record = readCSV<ApprovalCSVProps>(file).find(
        (r) => r.employeeId === ctx.user.username,
      );

      if (!record) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Record not found",
        });
      }

      const existingForm = await db.form.findFirst({
        where: {
          type: FormType.KPI,
          year: input.year,
          tasks: {
            some: {
              ownerId: ctx.user.username,
            },
          },
        },
        include: {
          competencyRecords: true,
          cultureRecords: true,
        },
      });

      const checkerId = record?.checker && record.checker.trim() !== "" 
        ? record.checker 
        : null;

      let form = null;

      if (existingForm) {
        await db.task.create({
          data: {
            id: generateTaskId(),
            ownerId: ctx.user.username,
            checkerId,
            approverId: record.approver,
            formId: existingForm.id,
            status: Status.IN_DRAFT,
            context: {
              period: input.period,
            },
          },
        });

        return { id: existingForm.id };
      }

      form = await db.form.create({
        data: {
          employeeId: ctx.user.username,
          type: FormType.KPI,
          year: input.year,
          tasks: {
            create: {
              id: generateTaskId(),
              ownerId: ctx.user.username,
              checkerId,
              approverId: record.approver,
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
    .mutation(async ({ input }) => {
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
        kpis: z.array(kpiDefinitionSchema.omit({ year: true })),
      }),
    )
    .mutation(async ({ input }) => {
      if (input.kpis.length === 0) return { success: true };

      const normalizeEmptyStringToNull = <T extends Record<string, unknown>>(
        obj: T,
      ): T => {
        return Object.fromEntries(
          Object.entries(obj).map(([k, v]) => [k, v === "" ? null : v]),
        ) as T;
      };

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
        kpis: z.array(kpiEvaluationSchema.omit({ role: true }))
      }),
    )
    .mutation(async ({ input }) => {
      if (input.kpis.length === 0) return { success: true };

      await db.$transaction(
        input.kpis.map((kpi) => {
          const { id, ...data } = kpi;
          return db.kpiEvaluation.update({
            where: { id },
            data,
          });
        }),
      );

      return { success: true };
    }),
  delete: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      await db.kpiEvaluation.delete({
        where: {
          id: input.id,
        },
      });

      await db.comment.deleteMany({
        where: {
          connectId: input.id,
        },
      });

      return { success: true };
    }),
  deleteKpiFile: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      const kpi = await db.kpiEvaluation.update({
        where: {
          id: input.id,
        },
        data: {
          fileUrl: null,
        },
      });

      return kpi;
    }),
  export: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      const kpiForm = await db.form.findUnique({
        where: {
          id: input.id,
        },
        include: {
          kpis: true,
          tasks: {
            include: {
              owner: true,
            },
          },
        },
      });

      if (!kpiForm) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const data = formatKpiExport({
        ...kpiForm,
        kpis: kpiForm.kpis,
        employee: kpiForm.tasks[0].owner,
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
