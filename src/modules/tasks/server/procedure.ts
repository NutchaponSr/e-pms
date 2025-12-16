import z from "zod/v4";
import path from "path";
import db from "@/lib/db";

import { readCSV } from "@/seeds/lib/utils";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { FormType, Period, Status } from "@/generated/prisma/enums";

import { generateTaskId } from "@/modules/tasks/utils";

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
          draft: form?.tasks.find((t) => (t.context as { period: Period })?.period === Period.IN_DRAFT),
          evaluation: form?.tasks.find((t) => (t.context as { period: Period })?.period === Period.EVALUATION),
          evaluation1st: form?.tasks.find((t) => (t.context as { period: Period })?.period === Period.EVALUATION_1ST),
          evaluation2nd: form?.tasks.find((t) => (t.context as { period: Period })?.period === Period.EVALUATION_2ND),
        } 
      };
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

      const existingForm = await db.form.findFirst({
        where: {
          type: input.type,
          year: input.year,
        },
      });

      if (existingForm) {
        await db.task.create({
          data: {
            id: generateTaskId(),
            ownerId: ctx.user.username,
            checkerId: record?.checker,
            approverId: record?.approver,
            formId: existingForm.id,
            status: Status.IN_DRAFT,
            context: {
              period: input.period,
            },
          },
        });

        return { id: existingForm.id };
      }

      const form = await db.form.create({
        data: {
          type: input.type,
          year: input.year,
          tasks: {
            create: {
              id: generateTaskId(),
              ownerId: ctx.user.username,
              checkerId: record?.checker,
              approverId: record?.approver,
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
});
