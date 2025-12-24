import db from "@/lib/db";

import { createTRPCRouter, protectedProcedure } from "@/trpc/init";

export const cultureProcedure = createTRPCRouter({
  getMany: protectedProcedure
    .query(async () => {
      const res = await db.culture.findMany();

      return res;
    })
});