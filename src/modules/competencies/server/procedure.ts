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
      const search = input.search?.trim();

      const res = await db.competency.findMany({
        where: {
          type: {
            in: input.types,
          },
          ...(search
            ? {
                OR: [
                  {
                    name: {
                      contains: search,
                      mode: "insensitive",
                    },
                  },
                  {
                    definition: {
                      contains: search,
                      mode: "insensitive",
                    },
                  },
                ],
              }
            : {}),
        },
      });

      return res;
    })
});