import db from "@/lib/db";

import { z } from "zod";

import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";

import { FormType, KpiCategory, Period } from "@/generated/prisma/enums";

import { kpiUploadSchema } from "@/modules/kpi/schema/upload";
import { kpiEvaluationSchema } from "@/modules/kpi/schema/evaluation";
import { kpiDefinitionSchema } from "@/modules/kpi/schema/definition";
import { buildPermissionContext, getUserRole } from "@/modules/tasks/permissions";
import { calculateSumAchievement } from "../utils";
import { formatDecimal } from "@/lib/utils";

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
          tasks: {
            some: {
              ownerId: ctx.user.username,
            },
          },
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
          kpis: true,
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
      const kpi = await db.kpiEvaluation.create({
        data: {
          formId: input.formId,
        },
      });

      return { id: kpi.id };
    }),
  createBulk: protectedProcedure
    .input(
      z.object({
        formId: z.string(),
        kpis: z.array(kpiUploadSchema),
      }),
    )
    .mutation(async ({ input }) => {
      await db.$transaction(async (tx) => {
        await tx.kpiEvaluation.createMany({
          data: input.kpis.map((kpi) => ({
            ...kpi,
            formId: input.formId,
            category: kpi.category as KpiCategory,
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
});
