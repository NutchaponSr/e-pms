import { createTRPCRouter } from "@/trpc/init";

import { kpiProcedure } from "@/modules/kpi/server/procedure";
import { taskProcedure } from "@/modules/tasks/server/procedure";

export const appRouter = createTRPCRouter({
  kpi: kpiProcedure,
  task: taskProcedure,
});

export type AppRouter = typeof appRouter;