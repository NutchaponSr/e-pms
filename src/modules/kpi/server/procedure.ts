import db from "@/lib/db";

import { z } from "zod";

import { Period } from "@/generated/prisma/enums";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { kpiDefinitionSchema } from "../schema/definition";
import { TRPCError } from "@trpc/server";

export const kpiProcedure = createTRPCRouter({
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

      // Ensure we only return "plain" JSON-serializable objects (Next.js can't pass Prisma Decimal to client components)
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

      return {
        ...plain,
        kpis: kpisWithComments,
        tasks: plain.tasks.find(
          (t) => (t.context as { period?: Period })?.period === input.period,
        ),
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
});
