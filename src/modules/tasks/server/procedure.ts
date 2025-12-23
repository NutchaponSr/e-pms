import z from "zod/v4";
import path from "path";
import db from "@/lib/db";

import { readCSV } from "@/seeds/lib/utils";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { FormType, Period, Status } from "@/generated/prisma/enums";

import { generateTaskId } from "@/modules/tasks/utils";
import { TRPCError } from "@trpc/server";
import { buildPermissionContext, getUserRole } from "../permissions";

interface ApprovalCVSProps {
  employeeId: string;
  checker?: string;
  approver: string;
}

export const taskProcedure = createTRPCRouter({
  getOne: protectedProcedure
    .input(
      z.object({
        year: z.number(),
        type: z.enum(FormType),
      }),
    )
    .query(async ({ input, ctx }) => {
      const form = await db.form.findFirst({
        where: {
          type: input.type,
          year: input.year,
          tasks: {
            some: {
              ownerId: ctx.user.username,
            },
          },
        },
        include: {
          tasks: true,
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
      };
    }),
  todo: protectedProcedure
    .query(async ({ ctx }) => {
      const tasks = await db.task.findMany({
        where: {
          OR: [
            {
              status: Status.PENDING_CHECKER,
              checkerId: ctx.user.username,
            },
            {
              status: Status.PENDING_APPROVER,
              approverId: ctx.user.username,
            },
            {
              status: Status.REJECTED_BY_CHECKER,
              ownerId: ctx.user.username,
            },
            {
              status: Status.REJECTED_BY_APPROVER,
              ownerId: ctx.user.username,
            },
          ],
        },
        include: {
          form: true,
          owner: true,
        },
        orderBy: {
          updatedAt: "desc",
        },
      });

      return tasks.map((task) => ({
        taskId: task.id,
        formType: task.form.type,
        status: task.status,
        formId: task.form.id,
        year: task.form.year,
        owner: task.owner.name,
        updatedAt: task.updatedAt,
        period: typeof task.context === 'object' && task.context !== null && 'period' in task.context
          ? (task.context as { period?: Period }).period
          : undefined,
      }));
    }),
  create: protectedProcedure
    .input(
      z.object({
        year: z.number(),
        type: z.enum(FormType),
        period: z.enum(Period),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const file = path.join(process.cwd(), "src/data", "approval.csv");

      const record = readCSV<ApprovalCVSProps>(file).find(
        (r) => r.employeeId === ctx.user.username,
      );

      if (!record) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Record not found",
        });
      }

      const { existingForm, cultures } = await db.$transaction(async (tx) => {
        const existingForm = await tx.form.findFirst({
          where: {
            type: input.type,
            year: input.year,
            tasks: {
              some: {
                ownerId: ctx.user.username,
              },
            },
          },
        });
        const cultures = await tx.culture.findMany();

        return { existingForm, cultures };
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

      if (input.type === FormType.MERIT) {
        form = await db.form.create({
          data: {
            type: input.type,
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
            competencyRecords: {
              createMany: {
                data: Array.from({ length: 4 }, (_, index) => ({}))
              },
            },
            cultureRecords: {
              createMany: {
                data: cultures.map((culture) => ({
                  cultureId: culture.id,
                })),
              },
            },
          },
        });
      } else {
        form = await db.form.create({
          data: {
            type: input.type,
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
      }

      return { id: form.id };
    }),
  startWorkflow: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      const task = await db.task.findUnique({
        where: {
          id: input.id,
        },
      });

      if (!task) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Record not found",
        });
      }

      const hasChecker = task.checkerId !== null;

      await db.task.update({
        where: {
          id: input.id,
        },
        data: {
          status: hasChecker ? Status.PENDING_CHECKER : Status.PENDING_APPROVER,
        },
      });

      // TODO: Send email to checker and approver

      return { success: true };
    }),
  confirmation: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        approved: z.boolean(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const task = await db.task.findUnique({
        where: { 
          id: input.id 
        },
      });

      if (!task) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Record not found",
        });
      }

      const permissionContext = buildPermissionContext(ctx.user.username, task);
      const role = getUserRole(permissionContext);

      let res = null;

      if (role === "checker") {
        if (input.approved) {
          res = await db.task.update({
            where: {
              id: input.id,
            },
            data: {
              status: Status.PENDING_APPROVER,
              checkedAt: new Date(),
            },
            include: {
              checker: true,
              approver: true,
              owner: true,
            },
          });
        } else {
          res = await db.task.update({
            where: {
              id: input.id,
            },
            data: {
              status: Status.REJECTED_BY_CHECKER,
            },
          });
        }
      } else if (role === "approver") {
        if (input.approved) {
          res = await db.task.update({
            where: {
              id: input.id,
            },
            data: {
              status: Status.DONE,
              approvedAt: new Date(),
            },
            include: {
              checker: true,
              approver: true,
              owner: true,
            },
          });
        } else {
          res = await db.task.update({
            where: {
              id: input.id,
            },
            data: {
              status: Status.REJECTED_BY_APPROVER,
            },
            include: {
              owner: true,
              checker: true,
              approver: true,
            },
          });
        }
      }

      if (!res) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update task",
        });
      }

      // TODO: Send email to owner, checker, and approver

      return { 
        id: res.formId,
      }
    })
});
