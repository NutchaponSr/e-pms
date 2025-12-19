import db from "@/lib/db";

import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "@/trpc/init";

export const commentProcedure = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        connectId: z.string(),
        content: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
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
    .mutation(async ({ input }) => {
      await db.comment.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),
})