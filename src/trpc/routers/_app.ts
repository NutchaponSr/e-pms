import { createTRPCRouter } from "@/trpc/init";

import { kpiProcedure } from "@/modules/kpi/server/procedure";
import { taskProcedure } from "@/modules/tasks/server/procedure";
import { meritProcedure } from "@/modules/merit/server/procedure";
import { commentProcedure } from "@/modules/comments/server/procedure";
import { competencyProcedure } from "@/modules/competencies/server/procedure";

export const appRouter = createTRPCRouter({
  kpi: kpiProcedure,
  task: taskProcedure,
  merit: meritProcedure,
  comment: commentProcedure,
  competency: competencyProcedure,
});

export type AppRouter = typeof appRouter;