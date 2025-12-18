import { Suspense } from "react";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { getQueryClient, trpc } from "@/trpc/server";

import { KpiLayout } from "@/modules/kpi/ui/layouts/kpi-layout";
import { Period } from "@/generated/prisma/client";

const PERIODS: Record<string, Period> = {
  definition: Period.IN_DRAFT,
  evaluation: Period.EVALUATION,
};

const Layout = async (props: {
  params: Promise<{ id: string; period: string }>;
  children: React.ReactNode;
}) => {
  const queryClient = getQueryClient();
  const params = await props.params;

  const periodValue = PERIODS[params.period] || Period.IN_DRAFT;

  void queryClient.prefetchQuery(
    trpc.kpi.getOne.queryOptions({ id: params.id, period: periodValue }),
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<div>Loading...</div>}>
        <div className="flex flex-col w-full h-full cursor-default bg-background overflow-x-hidden overflow-y-auto">
          <KpiLayout id={params.id} period={periodValue} />
          {props.children}
        </div>
      </Suspense>
    </HydrationBoundary>
  );
};

export default Layout;
