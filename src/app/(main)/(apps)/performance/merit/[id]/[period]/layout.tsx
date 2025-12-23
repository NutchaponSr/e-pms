import { Suspense } from "react";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { getQueryClient, trpc } from "@/trpc/server";
import { Period } from "@/generated/prisma/enums";

const PERIODS: Record<string, Period> = {
  definition: Period.IN_DRAFT,
  evaluation: Period.EVALUATION,
  evaluation1st: Period.EVALUATION_1ST,
  evaluation2nd: Period.EVALUATION_2ND,
};
  

const Layout = async (props: LayoutProps<"/performance/merit/[id]/[period]">) => {
  const params = await props.params;

  const queryClient = getQueryClient();

  void queryClient.prefetchQuery(trpc.merit.getOne.queryOptions({ id: params.id, period: PERIODS[params.period] as Period }));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<div>Loading...</div>}>
        <div className="flex flex-col w-full h-full cursor-default bg-background overflow-x-hidden overflow-y-auto">
          {props.children}
        </div>
      </Suspense>
    </HydrationBoundary>
  );
}

export default Layout;