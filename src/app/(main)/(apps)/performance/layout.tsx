import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { headers } from "next/headers";
import { Suspense } from "react";

import { Header } from "@/components/header";
import { Loader } from "@/components/loader";
import { prefetchPerformancePage } from "@/modules/performance/server/prefetch-performance";
import { loadSearchParams } from "@/stores/search-params";
import { getQueryClient } from "@/trpc/server";

const Layout = async (props: LayoutProps<"/performance">) => {
  const pathname = (await headers()).get("x-pathname") ?? "";

  if (pathname.startsWith("/performance/admin")) {
    return (
      <div className="order-3 flex h-full w-full flex-col bg-transparent relative">
        {props.children}
      </div>
    );
  }

  const { year } = await loadSearchParams(props.params);

  await prefetchPerformancePage(year);

  const queryClient = getQueryClient();

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<Loader />}>
        <div className="order-3 flex flex-col w-full bg-transparent relative">
          <Header />
          <main className="grow-0 shrink flex flex-col bg-background z-1 h-full max-h-full w-full overflow-hidden">
            <div className="contents">{props.children}</div>
          </main>
        </div>
      </Suspense>
    </HydrationBoundary>
  );
};

export default Layout;
