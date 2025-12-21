import { Suspense } from "react";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { FormType } from "@/generated/prisma/enums";
import { getQueryClient, trpc } from "@/trpc/server";
import { loadSearchParams } from "@/stores/search-params";

import { PerformanceView } from "@/modules/performance/ui/views/performance-view";

const Page = async (props: PageProps<"/performance">) => {
  const { year } = await loadSearchParams(props.searchParams);

  const queryClient = getQueryClient();

  void queryClient.prefetchQuery(trpc.task.todo.queryOptions());
  void queryClient.prefetchQuery(trpc.task.getOne.queryOptions({ year, type: FormType.KPI }));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense>
        <PerformanceView year={year} />
      </Suspense>
    </HydrationBoundary>
  );
}

export default Page;