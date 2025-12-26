import { Header } from "@/components/header";
import { loadSearchParams } from "@/stores/search-params";
import { getQueryClient, trpc } from "@/trpc/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { Suspense } from "react";

const Layout = async (props: LayoutProps<"/performance">) => {
  const { year } = await loadSearchParams(props.params);

  const queryClient = getQueryClient();

  void queryClient.prefetchQuery(trpc.task.todo.queryOptions());
  void queryClient.prefetchQuery(trpc.kpi.getInfo.queryOptions({ year }));
  void queryClient.prefetchQuery(trpc.merit.getInfo.queryOptions({ year }));
  void queryClient.prefetchQuery(trpc.task.getManyByYear.queryOptions({ year }));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<div>Loading...</div>}>
        <div className="order-3 flex flex-col w-full bg-transparent relative">
          <Header />
          <main className="grow-0 shrink flex flex-col bg-background z-1 h-full max-h-full w-full overflow-hidden">
            <div className="contents">
              {props.children}
            </div>
          </main>
        </div>
      </Suspense>
    </HydrationBoundary>
  );
}

export default Layout;