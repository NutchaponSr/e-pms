import { createTRPCRouter } from "@/trpc/init";

import { taskProcedure } from "@/modules/tasks/server/procedure";

export const appRouter = createTRPCRouter({

  task: taskProcedure,
});

export type AppRouter = typeof appRouter;