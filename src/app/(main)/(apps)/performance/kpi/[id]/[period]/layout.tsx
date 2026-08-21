import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { Loader } from "@/components/loader";
import { parseKpiPeriodParam } from "@/modules/kpi/constants";
import { getQueryClient, trpc } from "@/trpc/server";

const Layout = async (props: LayoutProps<"/performance/kpi/[id]/[period]">) => {
  const params = await props.params;
  const period = parseKpiPeriodParam(params.period);

  if (!period) {
    notFound();
  }

  const queryClient = getQueryClient();

  void queryClient.prefetchQuery(
    trpc.kpi.getOne.queryOptions({ id: params.id, period }),
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<Loader />}>
        <div className="flex flex-col w-full h-full cursor-default bg-background overflow-x-hidden overflow-y-auto">
          {props.children}
        </div>
      </Suspense>
    </HydrationBoundary>
  );
};

export default Layout;
