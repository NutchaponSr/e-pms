import db from "@/lib/db";

import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { CompetencyType } from "@/generated/prisma/enums";

export const competencyProcedure = createTRPCRouter({
  getMany: protectedProcedure
    .input(
      z.object({
        search: z.string().optional(),
        types: z.array(z.enum(CompetencyType)),
      }),
    )
    .query(async ({ input }) => {
      const res = await db.competency.findMany({
        where: {
          AND: [
            {
              type: {
                in: input.types,
              },
            },
            {
              OR: [
                {
                  name: {
                    contains: input.search,
                    mode: "insensitive",
                  },
                },
                {
                  definition: {
                    contains: input.search,
                    mode: "insensitive",
                  },
                },
              ],
            }
          ]
        }
      });

      return res;
    })
});