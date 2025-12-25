import db from "@/lib/db";

import { z } from "zod";
import { TRPCError } from "@trpc/server";

import { FormType, Period } from "@/generated/prisma/enums";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";

import { buildPermissionContext, getUserRole } from "@/modules/tasks/permissions";
import { competencyDefinitionSchema, cultureDefinitionSchema } from "@/modules/merit/schemas/definition";
import { sumCompetencyByPeriod, sumCultureByPeriod, validateWeight } from "../utils";
import { Rank } from "@/types/employees";
import { comepetencyEvaluationSchema, cultureEvaluationSchema } from "../schemas/evaluation";
import { competencyUploadSchema, cultureUploadSchema } from "../schemas/upload";
import { PERIOD_LABELS } from "@/modules/tasks/constant";

export const meritProcedure = createTRPCRouter({
  getInfo: protectedProcedure
    .input(
      z.object({
        year: z.number(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const form = await db.form.findFirst({
        where: {
          type: FormType.MERIT,
          year: input.year,
          tasks: {
            some: {
              ownerId: ctx.user.username,
            },
          },
        },
        include: {
          tasks: true,
          competencyRecords: {
            include: {
              competencyEvaluations: true,
            },
          },
          cultureRecords: {
            include: {
              cultureEvaluations: true,
            },
          },
        },
      });

      return {
        task: {
          draft: form?.tasks.find(
            (t) =>
              (t.context as { period: Period })?.period === Period.IN_DRAFT,
          ),
          evaluation1st: form?.tasks.find(
            (t) =>
              (t.context as { period: Period })?.period ===
              Period.EVALUATION_1ST,
          ),
          evaluation2nd: form?.tasks.find(
            (t) =>
              (t.context as { period: Period })?.period ===
              Period.EVALUATION_2ND,
          ),
        },
        chart: [
          {
            period: PERIOD_LABELS[Period.EVALUATION_1ST],
            competency: {
              owner: sumCompetencyByPeriod(form?.competencyRecords ?? [], Period.EVALUATION_1ST, "levelOwner"),
              checker: sumCompetencyByPeriod(form?.competencyRecords ?? [], Period.EVALUATION_1ST, "levelChecker"),
              approver: sumCompetencyByPeriod(form?.competencyRecords ?? [], Period.EVALUATION_1ST, "levelApprover"),
            },
            culture: {
              owner: sumCultureByPeriod(form?.cultureRecords ?? [], Period.EVALUATION_1ST, "levelBehaviorOwner"),
              checker: sumCultureByPeriod(form?.cultureRecords ?? [], Period.EVALUATION_1ST, "levelBehaviorChecker"),
              approver: sumCultureByPeriod(form?.cultureRecords ?? [], Period.EVALUATION_1ST, "levelBehaviorApprover"),
            },
          },
          {
            period: PERIOD_LABELS[Period.EVALUATION_2ND],
            competency: {
              owner: sumCompetencyByPeriod(form?.competencyRecords ?? [], Period.EVALUATION_2ND, "levelOwner"),
              checker: sumCompetencyByPeriod(form?.competencyRecords ?? [], Period.EVALUATION_2ND, "levelChecker"),
              approver: sumCompetencyByPeriod(form?.competencyRecords ?? [], Period.EVALUATION_2ND, "levelApprover"),
            },
            culture: {
              owner: sumCultureByPeriod(form?.cultureRecords ?? [], Period.EVALUATION_2ND, "levelBehaviorOwner"),
              checker: sumCultureByPeriod(form?.cultureRecords ?? [], Period.EVALUATION_2ND, "levelBehaviorChecker"),
              approver: sumCultureByPeriod(form?.cultureRecords ?? [], Period.EVALUATION_2ND, "levelBehaviorApprover"),
            },
          }
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
      const merit = await db.form.findFirst({
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
          competencyRecords: {
            include: {
              competencyEvaluations: {
                orderBy: {
                  createdAt: "asc",
                },
              },
              competency: true,
            },
          },
          cultureRecords: {
            include: {
              cultureEvaluations: {
                orderBy: {
                  createdAt: "asc",
                },
              },
              culture: true,
            },
          },
        },
      });

      if (!merit) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const kpi = await db.form.findFirst({
        where: {
          year: merit.year,
          type: FormType.KPI,
        },
        include: {
          kpis: true,
        },
      });

      const competencyWithComments = await db.comment.findMany({
        where: {
          connectId: {
            in: merit.competencyRecords.map((record) => record.id),
          },
        },
        include: {
          employee: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      });

      const cultureWithComments = await db.comment.findMany({
        where: {
          connectId: {
            in: merit.cultureRecords.map((record) => record.id),
          },
        },
        include: {
          employee: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      });

      const plain = JSON.parse(JSON.stringify(merit)) as typeof merit;
      const plainCompetencyComments = JSON.parse(
        JSON.stringify(competencyWithComments),
      ) as typeof competencyWithComments;
      const plainCultureComments = JSON.parse(
        JSON.stringify(cultureWithComments),
      ) as typeof cultureWithComments;

      const plainCompetencyWithCommentsByRecordId = plainCompetencyComments.reduce((acc, comment) => {
        if (!acc[comment.connectId]) {
          acc[comment.connectId] = [];
        }
        acc[comment.connectId].push(comment);
        return acc;
      }, {} as Record<string, typeof plainCompetencyComments>);

      const plainCultureWithCommentsByRecordId = plainCultureComments.reduce((acc, comment) => {
        if (!acc[comment.connectId]) {
          acc[comment.connectId] = [];
        }
        acc[comment.connectId].push(comment);
        return acc;
      }, {} as Record<string, typeof plainCultureComments>);

      const competencyRecordsWithComments = plain.competencyRecords.map((record, index) => ({
        ...record,
        order: index + 1,
        comments: plainCompetencyWithCommentsByRecordId[record.id] || [],
      }));

      const cultureRecordsWithComments = plain.cultureRecords.map((record, index) => ({
        ...record,
        order: index + 1,
        comments: plainCultureWithCommentsByRecordId[record.id] || [],
      }));

      const task = plain.tasks.find(
        (t) => (t.context as { period?: Period })?.period === input.period,
      );

      if (!task) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const permission = buildPermissionContext(ctx.user.username, task);
      const portion = validateWeight(task.owner.rank as Rank);

      return { 
        form: {
          ...plain,
          competencyRecords: competencyRecordsWithComments,
          cultureRecords: cultureRecordsWithComments,
          tasks: task,
          kpi: merit.period === Period.EVALUATION_2ND
            ? (() => {
              const sum = kpi?.kpis.reduce((acc, comp, idx) => {
                const level = Number(comp.achievementApprover ?? 0);
                const weight = Number(comp.weight ?? 0);

                return acc + (level / 100) * weight;
              }, 0) || 0;

              const res = (sum * 40) / portion > 40 ? 40 : (sum * 40) / portion;

              return res;
            })()
            : 0
        },
        permission: {
          ...permission,
          role: getUserRole(permission),
        },
      };
    }),
  definitionBulk: protectedProcedure
    .input(
      z.object({
        competencies: z.array(competencyDefinitionSchema),
        cultures: z.array(cultureDefinitionSchema),
      }),
    )
    .mutation(async ({ input }) => {
      if (input.competencies.length === 0 && input.cultures.length === 0) return { success: true };

      console.log(input);

      const normalizeEmptyStringToNull = <T extends Record<string, unknown>>(
        obj: T,
      ): T => {
        return Object.fromEntries(
          Object.entries(obj).map(([k, v]) => [k, v === "" ? null : v]),
        ) as T;
      };

      await Promise.all(input.competencies.map((competency) => {
          const { id, ...data } = competency;
          return db.competencyRecord.update({
            where: { id },
            data: normalizeEmptyStringToNull(data),
          });
        }));

      await Promise.all(input.cultures.map((culture) => {
          const { id, ...data } = culture;
          return db.cultureRecord.update({
            where: { id },
            data: {
              evidence: data.evidence,
            },
          });
        }));

      return { success: true };
    }),
  evaluateBulk: protectedProcedure
    .input(
      z.object({
        competencies: z.array(comepetencyEvaluationSchema.omit({ role: true })),
        cultures: z.array(cultureEvaluationSchema.omit({ role: true })),
      }),
    )
    .mutation(async ({ input }) => {
      if (input.competencies.length === 0 && input.cultures.length === 0) return { success: true };

      await Promise.all(
        input.competencies.map((competency) => {
          const { id, achievementOwner, achievementChecker, achievementApprover, ...data } = competency;
          return db.competencyEvaluation.update({
            where: { id },
            data: {
              ...data,
              levelOwner: achievementOwner,
              levelChecker: achievementChecker,
              levelApprover: achievementApprover,
            },
          });
        }));

      await Promise.all(input.cultures.map((culture) => {
        const { id, ...data } = culture;
        return db.cultureEvaluation.update({
          where: { id },
          data,
        });
      }));

      return { success: true };
    }),
  deleteCompetencyFile: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      const record = await db.competencyEvaluation.update({
        where: {
          id: input.id,
        },
        data: {
          fileUrl: null,
        },
      });

      return record;
    }),
  deleteCultureFile: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      const record = await db.cultureEvaluation.update({
        where: {
          id: input.id,
        },
        data: {
          fileUrl: null,
        },
      });

      return record;
    }),
});