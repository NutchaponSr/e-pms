import db from "@/lib/db";

import { z } from "zod";
import { TRPCError } from "@trpc/server";

import { FormType, Period, Status, UserRole } from "@/generated/prisma/enums";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";

import { buildPermissionContext, getUserRole } from "@/modules/tasks/permissions";
import { getApprovalChain, taskChainInclude, withTaskChain } from "@/modules/tasks/chain";
import { assertAnyRoleOnForm, assertFormOwner, requireTaskRole } from "@/modules/tasks/access";
import { competencyDefinitionSchema, cultureDefinitionSchema } from "@/modules/merit/schemas/definition";
import { calculateKpiScore, formatMeritExport, sumCompetencyByPeriod, sumCultureByPeriod, validateWeight } from "../utils";
import { Rank } from "@/types/employees";
import { comepetencyEvaluationSchema, cultureEvaluationSchema, overallCommentFieldsSchema } from "../schemas/evaluation";
import { exportExcel } from "@/lib/utils";
import { columns } from "../constant";
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

function buildCompetencyRoleUpdate(
  competency: {
    actualOwner: string | null;
    achievementOwner: number | null;
    actualChecker: string | null;
    achievementChecker: number | null;
    actualApprover: string | null;
    achievementApprover: number | null;
    fileUrl: string | null;
    result: string | null;
  },
  role: EvaluationRole,
) {
  switch (role) {
    case "owner":
      return {
        actualOwner: competency.actualOwner,
        levelOwner: competency.achievementOwner,
        fileUrl: competency.fileUrl,
        result: competency.result,
      };
    case "checker":
      return {
        actualChecker: competency.actualChecker,
        levelChecker: competency.achievementChecker,
      };
    case "approver":
      return {
        actualApprover: competency.actualApprover,
        levelApprover: competency.achievementApprover,
      };
  }
}

function buildCultureRoleUpdate(
  culture: {
    actualOwner: string | null;
    levelBehaviorOwner: number | null;
    actualChecker: string | null;
    levelBehaviorChecker: number | null;
    actualApprover: string | null;
    levelBehaviorApprover: number | null;
    fileUrl: string | null;
    result: string | null;
  },
  role: EvaluationRole,
) {
  switch (role) {
    case "owner":
      return {
        actualOwner: culture.actualOwner,
        levelBehaviorOwner: culture.levelBehaviorOwner,
        fileUrl: culture.fileUrl,
        result: culture.result,
      };
    case "checker":
      return {
        actualChecker: culture.actualChecker,
        levelBehaviorChecker: culture.levelBehaviorChecker,
      };
    case "approver":
      return {
        actualApprover: culture.actualApprover,
        levelBehaviorApprover: culture.levelBehaviorApprover,
      };
  }
}

/** ดึง fileUrl + meritFormId ของ evaluation เพื่อเช็คสิทธิ์เจ้าของฟอร์ม */
type EvaluationOwnership = { fileUrl: string | null; meritFormId: string };

async function findCompetencyEvaluationOwnership(
  id: string,
): Promise<EvaluationOwnership | null> {
  const existing = await db.competencyEvaluation.findUnique({
    where: { id },
    select: { fileUrl: true, competencyRecord: { select: { meritFormId: true } } },
  });

  return existing
    ? { fileUrl: existing.fileUrl, meritFormId: existing.competencyRecord.meritFormId }
    : null;
}

async function findCultureEvaluationOwnership(
  id: string,
): Promise<EvaluationOwnership | null> {
  const existing = await db.cultureEvaluation.findUnique({
    where: { id },
    select: { fileUrl: true, cultureRecord: { select: { meritFormId: true } } },
  });

  return existing
    ? { fileUrl: existing.fileUrl, meritFormId: existing.cultureRecord.meritFormId }
    : null;
}

async function deleteEvaluationFile<T>(opts: {
  id: string;
  username: string;
  findOwnership: (id: string) => Promise<EvaluationOwnership | null>;
  clearFileUrl: (id: string) => Promise<T>;
}): Promise<T> {
  const existing = await opts.findOwnership(opts.id);

  if (!existing) {
    throw new TRPCError({ code: "NOT_FOUND" });
  }

  await assertFormOwner(existing.meritFormId, opts.username);

  const record = await opts.clearFileUrl(opts.id);

  if (existing.fileUrl) {
    await deleteAttachIfUnreferenced(db, existing.fileUrl);
  }

  return record;
}

