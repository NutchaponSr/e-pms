import z from "zod/v4";
import path from "path";
import db from "@/lib/db";

import { readCSV } from "@/seeds/lib/utils";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { FormType, Period, Status } from "@/generated/prisma/enums";

import { generateTaskId } from "@/modules/tasks/utils";
import { TRPCError } from "@trpc/server";
import { buildPermissionContext, getUserRole } from "../permissions";
import { formType, STATUSES } from "../constant";

interface ApprovalCSVProps {
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

      const res = await db.task.update({
        where: {
          id: input.id,
        },
        data: {
          status: hasChecker ? Status.PENDING_CHECKER : Status.PENDING_APPROVER,
        },
        include: {
          form: true,
          checker: true,
          approver: true,
          owner: true,
        },
      });

      return {
        id: res.id,
        toEmail: res.checker?.email || res.approver?.email,
        fromEmail: res.owner?.email,
        checkerName: res.checker?.name || res.approver?.name,
        ownerName: res.owner?.name,
        status: STATUSES[res.status],
        app: formType[res.form.type],
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
              form: true,
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
            include: {
              owner: true,
              checker: true,
              approver: true,
              form: true,
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
              form: true,
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
              form: true,
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

      return {
        id: res.formId,
        owner: {
          email: res.owner?.email,
          name: res.owner?.name,
        },
        checker: {
          email: res.checker?.email,
          name: res.checker?.name,
        },
        approver: {
          email: res.approver?.email,
          name: res.approver?.name,
        },
        status: STATUSES[res.status],
        app: formType[res.form.type],
        approvedAt: res.approvedAt,
        checkedAt: res.checkedAt,
        isApproved: res.status === Status.DONE,
        checkedBy: res.status === Status.REJECTED_BY_CHECKER ? res.checker?.name : res.status === Status.REJECTED_BY_APPROVER ? res.approver?.name : undefined,
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
      const approvalFile = path.join(process.cwd(), "src/data", "approval.csv");
      const approvalRecords = readCSV<ApprovalCSVProps>(approvalFile);

      const targetApproval = approvalRecords
        .filter(
          (f) =>
            f.checker === ctx.user.employee.id ||
            f.approver === ctx.user.employee.id,
        )
        .map((record) => record.employeeId);

      const [forms, employees] = await Promise.all([
        db.form.findMany({
          where: {
            AND: [
              {
                tasks: {
                  some: {
                    ownerId: {
                      in: targetApproval,
                    },
                  },
                },
              },
              {
                year: {
                  gte: input.year - 1,
                  lte: input.year,
                },
              },
            ],
          },
          include: {
            tasks: {
              orderBy: {
                updatedAt: "asc",
              },
              include: {
                owner: true,
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

      const kpiFormsByEmployee = forms.filter((f) => f.type === FormType.KPI).reduce<
        Record<string, (typeof forms)[0][]>
      >((acc, form) => {
        acc[form.tasks[0].ownerId] ??= [];
        acc[form.tasks[0].ownerId].push(form);
        return acc;
      }, {});

      const meritFormsByEmployee = forms.filter((f) => f.type === FormType.MERIT).reduce<
        Record<string, (typeof forms)[0][]>
      >((acc, form) => {
        acc[form.tasks[0].ownerId] ??= [];
        acc[form.tasks[0].ownerId].push(form);
        return acc;
      }, {});

      // หา employee ที่ไม่มี form ใดๆ
      const employeesWithNoForm = employees.filter(
        (emp) =>
          !kpiFormsByEmployee[emp.id]?.length &&
          !meritFormsByEmployee[emp.id]?.length,
      );
      
      
      const kpiPending = forms.filter((f) => f.type === FormType.KPI)
        .flatMap((k) => k.tasks)
        .filter((t) => t.status === Status.PENDING_CHECKER || t.status === Status.PENDING_APPROVER)
        .length;

      const meritPending = forms.filter((f) => f.type === FormType.MERIT)
        .flatMap((m) => m.tasks)
        .filter((t) => t.status === Status.PENDING_CHECKER || t.status === Status.PENDING_APPROVER)
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
