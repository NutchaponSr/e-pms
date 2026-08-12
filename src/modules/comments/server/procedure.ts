import db from "@/lib/db";

import { z } from "zod";

import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { Period } from "@/generated/prisma/enums";
import { assertAnyRoleOnForm, requireTaskRole } from "@/modules/tasks/access";

async function resolveConnectTarget(
  connectId: string,
): Promise<{ formId: string; period: Period | null } | null> {
  const kpi = await db.kpiEvaluation.findUnique({
    where: { id: connectId },
    select: { formId: true },
  });
  if (kpi) return { formId: kpi.formId, period: null };

  const competency = await db.competencyEvaluation.findUnique({
    where: { id: connectId },
    select: { period: true, competencyRecord: { select: { meritFormId: true } } },
  });
  if (competency) {
    return { formId: competency.competencyRecord.meritFormId, period: competency.period };
  }

  const culture = await db.cultureEvaluation.findUnique({
    where: { id: connectId },
    select: { period: true, cultureRecord: { select: { meritFormId: true } } },
  });
  if (culture) {
    return { formId: culture.cultureRecord.meritFormId, period: culture.period };
  }

  return null;
}

export const commentProcedure = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        connectId: z.string(),
        content: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const target = await resolveConnectTarget(input.connectId);

      if (!target) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      if (target.period) {
        await requireTaskRole(target.formId, target.period, ctx.user.username, ["read"]);
      } else {
        await assertAnyRoleOnForm(target.formId, ctx.user.username);
      }

      await db.comment.create({
        data: {
          connectId: input.connectId,
          content: input.content,
          createdBy: ctx.user.username,
        },
      });

      return { success: true };
    }),
  delete: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const comment = await db.comment.findUnique({
        where: { id: input.id },
        select: { createdBy: true },
      });

      if (!comment) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      if (comment.createdBy !== ctx.user.username) {
        throw new TRPCError({ code: "FORBIDDEN", message: "No permission to delete this comment" });
      }

      await db.comment.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),
})
