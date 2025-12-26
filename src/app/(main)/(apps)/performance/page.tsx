import { Suspense } from "react";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { getQueryClient, trpc } from "@/trpc/server";
import { loadSearchParams } from "@/stores/search-params";

import { PerformanceView } from "@/modules/performance/ui/views/performance-view";

export const dynamic = "force-dynamic";

const Page = async (props: PageProps<"/performance">) => {
  const { year } = await loadSearchParams(props.searchParams);

  const queryClient = getQueryClient();

  void queryClient.prefetchQuery(trpc.task.todo.queryOptions());
  void queryClient.prefetchQuery(trpc.kpi.getInfo.queryOptions({ year }));
  void queryClient.prefetchQuery(trpc.merit.getInfo.queryOptions({ year }));
  void queryClient.prefetchQuery(trpc.task.getManyByYear.queryOptions({ year }));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<div>Loading...</div>}>
        <PerformanceView year={year} />
      </Suspense>
    </HydrationBoundary>
  );
}

export default Page;