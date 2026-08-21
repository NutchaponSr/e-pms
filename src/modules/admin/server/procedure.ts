import db from "@/lib/db";

import { z } from "zod";
import { TRPCError } from "@trpc/server";

import { auth } from "@/lib/auth";
import { exportExcel } from "@/lib/utils";
import { adminProcedure, createTRPCRouter } from "@/trpc/init";
import { FormType, Period, Status } from "@/generated/prisma/enums";

import { formatKpiExport } from "@/modules/kpi/utils";
import { columns as kpiColumns } from "@/modules/kpi/constants";
import { formatMeritExport } from "@/modules/merit/utils";
import { columns as meritColumns } from "@/modules/merit/constant";
import { getApprovalChain, taskChainInclude } from "@/modules/tasks/chain";
import { parseMonthDay, WINDOW_DEFINITIONS } from "@/modules/tasks/windows";

const FALLBACK_EMAIL = "t@somboon.co.th";

export const adminRouter = createTRPCRouter({
  // ---------- Phase 2: Employee management ----------
  getEmployees: adminProcedure.query(async () => {
    const employees = await db.employee.findMany({
      orderBy: { id: "asc" },
      include: {
        user: {
          select: { id: true, banned: true, banReason: true, role: true },
        },
        approval: {
          select: { checkerId: true, approverId: true },
        },
      },
    });

    return employees.map(({ approval, ...employee }) => ({
      ...employee,
      checkerId: approval?.checkerId ?? null,
      approverId: approval?.approverId ?? null,
    }));
  }),
  createEmployee: adminProcedure
    .input(
      z.object({
        id: z.string().trim().min(1).max(10),
        name: z.string().trim().min(1),
        email: z.string().trim().optional(),
        position: z.string().trim().min(1),
        division: z.string().trim().min(1),
        level: z.string().trim().min(1),
        rank: z.string().trim().min(1),
        department: z.string().trim().min(1),
        password: z.string().min(8),
      }),
    )
    .mutation(async ({ input }) => {
      const existing = await db.employee.findUnique({
        where: { id: input.id },
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `Employee ${input.id} already exists`,
        });
      }

      await db.employee.create({
        data: {
          id: input.id,
          name: input.name,
          email: input.email || null,
          position: input.position,
          division: input.division,
          level: input.level,
          rank: input.rank,
          department: input.department,
        },
      });

      try {
        await auth.api.signUpEmail({
          body: {
            email: input.email || FALLBACK_EMAIL,
            password: input.password,
            name: input.name,
            username: input.id,
          },
        });
      } catch (error) {
        // ถ้าสร้าง user ไม่สำเร็จ ให้ rollback employee เพื่อไม่ให้ค้างครึ่งเดียว
        await db.employee.delete({ where: { id: input.id } }).catch(() => {});

        const message =
          error instanceof Error ? error.message : "Failed to create user account";

        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message });
      }

      return { id: input.id };
    }),
  setEmployeeBan: adminProcedure
    .input(
      z.object({
        employeeId: z.string(),
        banned: z.boolean(),
        reason: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const user = await db.user.findUnique({
        where: { username: input.employeeId },
        select: { id: true },
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User account not found for this employee",
        });
      }

      await db.$transaction([
        db.user.update({
          where: { id: user.id },
          data: {
            banned: input.banned,
            banReason: input.banned ? input.reason || "Removed by admin" : null,
            banExpires: null,
          },
        }),
        // ตัด session ที่ค้างอยู่ทันทีเมื่อโดน ban
        ...(input.banned
          ? [db.session.deleteMany({ where: { userId: user.id } })]
          : []),
      ]);

      return { success: true };
    }),

  // ---------- Phase 3: Approval chain ----------
  updateApprovalChain: adminProcedure
    .input(
      z.object({
        employeeId: z.string(),
        checkerId: z.string().nullable(),
        approverId: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      if (input.approverId === input.employeeId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Approver cannot be the employee themselves",
        });
      }

      if (input.checkerId === input.employeeId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Checker cannot be the employee themselves",
        });
      }

      const ids = [input.employeeId, input.approverId, input.checkerId].filter(
        (id): id is string => !!id,
      );

      const found = await db.employee.findMany({
        where: { id: { in: ids } },
        select: { id: true },
      });

      const foundIds = new Set(found.map((e) => e.id));
      const missing = ids.filter((id) => !foundIds.has(id));

      if (missing.length > 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Employee not found: ${missing.join(", ")}`,
        });
      }

      const result = await db.$transaction(async (tx) => {
        const approval = await tx.approval.upsert({
          where: { employeeId: input.employeeId },
          create: {
            employeeId: input.employeeId,
            checkerId: input.checkerId,
            approverId: input.approverId,
          },
          update: {
            checkerId: input.checkerId,
            approverId: input.approverId,
          },
        });

        await tx.task.updateMany({
          where: { ownerId: input.employeeId },
          data: { approvalId: approval.id },
        });

        // ถ้าสายใหม่ไม่มี checker แต่ task ค้างอยู่ที่ Evaluator 1 ให้ขยับไป Evaluator 2
        let advanced = 0;
        if (!input.checkerId) {
          const res = await tx.task.updateMany({
            where: {
              ownerId: input.employeeId,
              status: Status.WAITING_APPROVER_1,
            },
            data: { status: Status.WAITING_APPROVER_2 },
          });
          advanced = res.count;
        }

        return { advancedTasks: advanced };
      });

      return result;
    }),

  // ---------- Phase 4: Task status rollback ----------
  getTasks: adminProcedure
    .input(
      z.object({
        year: z.number(),
        type: z.enum(FormType).optional(),
      }),
    )
    .query(async ({ input }) => {
      const tasks = await db.task.findMany({
        where: {
          form: {
            year: input.year,
            ...(input.type ? { type: input.type } : {}),
          },
        },
        include: {
          ...taskChainInclude,
          form: true,
        },
        orderBy: [{ ownerId: "asc" }, { createdAt: "asc" }],
      });

      return tasks.map((task) => {
        const chain = getApprovalChain(task);

        return {
          id: task.id,
          formId: task.formId,
          formType: task.form.type,
          year: task.form.year,
          period:
            (task.context as { period?: Period } | null)?.period ?? Period.IN_DRAFT,
          status: task.status,
          owner: { id: chain.owner.id, name: chain.owner.name },
          checker: chain.checker
            ? { id: chain.checker.id, name: chain.checker.name }
            : null,
          approver: chain.approver
            ? { id: chain.approver.id, name: chain.approver.name }
            : { id: "", name: "" },
          updatedAt: task.updatedAt,
        };
      });
    }),
  setTaskStatus: adminProcedure
    .input(
      z.object({
        taskId: z.string(),
        status: z.enum(Status),
      }),
    )
    .mutation(async ({ input }) => {
      const task = await db.task.findUnique({
        where: { id: input.taskId },
      });

      if (!task) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Task not found" });
      }

      // เคลียร์ timestamp ให้สอดคล้องกับสถานะปลายทาง
      const clearChecked =
        input.status === Status.NOT_STARTED ||
        input.status === Status.IN_DRAFT ||
        input.status === Status.WAITING_APPROVER_1;

      const clearApproved = input.status !== Status.COMPLETED;

      const updated = await db.task.update({
        where: { id: input.taskId },
        data: {
          status: input.status,
          ...(clearChecked ? { checkedAt: null } : {}),
          ...(clearApproved
            ? { approvedAt: null }
            : { approvedAt: task.approvedAt ?? new Date() }),
        },
      });

      return { id: updated.id, status: updated.status };
    }),

  // ---------- Phase 5: Evaluation windows ----------
  getWindows: adminProcedure.query(async () => {
      const windows = await db.evaluationWindow.findMany();

      return WINDOW_DEFINITIONS.map((def) => {
        const window = windows.find(
          (w) => w.formType === def.formType && w.period === def.period,
        );

        return {
          ...def,
          open: parseMonthDay(window?.open) ?? null,
          close: parseMonthDay(window?.close) ?? null,
        };
      });
    }),
  upsertWindow: adminProcedure
    .input(
      z.object({
        formType: z.enum(FormType),
        period: z.enum(Period),
        open: z.object({
          month: z.number().int().min(1).max(12),
          day: z.number().int().min(1).max(31),
        }),
        close: z.object({
          month: z.number().int().min(1).max(12),
          day: z.number().int().min(1).max(31),
        }),
      }),
    )
    .mutation(async ({ input }) => {
      const open = parseMonthDay(input.open);
      const close = parseMonthDay(input.close);

      if (!open || !close) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid month/day",
        });
      }

      if (open.month === close.month && open.day === close.day) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Close date must be after open date",
        });
      }

      const window = await db.evaluationWindow.upsert({
        where: {
          formType_period: {
            formType: input.formType,
            period: input.period,
          },
        },
        create: {
          formType: input.formType,
          period: input.period,
          open: { month: open.month, day: open.day },
          close: { month: close.month, day: close.day },
        },
        update: {
          open: { month: open.month, day: open.day },
          close: { month: close.month, day: close.day },
        },
      });

      return { id: window.id };
    }),
  deleteWindow: adminProcedure
    .input(
      z.object({
        formType: z.enum(FormType),
        period: z.enum(Period),
      }),
    )
    .mutation(async ({ input }) => {
      await db.evaluationWindow.deleteMany({
        where: {
          formType: input.formType,
          period: input.period,
        },
      });

      return { success: true };
    }),

  // ---------- Phase 6: Reports ----------
  getEmployeeForms: adminProcedure
    .input(
      z.object({
        employeeId: z.string(),
        year: z.number(),
      }),
    )
    .query(async ({ input }) => {
      const forms = await db.form.findMany({
        where: {
          employeeId: input.employeeId,
          year: input.year,
        },
        include: {
          tasks: true,
        },
        orderBy: { type: "asc" },
      });

      return forms.map((form) => ({
        id: form.id,
        type: form.type,
        year: form.year,
        tasks: form.tasks.map((task) => ({
          id: task.id,
          status: task.status,
          period:
            (task.context as { period?: Period } | null)?.period ??
            Period.IN_DRAFT,
        })),
      }));
    }),
  exportForm: adminProcedure
    .input(
      z.object({
        formId: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      const form = await db.form.findUnique({
        where: { id: input.formId },
        select: { id: true, type: true },
      });

      if (!form) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      if (form.type === FormType.KPI) {
        const kpiForm = await db.form.findUnique({
          where: { id: input.formId },
          include: {
            kpis: true,
            employee: true,
            tasks: true,
          },
        });

        if (!kpiForm || kpiForm.tasks.length === 0) {
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
            columns: kpiColumns,
          },
        ]);

        return { file, id: kpiForm.id, type: form.type };
      }

      const meritForm = await db.form.findUnique({
        where: { id: input.formId, type: FormType.MERIT },
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

      if (!meritForm || meritForm.tasks.length === 0) {
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
          columns: meritColumns,
        },
      ]);

      return { file, id: meritForm.id, type: form.type };
    }),
});
