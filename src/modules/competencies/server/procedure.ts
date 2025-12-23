import db from "@/lib/db";

import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { CompetencyType } from "@/generated/prisma/enums";

export const competencyProcedure = createTRPCRouter({
  getMany: protectedProcedure
    .input(
      z.object({
        types: z.array(z.enum(CompetencyType)),
      }),
    )
    .query(async ({ input }) => {
      const res = await db.competency.findMany({
        where: {
          type: {
            in: input.types,
          },
        },
      });

      return res;
    })
});