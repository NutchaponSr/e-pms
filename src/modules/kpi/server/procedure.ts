import db from "@/lib/db";

import { z } from "zod";

import { Period } from "@/generated/prisma/enums";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { kpiDefinitionSchema } from "../schema/definition";

export const kpiProcedure = createTRPCRouter({
  getOne: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        period: z.enum(Period),
      }),
    )
    .query(async ({ input }) => {
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

      if (!kpi) return null;
      
      const plain = JSON.parse(JSON.stringify(kpi)) as typeof kpi;

      return {
        ...plain,
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
      })
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
    })
});
