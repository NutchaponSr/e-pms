import { getQueryClient, trpc } from "@/trpc/server";

export async function prefetchPerformancePage(year: number) {
  const queryClient = getQueryClient();

  await Promise.all([
    queryClient.prefetchQuery(trpc.task.todo.queryOptions()),
    queryClient.prefetchQuery(trpc.kpi.getInfo.queryOptions({ year })),
    queryClient.prefetchQuery(trpc.merit.getInfo.queryOptions({ year })),
    queryClient.prefetchQuery(trpc.task.getManyByYear.queryOptions({ year })),
  ]);
}
