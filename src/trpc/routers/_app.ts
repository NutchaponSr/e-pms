import { createTRPCRouter } from "@/trpc/init";

import { kpiProcedure } from "@/modules/kpi/server/procedure";
import { taskProcedure } from "@/modules/tasks/server/procedure";
import { commentProcedure } from "@/modules/comments/server/procedure";

export const appRouter = createTRPCRouter({
  kpi: kpiProcedure,
  task: taskProcedure,
  comment: commentProcedure,
});

export type AppRouter = typeof appRouter;