async function syncEvaluationAttach(opts: {
  id: string;
  fileUrl: string;
  username: string;
  findOwnership: (id: string) => Promise<EvaluationOwnership | null>;
  setFileUrl: (id: string, fileUrl: string) => Promise<unknown>;
}) {
  const existing = await opts.findOwnership(opts.id);

  if (!existing) {
    throw new TRPCError({ code: "NOT_FOUND" });
  }

  await assertFormOwner(existing.meritFormId, opts.username);

  await upsertAttach(db, opts.fileUrl, opts.username);

  await opts.setFileUrl(opts.id, opts.fileUrl);

  if (existing.fileUrl && existing.fileUrl !== opts.fileUrl) {
    await deleteAttachIfUnreferenced(db, existing.fileUrl);
  }

  return { success: true };
}

export const meritProcedure = createTRPCRouter({
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
            type: FormType.MERIT,
            year: input.year,
            employeeId,
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
        }),
        getWindows(input.year, FormType.MERIT),
      ]);

      return {
        windows: {
          draft: windows[Period.IN_DRAFT] ?? null,
          evaluation1st: windows[Period.EVALUATION_1ST] ?? null,
          evaluation2nd: windows[Period.EVALUATION_2ND] ?? null,
        },
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
            period: "Mid-year Evaluation",
            competency: {
              employee: sumCompetencyByPeriod(form?.competencyRecords ?? [], Period.EVALUATION_1ST, "levelOwner"),
              evaluator1: sumCompetencyByPeriod(form?.competencyRecords ?? [], Period.EVALUATION_1ST, "levelChecker"),
              evaluator2: sumCompetencyByPeriod(form?.competencyRecords ?? [], Period.EVALUATION_1ST, "levelApprover"),
            },
            culture: {
              employee: sumCultureByPeriod(form?.cultureRecords ?? [], Period.EVALUATION_1ST, "levelBehaviorOwner"),
              evaluator1: sumCultureByPeriod(form?.cultureRecords ?? [], Period.EVALUATION_1ST, "levelBehaviorChecker"),
              evaluator2: sumCultureByPeriod(form?.cultureRecords ?? [], Period.EVALUATION_1ST, "levelBehaviorApprover"),
            },
          },
          {
            period: "Year-end Evaluation",
            competency: {
              employee: sumCompetencyByPeriod(form?.competencyRecords ?? [], Period.EVALUATION_2ND, "levelOwner"),
              evaluator1: sumCompetencyByPeriod(form?.competencyRecords ?? [], Period.EVALUATION_2ND, "levelChecker"),
              evaluator2: sumCompetencyByPeriod(form?.competencyRecords ?? [], Period.EVALUATION_2ND, "levelApprover"),
            },
            culture: {
              employee: sumCultureByPeriod(form?.cultureRecords ?? [], Period.EVALUATION_2ND, "levelBehaviorOwner"),
              evaluator1: sumCultureByPeriod(form?.cultureRecords ?? [], Period.EVALUATION_2ND, "levelBehaviorChecker"),
              evaluator2: sumCultureByPeriod(form?.cultureRecords ?? [], Period.EVALUATION_2ND, "levelBehaviorApprover"),
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
            include: taskChainInclude,
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
            orderBy: {
              order: "asc",
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
            orderBy: {
              order: "asc",
            },
          },
          overallComments: true,
        },
      });

      if (!merit) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const [kpi, competencyWithComments, cultureWithComments] = await Promise.all([
        db.form.findFirst({
          where: {
            year: merit.year,
            employeeId: merit.employeeId,
            type: FormType.KPI,
          },
          include: {
            kpis: true,
          },
        }),
        db.comment.findMany({
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
        }),
        db.comment.findMany({
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
        }),
      ]);

      // แปลง Prisma Decimal/Date เป็น plain values (superjson ไม่รองรับ Decimal
      // และฝั่ง client คาดหวังค่า weight เป็น string อยู่แล้ว)
      const {
        merit: plain,
        competencyComments: plainCompetencyComments,
        cultureComments: plainCultureComments,
      } = JSON.parse(
        JSON.stringify({
          merit,
          competencyComments: competencyWithComments,
          cultureComments: cultureWithComments,
        }),
      ) as {
        merit: typeof merit;
        competencyComments: typeof competencyWithComments;
        cultureComments: typeof cultureWithComments;
      };

      const competencyCommentsByRecordId = groupByConnectId(plainCompetencyComments);
      const cultureCommentsByRecordId = groupByConnectId(plainCultureComments);

      const competencyRecordsWithComments = plain.competencyRecords.map((record) => ({
        ...record,
        comments: competencyCommentsByRecordId[record.id] || [],
      }));

      const cultureRecordsWithComments = plain.cultureRecords.map((record) => ({
        ...record,
        comments: cultureCommentsByRecordId[record.id] || [],
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

      const portion = validateWeight(chain.owner.rank as Rank);

      const overallComment = plain.overallComments.find(
        (c) => c.period === input.period,
      ) ?? null;

      return { 
        form: {
          ...plain,
          competencyRecords: competencyRecordsWithComments,
          cultureRecords: cultureRecordsWithComments,
          overallComment,
          tasks: withTaskChain(task, chain),
          kpi: (task.context as { period: Period })?.period === Period.EVALUATION_2ND
            ? calculateKpiScore(kpi?.kpis ?? [], portion)
            : 0
        },
        permission: {
          ...permission,
          role,
        },
      };
    }),
  createTask: protectedProcedure
    .input(
      z.object({
        year: z.number(),
        period: z.enum(Period),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const approval = await db.approval.findUnique({
        where: { employeeId: ctx.user.username },
      });

      if (!approval?.approverId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Approval chain not configured for this employee",
        });
      }

      const windowOpen = await isWindowOpen(input.year, FormType.MERIT, input.period);

      if (!windowOpen && process.env.NODE_ENV !== "development") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This evaluation window is currently closed",
        });
      }

      // หมายเหตุ: Year-end / evaluation ไม่ต้องรอ KPI Bonus เสร็จก่อนอีกต่อไป
      const [existingForm, cultures] = await Promise.all([
        db.form.findFirst({
          where: {
            type: FormType.MERIT,
            year: input.year,
            employeeId: ctx.user.username,
          },
          include: {
            competencyRecords: {
              orderBy: {
                order: "asc",
              },
            },
            cultureRecords: {
              orderBy: {
                order: "asc",
              },
            },
            tasks: true,
          },
        }),
        db.culture.findMany(),
      ]);

      // find existing merit task with the same period
      const existingMeritTask = existingForm?.tasks.find(
        (task) => (task.context as { period: Period })?.period === input.period,
      );

      let form = null;

      if (existingMeritTask) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Merit task already exists for this period",
        });
      }

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

        await db.$transaction(async (tx) => {
          const competencyRecordIds = existingForm.competencyRecords.map((record) => record.id);
          const cultureRecordIds = existingForm.cultureRecords.map((record) => record.id);

          const [existingCompetencyEvals, existingCultureEvals] = await Promise.all([
            competencyRecordIds.length > 0
              ? tx.competencyEvaluation.findMany({
                  where: {
                    competencyRecordId: { in: competencyRecordIds },
                    period: input.period,
                  },
                  select: { competencyRecordId: true },
                })
              : Promise.resolve([]),
            cultureRecordIds.length > 0
              ? tx.cultureEvaluation.findMany({
                  where: {
                    cultureRecordId: { in: cultureRecordIds },
                    period: input.period,
                  },
                  select: { cultureRecordId: true },
                })
              : Promise.resolve([]),
          ]);

          const existingCompetencyRecordIds = new Set(
            existingCompetencyEvals.map((evaluation) => evaluation.competencyRecordId),
          );
          const existingCultureRecordIds = new Set(
            existingCultureEvals.map((evaluation) => evaluation.cultureRecordId),
          );

          const competencyToCreate = existingForm.competencyRecords.filter(
            (record) => !existingCompetencyRecordIds.has(record.id),
          );
          const cultureToCreate = existingForm.cultureRecords.filter(
            (record) => !existingCultureRecordIds.has(record.id),
          );

          if (competencyToCreate.length > 0) {
            await tx.competencyEvaluation.createMany({
              data: competencyToCreate.map((record) => ({
                competencyRecordId: record.id,
                period: input.period,
              })),
            });
          }
          
          if (cultureToCreate.length > 0) {
            await tx.cultureEvaluation.createMany({
              data: cultureToCreate.map((record) => ({
                cultureRecordId: record.id,
                period: input.period,
              })),
            });
          }

          await tx.overallComment.upsert({
            where: {
              formId_period: {
                formId: existingForm.id,
                period: input.period,
              },
            },
            create: {
              formId: existingForm.id,
              period: input.period,
            },
            update: {},
          });
        });

        return { id: existingForm.id };
      } else {
        form = await db.form.create({
          data: {
            employeeId: ctx.user.username,
            type: FormType.MERIT,
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
            competencyRecords: {
              createMany: {
                data: Array.from({ length: 4 }, (_, index) => ({
                  order: (index + 1) * 100,
                }))
              },
            },
            cultureRecords: {
              createMany: {
                data: cultures.map((culture, index) => ({
                  cultureId: culture.id,
                  order: (index + 1) * 100,
                })),
              },
            },
            overallComments: {
              create: {
                period: input.period,
              },
            },
          },
        });

        await db.$transaction(async (tx) => {
          const createdForm = await tx.form.findUnique({
            where: { id: form!.id },
            include: { competencyRecords: true, cultureRecords: true },
          });

          if (!createdForm) return;

          await tx.competencyEvaluation.createMany({
            data: createdForm.competencyRecords.map((record) => ({
              competencyRecordId: record.id,
              period: input.period,
            })),
          });
          await tx.cultureEvaluation.createMany({
            data: createdForm.cultureRecords.map((record) => ({
              cultureRecordId: record.id,
              period: input.period,
            })),
          });
        });
      }

      return { id: form.id };
    }),
  definitionBulk: protectedProcedure
    .input(
      z.object({
        competencies: z.array(competencyDefinitionSchema),
        cultures: z.array(cultureDefinitionSchema),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      if (input.competencies.length === 0 && input.cultures.length === 0) return { success: true };

      const [owningCompetencyRecords, owningCultureRecords] = await Promise.all([
        input.competencies.length > 0
          ? db.competencyRecord.findMany({
              where: { id: { in: input.competencies.map((c) => c.id) } },
              select: { meritFormId: true },
            })
          : Promise.resolve([]),
        input.cultures.length > 0
          ? db.cultureRecord.findMany({
              where: { id: { in: input.cultures.map((c) => c.id) } },
              select: { meritFormId: true },
            })
          : Promise.resolve([]),
      ]);
      const formIds = [
        ...new Set([
          ...owningCompetencyRecords.map((r) => r.meritFormId),
          ...owningCultureRecords.map((r) => r.meritFormId),
        ]),
      ];
      await Promise.all(formIds.map((formId) => assertFormOwner(formId, ctx.user.username)));

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
        formId: z.string(),
        period: z.enum(Period),
        competencies: z.array(comepetencyEvaluationSchema.omit({ role: true })),
        cultures: z.array(cultureEvaluationSchema.omit({ role: true })),
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

      if (input.competencies.length === 0 && input.cultures.length === 0) {
        return { success: true };
      }

      const competencyIds = input.competencies.flatMap((competency) =>
        competency.id ? [competency.id] : [],
      );
      const cultureIds = input.cultures.flatMap((culture) =>
        culture.id ? [culture.id] : [],
      );

      const [existingCompetencies, existingCultures] = await Promise.all([
        competencyIds.length > 0
          ? db.competencyEvaluation.findMany({
              where: { id: { in: competencyIds } },
              select: { id: true, fileUrl: true },
            })
          : Promise.resolve([]),
        cultureIds.length > 0
          ? db.cultureEvaluation.findMany({
              where: { id: { in: cultureIds } },
              select: { id: true, fileUrl: true },
            })
          : Promise.resolve([]),
      ]);

      const oldCompetencyUrlById = new Map(
        existingCompetencies.map((competency) => [competency.id, competency.fileUrl]),
      );
      const oldCultureUrlById = new Map(
        existingCultures.map((culture) => [culture.id, culture.fileUrl]),
      );

      const updateCompetency = async (competency: (typeof input.competencies)[number]) => {
        const data = buildCompetencyRoleUpdate(competency, role);
        const fileUrl = "fileUrl" in data ? data.fileUrl : null;

        if (fileUrl != null) {
          await upsertAttach(db, fileUrl, ctx.user.username);
        }

        return db.competencyEvaluation.update({
          where: { id: competency.id },
          data,
        });
      };

      const updateCulture = async (culture: (typeof input.cultures)[number]) => {
        const data = buildCultureRoleUpdate(culture, role);
        const fileUrl = "fileUrl" in data ? data.fileUrl : null;

        if (fileUrl != null) {
          await upsertAttach(db, fileUrl, ctx.user.username);
        }

        return db.cultureEvaluation.update({
          where: { id: culture.id },
          data,
        });
      };

      await Promise.all([
        ...input.competencies.flatMap((competency) =>
          competency.id ? [updateCompetency(competency)] : [],
        ),
        ...input.cultures.flatMap((culture) =>
          culture.id ? [updateCulture(culture)] : [],
        ),
      ]);

      if (role === "owner") {
        const replacedUrls = [
          ...collectReplacedFileUrls(input.competencies, oldCompetencyUrlById),
          ...collectReplacedFileUrls(input.cultures, oldCultureUrlById),
        ];
        await Promise.all(replacedUrls.map((url) => deleteAttachIfUnreferenced(db, url)));
      }

      return { success: true };
    }),
  deleteCompetencyFile: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) =>
      deleteEvaluationFile({
        id: input.id,
        username: ctx.user.username,
        findOwnership: findCompetencyEvaluationOwnership,
        clearFileUrl: (id) =>
          db.competencyEvaluation.update({
            where: { id },
            data: { fileUrl: null },
          }),
      }),
    ),
  deleteCultureFile: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) =>
      deleteEvaluationFile({
        id: input.id,
        username: ctx.user.username,
        findOwnership: findCultureEvaluationOwnership,
        clearFileUrl: (id) =>
          db.cultureEvaluation.update({
            where: { id },
            data: { fileUrl: null },
          }),
      }),
    ),
  syncCompetencyAttach: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        fileUrl: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) =>
      syncEvaluationAttach({
        id: input.id,
        fileUrl: input.fileUrl,
        username: ctx.user.username,
        findOwnership: findCompetencyEvaluationOwnership,
        setFileUrl: (id, fileUrl) =>
          db.competencyEvaluation.update({
            where: { id },
            data: { fileUrl },
          }),
      }),
    ),
  syncCultureAttach: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        fileUrl: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) =>
      syncEvaluationAttach({
        id: input.id,
        fileUrl: input.fileUrl,
        username: ctx.user.username,
        findOwnership: findCultureEvaluationOwnership,
        setFileUrl: (id, fileUrl) =>
          db.cultureEvaluation.update({
            where: { id },
            data: { fileUrl },
          }),
      }),
    ),
  export: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      await assertAnyRoleOnForm(input.id, ctx.user.username);

      const meritForm = await db.form.findUnique({
        where: {
          id: input.id,
          type: FormType.MERIT,
        },
        include: {
          competencyRecords: {
            include: {
              competency: true,
              competencyEvaluations: true,
            },
          },
          cultureRecords: {
            include: {
              culture: true,
              cultureEvaluations: true,
            },
          },
          employee: true,
          tasks: true,
        },
      });

      if (!meritForm) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const data = formatMeritExport({
        ...meritForm,
        employee: meritForm.employee,
      });

      const file = exportExcel([
        {
          name: "Merit Summary",
          data,
          columns,
        },
      ]);

      return {
        file,
        id: meritForm.id,
      };
    }),
});