import z from "zod/v4";
import db from "@/lib/db";

import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { FormType, Period, Status } from "@/generated/prisma/enums";

import { TRPCError } from "@trpc/server";

import { STATUSES } from "@/modules/tasks/constant";
import { getApprovalChain, taskChainInclude } from "@/modules/tasks/chain";
import { buildPermissionContext, canPerform, getUserRole } from "@/modules/tasks/permissions";

function emptyTrackerResult() {
  return {
    info: {
      total: 0,
      done: { bonus: 0, merit: 0 },
      notDone: { bonus: 0, merit: 0 },
      pending: 0,
    },
    employees: [],
  };
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
          employeeId: ctx.user.username,
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
              status: Status.WAITING_APPROVER_1,
              approval: { checkerId: ctx.user.username },
            },
            {
              status: Status.WAITING_APPROVER_2,
              approval: { approverId: ctx.user.username },
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
  startWorkflow: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const task = await db.task.findUnique({
        where: {
          id: input.id,
        },
        include: {
          ...taskChainInclude,
          form: true,
        },
      });

      if (!task) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Record not found",
        });
      }

      const chain = getApprovalChain(task);
      const role = getUserRole(buildPermissionContext(ctx.user.username, chain, task.status));

      if (role !== "owner" || !canPerform(role, ["start-workflow"], task.status)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "No permission to start this workflow",
        });
      }

      if (!chain.approverId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Approval chain not configured for this employee",
        });
      }

      const hasChecker = chain.checkerId !== null;

      const res = await db.task.update({
        where: {
          id: input.id,
        },
        data: {
          status: hasChecker ? Status.WAITING_APPROVER_1 : Status.WAITING_APPROVER_2,
        },
        include: {
          ...taskChainInclude,
          form: true,
        },
      });

      const next = getApprovalChain(res);

      return {
        id: res.id,
        toEmail: next.checker?.email || next.approver?.email,
        fromEmail: next.owner.email,
        checkerName: next.checker?.name || next.approver?.name || "",
        ownerName: next.owner.name,
        status: STATUSES[res.status],
        app: res.form.type,
        period: (res.context as { period: Period })?.period,
      };
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
          id: input.id,
        },
        include: {
          ...taskChainInclude,
          form: true,
        },
      });

      if (!task) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Record not found",
        });
      }

      const chain = getApprovalChain(task);
      const permissionContext = buildPermissionContext(ctx.user.username, chain, task.status);
      const role = getUserRole(permissionContext);

      if (!role || !canPerform(role, ["approve"], task.status)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "No permission to confirm this task",
        });
      }

      const taskInclude = {
        ...taskChainInclude,
        form: true,
      } as const;

      let res = null;

      if (role === "checker") {
        if (input.approved) {
          res = await db.task.update({
            where: {
              id: input.id,
            },
            data: {
              status: Status.WAITING_APPROVER_2,
              checkedAt: new Date(),
            },
            include: taskInclude,
          });
        } else {
          res = await db.task.update({
            where: {
              id: input.id,
            },
            data: {
              status: Status.IN_DRAFT,
            },
            include: taskInclude,
          });
        }
      } else if (role === "approver") {
        if (input.approved) {
          res = await db.task.update({
            where: {
              id: input.id,
            },
            data: {
              status: Status.COMPLETED,
              approvedAt: new Date(),
            },
            include: taskInclude,
          });
        } else {
          res = await db.task.update({
            where: {
              id: input.id,
            },
            data: {
              status: Status.IN_DRAFT,
            },
            include: taskInclude,
          });
        }
      }

      if (!res) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update task",
        });
      }

      const next = getApprovalChain(res);

      return {
        id: res.formId,
        owner: {
          email: next.owner.email,
          name: next.owner.name,
        },
        checker: {
          email: next.checker?.email,
          name: next.checker?.name ?? "",
        },
        approver: {
          email: next.approver?.email,
          name: next.approver?.name ?? "",
        },
        declinedBy: role === "checker" ? "Evaluator 1" : "Evaluator 2",
        status: STATUSES[res.status],
        app: res.form.type,
        approvedAt: res.approvedAt,
        checkedAt: res.checkedAt,
        isApproved: res.status === Status.COMPLETED,
        checkedBy: res.status === Status.WAITING_APPROVER_1 ? next.checker?.name : res.status === Status.WAITING_APPROVER_2 ? next.approver?.name : undefined,
        period: (res.context as { period: Period })?.period,
      };
    }),
  getManyByYear: protectedProcedure
    .input(
      z.object({
        year: z.number(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const employee = ctx.user.employee;
      if (!employee) {
        return emptyTrackerResult();
      }

      const subordinates = await db.approval.findMany({
        where: {
          OR: [{ checkerId: employee.id }, { approverId: employee.id }],
        },
        select: { employeeId: true },
      });

      const targetApproval = subordinates.map((record) => record.employeeId);

      if (targetApproval.length === 0) {
        return emptyTrackerResult();
      }

      const [forms, employees] = await Promise.all([
        db.form.findMany({
          where: {
            employeeId: {
              in: targetApproval,
            },
            year: {
              gte: input.year - 1,
              lte: input.year,
            },
          },
          include: {
            tasks: {
              orderBy: {
                updatedAt: "asc",
              },
            },
          },
        }),
        db.employee.findMany({
          where: {
            id: {
              in: targetApproval,
            },
          },
        }),
      ]);

      const groupFormsByOwner = (type: FormType) =>
        forms
          .filter((f) => f.type === type && f.tasks.length > 0)
          .reduce<Record<string, (typeof forms)[0][]>>((acc, form) => {
            const ownerId = form.employeeId;
            acc[ownerId] ??= [];
            acc[ownerId].push(form);
            return acc;
          }, {});

      const kpiFormsByEmployee = groupFormsByOwner(FormType.KPI);
      const meritFormsByEmployee = groupFormsByOwner(FormType.MERIT);

      // หา employee ที่ไม่มี form ใดๆ
      const employeesWithNoForm = employees.filter(
        (emp) =>
          !kpiFormsByEmployee[emp.id]?.length &&
          !meritFormsByEmployee[emp.id]?.length,
      );


      const kpiPending = forms.filter((f) => f.type === FormType.KPI)
        .flatMap((k) => k.tasks)
        .filter((t) => t.status === Status.WAITING_APPROVER_1 || t.status === Status.WAITING_APPROVER_2)
        .length;

      const meritPending = forms.filter((f) => f.type === FormType.MERIT)
        .flatMap((m) => m.tasks)
        .filter((t) => t.status === Status.WAITING_APPROVER_1 || t.status === Status.WAITING_APPROVER_2)
        .length;

      return {
        info: {
          total: employees.length,
          done: {
            bonus: forms.filter((f) => f.type === FormType.KPI && f.period === Period.EVALUATION).length,
            merit: forms.filter((f) => f.type === FormType.MERIT && f.period === Period.EVALUATION).length,
          },
          notDone: {
            bonus:
              forms.filter((f) => f.type === FormType.KPI && f.period !== Period.EVALUATION).length +
              employeesWithNoForm.length,
            merit:
              forms.filter((f) => f.type === FormType.MERIT && f.period !== Period.EVALUATION).length +
              employeesWithNoForm.length,
          },
          pending: kpiPending + meritPending,
        },
        employees: employees.map((employee) => {
          const employeeKpiForms = kpiFormsByEmployee[employee.id] || [];
          const employeeMeritForms = meritFormsByEmployee[employee.id] || [];

          // หา form ที่ตรงกับปีที่ต้องการ (prioritize current year)
          const kpiForm =
            employeeKpiForms.find((f) => f.year === input.year) ||
            employeeKpiForms[0] ||
            null;
          const meritForm =
            employeeMeritForms.find((f) => f.year === input.year) ||
            employeeMeritForms[0] ||
            null;

          // รวม tasks จาก form ทั้งหมด
          const allKpiTasks = employeeKpiForms.flatMap((f) => f.tasks);
          const allMeritTasks = employeeMeritForms.flatMap((f) => f.tasks);

          return {
            employee,
            form: {
              bonus: kpiForm
                ? {
                  ...kpiForm,
                  tasks: allKpiTasks,
                }
                : null,
              merit: meritForm
                ? {
                  ...meritForm,
                  tasks: allMeritTasks,
                }
                : null,
            },
          };
        }),
      };
    }),
});
